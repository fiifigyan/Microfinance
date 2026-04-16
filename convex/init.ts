import { mutation } from "./_generated/server";

export const seedDatabase = mutation({
  handler: async (ctx) => {
    // Create test user
    const userId = await ctx.db.insert("users", {
      clerkId: "test_user_kwame",
      email: "kwame@example.com",
      phone: "0244123456",
      firstName: "Kwame",
      lastName: "Nkrumah",
      isVerified: true,
      role: "CUSTOMER",
      createdAt: Date.now(),
    });

    // Create savings account
    const accountNumber = `ASA${Date.now().toString().slice(-8)}`;
    const accountId = await ctx.db.insert("accounts", {
      accountNumber,
      userId,
      type: "SAVINGS",
      balance: 500.0,
      currency: "GHS",
      isActive: true,
      createdAt: Date.now(),
    });

    // Create sample transaction
    await ctx.db.insert("transactions", {
      transactionId: `DEP-${Date.now()}`,
      accountId,
      userId,
      type: "DEPOSIT",
      amount: 500.0,
      fee: 0,
      status: "COMPLETED",
      method: "MTN_MOMO",
      reference: `INITIAL-${Date.now()}`,
      externalReference: `EXT-${Date.now()}`,
      description: "Initial deposit",
      createdAt: Date.now(),
      completedAt: Date.now(),
    });

    return { userId, accountId, accountNumber };
  },
});
