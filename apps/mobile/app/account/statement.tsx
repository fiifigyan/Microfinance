import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const PERIODS = [
  { label: "Last 30 days", days: 30 },
  { label: "Last 3 months", days: 90 },
  { label: "Last 6 months", days: 180 },
  { label: "This year", days: 365 },
  { label: "All time", days: 0 },
] as const;

const TYPE_COLOR: Record<string, string> = {
  DEPOSIT: "#10B981",
  WITHDRAWAL: "#EF4444",
  TRANSFER: "#2563EB",
};

export default function AccountStatementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [periodDays, setPeriodDays] = useState(30);

  const now = Date.now();
  const startDate = periodDays > 0 ? now - periodDays * 24 * 60 * 60 * 1000 : undefined;

  const statement = useQuery(api.queries.accounts.getAccountStatement, {
    accountId: id as Id<"accounts">,
    startDate,
  });

  async function handleShare() {
    if (!statement) return;
    const lines = [
      `Account Statement — ${statement.account.accountNumber}`,
      `Period: ${periodDays > 0 ? `Last ${periodDays} days` : "All time"}`,
      `Generated: ${new Date(statement.generatedAt).toLocaleDateString("en-GH")}`,
      "",
      `Total In:  GHS ${statement.summary.totalIn.toFixed(2)}`,
      `Total Out: GHS ${statement.summary.totalOut.toFixed(2)}`,
      `Net:       GHS ${statement.summary.net.toFixed(2)}`,
      "",
      "Transactions:",
      ...statement.transactions.map(
        (tx) =>
          `${new Date(tx.createdAt).toLocaleDateString("en-GH")}  ${tx.type.padEnd(12)}  ${tx.status === "COMPLETED" ? (tx.type === "DEPOSIT" ? "+" : "-") : " "} GHS ${tx.amount.toFixed(2)}  ${tx.reference}`,
      ),
    ];
    try {
      await Share.share({ message: lines.join("\n"), title: "Account Statement" });
    } catch {
      Alert.alert("Error", "Could not share statement.");
    }
  }

  if (statement === undefined) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  if (!statement) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Account not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Period Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.periodBar}
        contentContainerStyle={styles.periodBarContent}
      >
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.days}
            style={[styles.periodChip, periodDays === p.days && styles.periodChipActive]}
            onPress={() => setPeriodDays(p.days)}
          >
            <Text style={[styles.periodChipText, periodDays === p.days && styles.periodChipTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryAccountNum}>{statement.account.accountNumber}</Text>
          <Text style={styles.summaryAccountType}>{statement.account.type.replace(/_/g, " ")}</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Money In</Text>
              <Text style={[styles.summaryAmount, { color: "#10B981" }]}>
                + GHS {statement.summary.totalIn.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Money Out</Text>
              <Text style={[styles.summaryAmount, { color: "#EF4444" }]}>
                − GHS {statement.summary.totalOut.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Net</Text>
              <Text style={[styles.summaryAmount, { color: statement.summary.net >= 0 ? "#10B981" : "#EF4444" }]}>
                GHS {statement.summary.net.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={18} color="#2563EB" />
          <Text style={styles.shareBtnText}>Export Statement</Text>
        </TouchableOpacity>

        {/* Transactions */}
        <View style={styles.txSection}>
          <Text style={styles.txSectionTitle}>
            {statement.summary.count} transaction{statement.summary.count !== 1 ? "s" : ""}
          </Text>

          {statement.transactions.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>No transactions in this period</Text>
            </View>
          ) : (
            statement.transactions.map((tx) => {
              const isCredit = tx.type === "DEPOSIT";
              const color = TYPE_COLOR[tx.type] ?? "#6B7280";
              const isFailed = tx.status === "FAILED";
              return (
                <View key={tx._id} style={[styles.txRow, isFailed && styles.txRowFailed]}>
                  <View style={[styles.txIcon, { backgroundColor: isFailed ? "#F3F4F6" : `${color}1A` }]}>
                    <Ionicons
                      name={isCredit ? "arrow-down" : tx.type === "TRANSFER" ? "swap-horizontal" : "arrow-up"}
                      size={16}
                      color={isFailed ? "#9CA3AF" : color}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={[styles.txType, isFailed && styles.txFadedText]}>
                      {tx.description || tx.type}
                    </Text>
                    <Text style={styles.txDate}>
                      {new Date(tx.createdAt).toLocaleDateString("en-GH", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[
                      styles.txAmount,
                      { color: isFailed ? "#9CA3AF" : isCredit ? "#10B981" : "#111827" },
                    ]}>
                      {isFailed ? "—" : `${isCredit ? "+" : "−"} GHS ${tx.amount.toFixed(2)}`}
                    </Text>
                    {isFailed && (
                      <Text style={styles.txFailedBadge}>FAILED</Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#6B7280", fontSize: 14 },

  periodBar: { backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E5E7EB", maxHeight: 52 },
  periodBarContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  periodChipActive: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  periodChipText: { fontSize: 13, color: "#6B7280" },
  periodChipTextActive: { color: "#2563EB", fontWeight: "600" },

  summaryCard: {
    margin: 16,
    backgroundColor: "#1E3A8A",
    borderRadius: 16,
    padding: 20,
  },
  summaryAccountNum: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", letterSpacing: 1 },
  summaryAccountType: { fontSize: 12, color: "#93C5FD", marginTop: 2, marginBottom: 20 },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLabel: { fontSize: 11, color: "#93C5FD", marginBottom: 4 },
  summaryAmount: { fontSize: 13, fontWeight: "700" },
  summaryDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.15)" },

  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  shareBtnText: { fontSize: 14, color: "#2563EB", fontWeight: "600" },

  txSection: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  txSectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  txRowFailed: { opacity: 0.65 },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  txInfo: { flex: 1 },
  txType: { fontSize: 14, fontWeight: "500", color: "#111827" },
  txDate: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  txFadedText: { color: "#9CA3AF" },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 14, fontWeight: "600" },
  txFailedBadge: { fontSize: 10, color: "#EF4444", fontWeight: "600", marginTop: 2 },

  empty: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
});
