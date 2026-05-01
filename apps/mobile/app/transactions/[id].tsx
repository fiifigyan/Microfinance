import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  DEPOSIT:    { label: "Deposit",  icon: "arrow-down",        color: "#10B981", bg: "#DCFCE7" },
  WITHDRAWAL: { label: "Withdrawal", icon: "arrow-up",        color: "#EF4444", bg: "#FEE2E2" },
  TRANSFER:   { label: "Transfer", icon: "swap-horizontal",   color: "#2563EB", bg: "#EFF6FF" },
};

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: "#DCFCE7", text: "#10B981" },
  PENDING:   { bg: "#FEF3C7", text: "#D97706" },
  FAILED:    { bg: "#FEE2E2", text: "#EF4444" },
};

const METHOD_LABEL: Record<string, string> = {
  MTN_MOMO:         "MTN Mobile Money",
  VODAFONE_CASH:    "Vodafone Cash",
  AIRTELTIGO_MONEY: "AirtelTigo Money",
  BANK_TRANSFER:    "Bank Transfer",
};

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.infoValueMono]}>{value}</Text>
    </View>
  );
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const transaction = useQuery(api.queries.accounts.getTransactionById, {
    transactionId: id as Id<"transactions">,
  });

  if (transaction === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Transaction not found.</Text>
      </View>
    );
  }

  const typeCfg = TYPE_CONFIG[transaction.type] ?? TYPE_CONFIG.DEPOSIT;
  const statusCfg = STATUS_CONFIG[transaction.status] ?? STATUS_CONFIG.PENDING;
  const isCredit = transaction.type === "DEPOSIT";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── Amount Banner ───────────────────────────────── */}
      <View style={styles.banner}>
        <View style={[styles.iconCircle, { backgroundColor: typeCfg.bg }]}>
          <Ionicons name={typeCfg.icon} size={32} color={typeCfg.color} />
        </View>
        <Text style={styles.bannerType}>{typeCfg.label}</Text>
        <Text style={[styles.bannerAmount, { color: isCredit ? "#10B981" : "#EF4444" }]}>
          {isCredit ? "+" : "−"} GHS {transaction.amount.toFixed(2)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.statusText, { color: statusCfg.text }]}>
            {transaction.status}
          </Text>
        </View>
      </View>

      {/* ── Details ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Details</Text>
        <InfoRow label="Type" value={typeCfg.label} />
        <InfoRow label="Amount" value={`GHS ${transaction.amount.toFixed(2)}`} />
        {transaction.fee > 0 && (
          <InfoRow label="Fee" value={`GHS ${transaction.fee.toFixed(2)}`} />
        )}
        <InfoRow label="Method" value={METHOD_LABEL[transaction.method] ?? transaction.method} />
        {transaction.description && (
          <InfoRow label="Description" value={transaction.description} />
        )}
      </View>

      {/* ── References ──────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>References</Text>
        <InfoRow label="Reference" value={transaction.reference} mono />
        {transaction.externalReference && (
          <InfoRow label="External Ref" value={transaction.externalReference} mono />
        )}
      </View>

      {/* ── Timestamps ──────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <InfoRow
          label="Initiated"
          value={new Date(transaction.createdAt).toLocaleString("en-GH", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        />
        {transaction.completedAt && (
          <InfoRow
            label="Completed"
            value={new Date(transaction.completedAt).toLocaleString("en-GH", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#6B7280", fontSize: 14 },

  banner: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  bannerType: { fontSize: 14, color: "#6B7280", marginBottom: 6 },
  bannerAmount: { fontSize: 36, fontWeight: "700", marginBottom: 12 },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { fontSize: 13, fontWeight: "700" },

  section: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 16,
  },
  infoLabel: { fontSize: 14, color: "#6B7280", flexShrink: 0 },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    flex: 1,
    textAlign: "right",
  },
  infoValueMono: {
    fontFamily: "monospace" as any,
    fontSize: 12,
    color: "#374151",
  },
});
