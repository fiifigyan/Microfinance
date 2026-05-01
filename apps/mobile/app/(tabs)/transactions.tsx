import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../../convex/_generated/api";
import { PulsingDot } from "../../components/PulsingDot";

type TxType = "ALL" | "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";
type TxStatus = "ALL" | "COMPLETED" | "PENDING" | "FAILED";

const TYPE_FILTERS: { label: string; value: TxType }[] = [
  { label: "All", value: "ALL" },
  { label: "Deposits", value: "DEPOSIT" },
  { label: "Withdrawals", value: "WITHDRAWAL" },
  { label: "Transfers", value: "TRANSFER" },
];

const STATUS_FILTERS: { label: string; value: TxStatus }[] = [
  { label: "All", value: "ALL" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Pending", value: "PENDING" },
  { label: "Failed", value: "FAILED" },
];

const METHOD_SHORT: Record<string, string> = {
  MTN_MOMO: "MTN MoMo",
  VODAFONE_CASH: "Vodafone Cash",
  AIRTELTIGO_MONEY: "AirtelTigo",
  BANK_TRANSFER: "Bank Transfer",
};

const TYPE_ICON: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  DEPOSIT:    { icon: "arrow-down",      color: "#10B981", bg: "#DCFCE7" },
  WITHDRAWAL: { icon: "arrow-up",        color: "#EF4444", bg: "#FEE2E2" },
  TRANSFER:   { icon: "swap-horizontal", color: "#2563EB", bg: "#EFF6FF" },
};

export default function TransactionsScreen() {
  const allTransactions = useQuery(api.queries.accounts.getRecentTransactions);
  const [typeFilter, setTypeFilter] = useState<TxType>("ALL");
  const [statusFilter, setStatusFilter] = useState<TxStatus>("ALL");

  const filtered = (allTransactions ?? []).filter((t) => {
    if (typeFilter !== "ALL" && t.type !== typeFilter) return false;
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    return true;
  });

  const pending = filtered.filter((t) => t.status === "PENDING");
  const settled = filtered.filter((t) => t.status !== "PENDING");

  const activeFilters = (typeFilter !== "ALL" ? 1 : 0) + (statusFilter !== "ALL" ? 1 : 0);

  return (
    <ScrollView style={styles.container} stickyHeaderIndices={[0]}>
      {/* ── Sticky filter bar ───────────────────────────── */}
      <View style={styles.filterBar}>
        {/* Type row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {TYPE_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.chip, typeFilter === f.value && styles.chipActive]}
              onPress={() => setTypeFilter(f.value)}
            >
              <Text style={[styles.chipText, typeFilter === f.value && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Status row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.chip, statusFilter === f.value && styles.chipActive]}
              onPress={() => setStatusFilter(f.value)}
            >
              <Text style={[styles.chipText, statusFilter === f.value && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
          {activeFilters > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => { setTypeFilter("ALL"); setStatusFilter("ALL"); }}
            >
              <Ionicons name="close-circle" size={14} color="#6B7280" />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* ── Result count ────────────────────────────────── */}
      <View style={styles.resultBar}>
        <Text style={styles.resultText}>
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
          {activeFilters > 0 ? " (filtered)" : ""}
        </Text>
      </View>

      {/* ── Processing banner ───────────────────────────── */}
      {pending.length > 0 && (
        <View style={styles.pendingBanner}>
          <PulsingDot color="#D97706" size={7} />
          <Text style={styles.pendingBannerText}>
            {pending.length} transaction{pending.length > 1 ? "s" : ""} processing
          </Text>
        </View>
      )}

      {/* ── Pending ─────────────────────────────────────── */}
      {pending.length > 0 && (
        <View style={styles.group}>
          <Text style={styles.groupLabel}>Processing</Text>
          {pending.map((t) => (
            <TransactionRow key={t._id} transaction={t} />
          ))}
        </View>
      )}

      {/* ── Settled ─────────────────────────────────────── */}
      {settled.length > 0 && (
        <View style={styles.group}>
          {pending.length > 0 && <Text style={styles.groupLabel}>Settled</Text>}
          {settled.map((t) => (
            <TransactionRow key={t._id} transaction={t} />
          ))}
        </View>
      )}

      {filtered.length === 0 && allTransactions !== undefined && (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            {activeFilters > 0 ? "No transactions match your filters" : "No transactions yet"}
          </Text>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function TransactionRow({ transaction }: { transaction: any }) {
  const isCredit = transaction.type === "DEPOSIT";
  const isPending = transaction.status === "PENDING";
  const isFailed = transaction.status === "FAILED";
  const typeCfg = TYPE_ICON[transaction.type] ?? TYPE_ICON.DEPOSIT;

  return (
    <TouchableOpacity
      style={[styles.row, isPending && styles.rowPending]}
      onPress={() => router.push(`/transactions/${transaction._id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: typeCfg.bg }]}>
        {isPending ? (
          <PulsingDot color={typeCfg.color} size={6} />
        ) : (
          <Ionicons name={typeCfg.icon} size={16} color={typeCfg.color} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description || transaction.type}
        </Text>
        <Text style={styles.method}>
          {METHOD_SHORT[transaction.method] ?? transaction.method}
        </Text>
        <Text style={styles.date}>
          {new Date(transaction.createdAt).toLocaleDateString("en-GH", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[
          styles.amount,
          { color: isFailed ? "#9CA3AF" : isCredit ? "#10B981" : "#EF4444" },
        ]}>
          {isFailed ? "" : isCredit ? "+" : "−"} GHS {transaction.amount.toFixed(2)}
        </Text>
        <View style={[
          styles.badge,
          isPending ? styles.badgePending : isFailed ? styles.badgeFailed : styles.badgeDone,
        ]}>
          <Text style={[
            styles.badgeText,
            isPending ? styles.badgeTextPending : isFailed ? styles.badgeTextFailed : styles.badgeTextDone,
          ]}>
            {transaction.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  filterBar: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 8,
    gap: 4,
  },
  filterRow: {
    paddingHorizontal: 12,
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  chipText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  chipTextActive: { color: "#2563EB", fontWeight: "600" },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 4,
  },
  clearText: { fontSize: 12, color: "#6B7280" },

  resultBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FAFAFA",
  },
  resultText: { fontSize: 12, color: "#9CA3AF" },

  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFBEB",
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pendingBannerText: { fontSize: 13, color: "#92400E", flex: 1 },

  group: { marginTop: 4 },
  groupLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FAFAFA",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  rowPending: { backgroundColor: "#FFFDF0" },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  info: { flex: 1 },
  description: { fontSize: 14, fontWeight: "600", color: "#111827" },
  method: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  date: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  right: { alignItems: "flex-end" },
  amount: { fontSize: 14, fontWeight: "600" },
  badge: { marginTop: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  badgePending: { backgroundColor: "#FEF3C7" },
  badgeDone: { backgroundColor: "#F3F4F6" },
  badgeFailed: { backgroundColor: "#FEE2E2" },
  badgeText: { fontSize: 10, fontWeight: "600" },
  badgeTextPending: { color: "#D97706" },
  badgeTextDone: { color: "#6B7280" },
  badgeTextFailed: { color: "#EF4444" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: "#9CA3AF", textAlign: "center" },
});
