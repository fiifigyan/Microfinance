import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:   { bg: "#FEF3C7", text: "#D97706" },
  APPROVED:  { bg: "#DBEAFE", text: "#2563EB" },
  DISBURSED: { bg: "#EDE9FE", text: "#7C3AED" },
  ACTIVE:    { bg: "#DCFCE7", text: "#10B981" },
  COMPLETED: { bg: "#F3F4F6", text: "#6B7280" },
  DEFAULTED: { bg: "#FEE2E2", text: "#EF4444" },
  REJECTED:  { bg: "#FEE2E2", text: "#EF4444" },
};

const REPAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:  { bg: "#FEF3C7", text: "#D97706" },
  PAID:     { bg: "#DCFCE7", text: "#10B981" },
  OVERDUE:  { bg: "#FEE2E2", text: "#EF4444" },
  PARTIAL:  { bg: "#EDE9FE", text: "#7C3AED" },
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function LoanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const loan = useQuery(api.queries.loans.getLoanById, {
    loanId: id as Id<"loans">,
  });
  const repayments = useQuery(api.queries.loans.getLoanRepayments, {
    loanId: id as Id<"loans">,
  });

  if (loan === undefined || repayments === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!loan) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Loan not found.</Text>
      </View>
    );
  }

  const statusStyle = STATUS_COLORS[loan.status] ?? STATUS_COLORS.PENDING;
  const monthlyPayment = loan.totalAmount / loan.term;
  const totalPaid = (repayments ?? [])
    .filter((r) => r.status === "PAID")
    .reduce((s, r) => s + r.amount, 0);
  const remaining = Math.max(0, loan.totalAmount - totalPaid);
  const progressPct = Math.min(1, totalPaid / loan.totalAmount);

  const canRepay = loan.status === "ACTIVE" || loan.status === "DISBURSED";

  // Build projected schedule
  const baseDate = loan.firstRepaymentDate ?? Date.now() + 30 * 24 * 60 * 60 * 1000;
  const schedule = Array.from({ length: loan.term }, (_, i) => {
    const due = new Date(baseDate + i * 30 * 24 * 60 * 60 * 1000);
    const paid = repayments?.[i];
    return { due, paid };
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── Status Banner ───────────────────────────────── */}
      <View style={styles.banner}>
        <View style={styles.bannerTop}>
          <View>
            <Text style={styles.bannerLoanNumber}>{loan.loanNumber}</Text>
            <Text style={styles.bannerProduct}>
              {loan.product.replace(/_/g, " ")}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
              {loan.status}
            </Text>
          </View>
        </View>

        <Text style={styles.bannerAmount}>
          GHS {loan.totalAmount.toFixed(2)}
        </Text>
        <Text style={styles.bannerSub}>Total payable</Text>

        {/* Progress bar */}
        {totalPaid > 0 && (
          <View style={styles.progressWrap}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progressPct * 100}%` as any }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressPaid}>Paid GHS {totalPaid.toFixed(2)}</Text>
              <Text style={styles.progressLeft}>Left GHS {remaining.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Loan Details ────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loan Details</Text>
        <InfoRow label="Principal" value={`GHS ${loan.principal.toFixed(2)}`} />
        <InfoRow label="Total Interest" value={`GHS ${loan.totalInterest.toFixed(2)}`} />
        <InfoRow label="Interest Rate" value={`${(loan.interestRate * 100).toFixed(0)}% / month`} />
        <InfoRow label="Term" value={`${loan.term} months`} />
        <InfoRow label="Monthly Payment" value={`GHS ${monthlyPayment.toFixed(2)}`} />
        <InfoRow label="Purpose" value={loan.purpose} />
        <InfoRow
          label="Applied"
          value={new Date(loan.applicationDate).toLocaleDateString("en-GH", {
            day: "numeric", month: "short", year: "numeric",
          })}
        />
        {loan.approvalDate && (
          <InfoRow
            label="Approved"
            value={new Date(loan.approvalDate).toLocaleDateString("en-GH", {
              day: "numeric", month: "short", year: "numeric",
            })}
          />
        )}
        {loan.disbursementDate && (
          <InfoRow
            label="Disbursed"
            value={new Date(loan.disbursementDate).toLocaleDateString("en-GH", {
              day: "numeric", month: "short", year: "numeric",
            })}
          />
        )}
      </View>

      {/* ── Payment History ─────────────────────────────── */}
      {repayments && repayments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {repayments.map((r) => {
            const s = REPAYMENT_STATUS_COLORS[r.status] ?? REPAYMENT_STATUS_COLORS.PENDING;
            return (
              <View key={r._id} style={styles.repaymentRow}>
                <View style={[styles.repaymentIcon, { backgroundColor: s.bg }]}>
                  <Ionicons
                    name={r.status === "PAID" ? "checkmark" : "time-outline"}
                    size={14}
                    color={s.text}
                  />
                </View>
                <View style={styles.repaymentInfo}>
                  <Text style={styles.repaymentRef}>{r.reference}</Text>
                  <Text style={styles.repaymentDate}>
                    {r.paidDate
                      ? new Date(r.paidDate).toLocaleDateString("en-GH")
                      : new Date(r.createdAt).toLocaleDateString("en-GH")}
                  </Text>
                </View>
                <View style={styles.repaymentRight}>
                  <Text style={styles.repaymentAmount}>
                    GHS {r.amount.toFixed(2)}
                  </Text>
                  <View style={[styles.repaymentBadge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.repaymentBadgeText, { color: s.text }]}>
                      {r.status}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ── Repayment Schedule ──────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repayment Schedule</Text>
        {schedule.map((slot, i) => {
          const isPaid = slot.paid?.status === "PAID";
          const isPending = slot.paid?.status === "PENDING";
          return (
            <View key={i} style={styles.scheduleRow}>
              <View style={[styles.scheduleNum, isPaid && styles.scheduleNumPaid]}>
                {isPaid ? (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                ) : (
                  <Text style={styles.scheduleNumText}>{i + 1}</Text>
                )}
              </View>
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleDue}>
                  {slot.due.toLocaleDateString("en-GH", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </Text>
              </View>
              <Text
                style={[
                  styles.scheduleAmount,
                  isPaid && styles.scheduleAmountPaid,
                ]}
              >
                GHS {monthlyPayment.toFixed(2)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* ── Make Payment Button ─────────────────────────── */}
      {canRepay && (
        <TouchableOpacity
          style={styles.payBtn}
          onPress={() =>
            router.push({
              pathname: "/loans/repay",
              params: {
                loanId: loan._id,
                loanNumber: loan.loanNumber,
                monthlyPayment: monthlyPayment.toFixed(2),
              },
            })
          }
        >
          <Ionicons name="card-outline" size={20} color="#FFFFFF" />
          <Text style={styles.payBtnText}>Make a Payment</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#6B7280", fontSize: 14 },

  banner: {
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  bannerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  bannerLoanNumber: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  bannerProduct: { fontSize: 13, color: "#93C5FD", marginTop: 2 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: { fontSize: 12, fontWeight: "700" },
  bannerAmount: { fontSize: 36, fontWeight: "700", color: "#FFFFFF" },
  bannerSub: { fontSize: 13, color: "#93C5FD", marginTop: 2 },

  progressWrap: { marginTop: 16 },
  progressBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    backgroundColor: "#34D399",
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  progressPaid: { fontSize: 12, color: "#34D399" },
  progressLeft: { fontSize: 12, color: "#93C5FD" },

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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: { fontSize: 14, color: "#6B7280" },
  infoValue: { fontSize: 14, fontWeight: "500", color: "#111827", maxWidth: "55%" as any, textAlign: "right" },

  repaymentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 10,
  },
  repaymentIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  repaymentInfo: { flex: 1 },
  repaymentRef: { fontSize: 13, fontWeight: "500", color: "#111827" },
  repaymentDate: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  repaymentRight: { alignItems: "flex-end" },
  repaymentAmount: { fontSize: 13, fontWeight: "600", color: "#111827" },
  repaymentBadge: {
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  repaymentBadgeText: { fontSize: 10, fontWeight: "600" },

  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  scheduleNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  scheduleNumPaid: { backgroundColor: "#10B981" },
  scheduleNumText: { fontSize: 11, fontWeight: "700", color: "#6B7280" },
  scheduleInfo: { flex: 1 },
  scheduleDue: { fontSize: 13, color: "#374151" },
  scheduleAmount: { fontSize: 13, fontWeight: "600", color: "#374151" },
  scheduleAmountPaid: { color: "#10B981" },

  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563EB",
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  payBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
