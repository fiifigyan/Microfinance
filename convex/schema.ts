import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table
  users: defineTable({
    clerkId: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    isVerified: v.boolean(),
    role: v.union(
      v.literal("CUSTOMER"),
      v.literal("AGENT"),
      v.literal("ADMIN"),
    ),
    pushToken: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_phone", ["phone"]),

  // Accounts table
  accounts: defineTable({
    accountNumber: v.string(),
    userId: v.id("users"),
    type: v.union(
      v.literal("SAVINGS"),
      v.literal("CURRENT"),
      v.literal("FIXED_DEPOSIT"),
    ),
    balance: v.number(),
    currency: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_accountNumber", ["accountNumber"]),

  // Transactions table
  transactions: defineTable({
    transactionId: v.string(),
    accountId: v.id("accounts"),
    userId: v.id("users"),
    type: v.union(
      v.literal("DEPOSIT"),
      v.literal("WITHDRAWAL"),
      v.literal("TRANSFER"),
    ),
    amount: v.number(),
    fee: v.number(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("COMPLETED"),
      v.literal("FAILED"),
    ),
    method: v.union(
      v.literal("MTN_MOMO"),
      v.literal("VODAFONE_CASH"),
      v.literal("AIRTELTIGO_MONEY"),
      v.literal("BANK_TRANSFER"),
    ),
    reference: v.string(),
    externalReference: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_accountId", ["accountId"])
    .index("by_userId", ["userId"])
    .index("by_reference", ["reference"])
    .index("by_status", ["status"]),

  // Loans table
  loans: defineTable({
    loanNumber: v.string(),
    userId: v.id("users"),
    accountId: v.id("accounts"),
    product: v.union(
      v.literal("SMALL_LOAN"),
      v.literal("INDIVIDUAL_LOAN"),
      v.literal("SME_LOAN"),
      v.literal("EDUCATION_LOAN"),
      v.literal("ASSET_FINANCING"),
    ),
    principal: v.number(),
    interestRate: v.number(),
    totalInterest: v.number(),
    totalAmount: v.number(),
    term: v.number(),
    purpose: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("APPROVED"),
      v.literal("DISBURSED"),
      v.literal("ACTIVE"),
      v.literal("COMPLETED"),
      v.literal("DEFAULTED"),
      v.literal("REJECTED"),
    ),
    applicationDate: v.number(),
    approvalDate: v.optional(v.number()),
    disbursementDate: v.optional(v.number()),
    firstRepaymentDate: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_loanNumber", ["loanNumber"]),

  // Notifications table
  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_read", ["userId", "read"]),

  // KYC documents table
  kycDocuments: defineTable({
    userId: v.id("users"),
    documentType: v.union(
      v.literal("NATIONAL_ID"),
      v.literal("PASSPORT"),
      v.literal("DRIVERS_LICENSE"),
      v.literal("VOTERS_CARD"),
    ),
    documentNumber: v.string(),
    fullName: v.string(),
    dateOfBirth: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("APPROVED"),
      v.literal("REJECTED"),
    ),
    reviewedBy: v.optional(v.id("users")),
    reviewNote: v.optional(v.string()),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  // Loan Repayments table
  loanRepayments: defineTable({
    loanId: v.id("loans"),
    userId: v.id("users"),
    amount: v.number(),
    principalPaid: v.number(),
    interestPaid: v.number(),
    dueDate: v.number(),
    paidDate: v.optional(v.number()),
    status: v.union(
      v.literal("PENDING"),
      v.literal("PAID"),
      v.literal("OVERDUE"),
      v.literal("PARTIAL"),
    ),
    method: v.union(
      v.literal("MTN_MOMO"),
      v.literal("VODAFONE_CASH"),
      v.literal("AIRTELTIGO_MONEY"),
      v.literal("BANK_TRANSFER"),
      v.literal("CASH"),
    ),
    reference: v.string(),
    createdAt: v.number(),
  })
    .index("by_loanId", ["loanId"])
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_reference", ["reference"]),
});
