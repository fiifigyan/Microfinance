import { query } from "../_generated/server";

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return null;

    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(50);

    const activeAccounts = accounts.filter((a) => a.isActive);
    const totalBalance = activeAccounts.reduce((sum, a) => sum + a.balance, 0);

    const loans = await ctx.db
      .query("loans")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(50);

    const activeLoans = loans.filter(
      (l) => l.status === "ACTIVE" || l.status === "DISBURSED",
    ).length;

    const pendingLoans = loans.filter((l) => l.status === "PENDING").length;

    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? null,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      stats: {
        totalBalance,
        accountCount: activeAccounts.length,
        activeLoans,
        pendingLoans,
      },
      accounts: activeAccounts.map((a) => ({
        _id: a._id,
        accountNumber: a.accountNumber,
        type: a.type,
        balance: a.balance,
        currency: a.currency,
      })),
    };
  },
});
