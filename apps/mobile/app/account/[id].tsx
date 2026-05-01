import { useQuery } from "convex/react";
import { useLocalSearchParams, router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const account = useQuery(api.queries.accounts.getAccountById, {
    accountId: id as Id<"accounts">,
  });
  const transactions = useQuery(api.queries.accounts.getAccountTransactions, {
    accountId: id as Id<"accounts">,
  });

  if (account === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!account) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Account not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceCardHeader}>
          <Text style={styles.accountType}>{account.type}</Text>
          {account.isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>Active</Text>
            </View>
          )}
        </View>
        <Text style={styles.accountNumber}>{account.accountNumber}</Text>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>GHS {account.balance.toFixed(2)}</Text>
        <Text style={styles.currency}>{account.currency}</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/transactions/deposit")}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#DCFCE7" }]}>
            <Ionicons name="arrow-down" size={22} color="#10B981" />
          </View>
          <Text style={styles.actionText}>Deposit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/transactions/withdraw")}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#FEE2E2" }]}>
            <Ionicons name="arrow-up" size={22} color="#EF4444" />
          </View>
          <Text style={styles.actionText}>Withdraw</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/transactions/transfer")}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#EFF6FF" }]}>
            <Ionicons name="swap-horizontal" size={22} color="#2563EB" />
          </View>
          <Text style={styles.actionText}>Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/account/statement?id=${id}`)}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#F5F3FF" }]}>
            <Ionicons name="document-text-outline" size={22} color="#7C3AED" />
          </View>
          <Text style={styles.actionText}>Statement</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transactions</Text>

        {transactions?.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          transactions?.map((tx) => {
            const isDeposit = tx.type === "DEPOSIT";
            return (
              <View key={tx._id} style={styles.transactionItem}>
                <View style={[styles.txIcon, isDeposit ? styles.depositBg : styles.withdrawalBg]}>
                  <Ionicons
                    name={isDeposit ? "arrow-down" : "arrow-up"}
                    size={14}
                    color={isDeposit ? "#10B981" : "#EF4444"}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDescription}>
                    {tx.description || tx.type}
                  </Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: isDeposit ? "#10B981" : "#EF4444" }]}>
                    {isDeposit ? "+" : "-"} GHS {tx.amount.toFixed(2)}
                  </Text>
                  <Text style={styles.txStatus}>{tx.status}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
  },
  balanceCard: {
    backgroundColor: "#2563EB",
    margin: 16,
    padding: 20,
    borderRadius: 20,
  },
  balanceCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountType: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.9,
  },
  activeBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  accountNumber: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
    marginBottom: 16,
  },
  balanceLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    opacity: 0.8,
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "700",
    marginTop: 4,
  },
  currency: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  actionButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
  },
  transactionItem: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  txIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  depositBg: {
    backgroundColor: "#DCFCE7",
  },
  withdrawalBg: {
    backgroundColor: "#FEE2E2",
  },
  txInfo: {
    flex: 1,
  },
  txDescription: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  txDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  txRight: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  txStatus: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
});
