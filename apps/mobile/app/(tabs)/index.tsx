import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { PulsingDot } from "../../components/PulsingDot";

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const accounts = useQuery(api.queries.accounts.getAccounts);
  const recentTransactions = useQuery(api.queries.accounts.getRecentTransactions);
  const upcomingRepayment = useQuery(api.queries.loans.getUpcomingRepayment);

  const defaultAccount = accounts?.[0];
  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0;
  const pendingCount = recentTransactions?.filter((t) => t.status === "PENDING").length ?? 0;

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>GHS {totalBalance.toFixed(2)}</Text>
        {defaultAccount && (
          <Text style={styles.accountNumber}>
            Account: {defaultAccount.accountNumber}
          </Text>
        )}
      </View>

      {/* Pending transactions banner */}
      {pendingCount > 0 && (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={() => router.push("/(tabs)/transactions")}
          activeOpacity={0.8}
        >
          <PulsingDot color="#D97706" size={6} />
          <Text style={styles.pendingBannerText}>
            {pendingCount} transaction{pendingCount > 1 ? "s" : ""} processing
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#92400E" />
        </TouchableOpacity>
      )}

      {/* Upcoming repayment banner */}
      {upcomingRepayment && upcomingRepayment.daysUntil <= 7 && (
        <TouchableOpacity
          style={[
            styles.pendingBanner,
            upcomingRepayment.daysUntil <= 1 ? styles.repaymentUrgentBanner : styles.repaymentBanner,
          ]}
          onPress={() => router.push("/(tabs)/loans")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={upcomingRepayment.daysUntil <= 1 ? "#991B1B" : "#1E40AF"}
          />
          <Text style={[
            styles.pendingBannerText,
            { color: upcomingRepayment.daysUntil <= 1 ? "#991B1B" : "#1E40AF" },
          ]}>
            {upcomingRepayment.daysUntil === 0
              ? "Repayment due today"
              : upcomingRepayment.daysUntil === 1
              ? "Repayment due tomorrow"
              : `Repayment due in ${upcomingRepayment.daysUntil} days`}
            {" — "}GHS {upcomingRepayment.amount.toFixed(2)}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={upcomingRepayment.daysUntil <= 1 ? "#991B1B" : "#1E40AF"} />
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/transactions/deposit")}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#DCFCE7" }]}>
            <Ionicons name="arrow-down" size={24} color="#10B981" />
          </View>
          <Text style={styles.actionText}>Deposit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/transactions/withdraw")}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#FEE2E2" }]}>
            <Ionicons name="arrow-up" size={24} color="#EF4444" />
          </View>
          <Text style={styles.actionText}>Withdraw</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/transactions/transfer")}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#EFF6FF" }]}>
            <Ionicons name="swap-horizontal" size={24} color="#2563EB" />
          </View>
          <Text style={styles.actionText}>Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/loans/apply")}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#FEF3C7" }]}>
            <Ionicons name="document-text-outline" size={24} color="#D97706" />
          </View>
          <Text style={styles.actionText}>Apply Loan</Text>
        </TouchableOpacity>
      </View>

      {/* Accounts Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Accounts</Text>
          <TouchableOpacity onPress={() => router.push("/accounts")}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {accounts?.slice(0, 2).map((account) => (
          <TouchableOpacity
            key={account._id}
            style={styles.accountCard}
            onPress={() => router.push(`/account/${account._id}`)}
          >
            <View style={styles.accountInfo}>
              <View style={styles.accountTypeIcon}>
                <Ionicons name="wallet" size={20} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.accountType}>{account.type}</Text>
                <Text style={styles.accountNumberSmall}>{account.accountNumber}</Text>
              </View>
            </View>
            <Text style={styles.accountBalance}>GHS {account.balance.toFixed(2)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push("/transactions")}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions?.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No transactions yet</Text>
          </View>
        ) : (
          recentTransactions?.slice(0, 5).map((transaction) => (
            <TouchableOpacity
              key={transaction._id}
              onPress={() => router.push(`/transactions/${transaction._id}`)}
              activeOpacity={0.7}
            >
              <TransactionItem transaction={transaction} />
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function TransactionItem({ transaction }: { transaction: any }) {
  const isDeposit = transaction.type === "DEPOSIT";

  return (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[
          styles.transactionIcon,
          isDeposit ? styles.depositIcon : styles.withdrawalIcon
        ]}>
          <Ionicons
            name={isDeposit ? "arrow-down" : "arrow-up"}
            size={16}
            color={isDeposit ? "#10B981" : "#EF4444"}
          />
        </View>
        <View>
          <Text style={styles.transactionTitle}>
            {transaction.description || transaction.type}
          </Text>
          <Text style={styles.transactionMethod}>{transaction.method}</Text>
          <Text style={styles.transactionDate}>
            {new Date(transaction.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          isDeposit ? styles.depositAmount : styles.withdrawalAmount
        ]}>
          {isDeposit ? "+" : "-"} GHS {transaction.amount.toFixed(2)}
        </Text>
        <View style={[
          styles.statusBadge,
          transaction.status === "COMPLETED" ? styles.statusCompleted : styles.statusPending
        ]}>
          <Text style={styles.statusText}>{transaction.status}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  balanceCard: {
    backgroundColor: "#2563EB",
    margin: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.9,
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "700",
    marginTop: 4,
  },
  accountNumber: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.8,
    marginTop: 8,
  },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pendingBannerText: { flex: 1, fontSize: 13, color: "#92400E", fontWeight: "500" },
  repaymentBanner: {
    backgroundColor: "#EFF6FF",
    borderBottomColor: "#BFDBFE",
  },
  repaymentUrgentBanner: {
    backgroundColor: "#FEF2F2",
    borderBottomColor: "#FECACA",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  actionButton: {
    alignItems: "center",
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  seeAll: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "500",
  },
  accountCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  accountTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  accountType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  accountNumberSmall: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    color: "#6B7280",
    marginTop: 8,
  },
  transactionItem: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  depositIcon: {
    backgroundColor: "#DCFCE7",
  },
  withdrawalIcon: {
    backgroundColor: "#FEE2E2",
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  transactionMethod: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  depositAmount: {
    color: "#10B981",
  },
  withdrawalAmount: {
    color: "#EF4444",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  statusCompleted: {
    backgroundColor: "#DCFCE7",
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
