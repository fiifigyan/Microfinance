import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../../convex/_generated/api";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#FEF3C7", text: "#D97706" },
  APPROVED: { bg: "#DBEAFE", text: "#2563EB" },
  DISBURSED: { bg: "#EDE9FE", text: "#7C3AED" },
  ACTIVE: { bg: "#DCFCE7", text: "#10B981" },
  COMPLETED: { bg: "#F3F4F6", text: "#6B7280" },
  DEFAULTED: { bg: "#FEE2E2", text: "#EF4444" },
  REJECTED: { bg: "#FEE2E2", text: "#EF4444" },
};

export default function LoansScreen() {
  const loans = useQuery(api.queries.loans.getUserLoans);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loans</Text>
        <Text style={styles.headerSubtitle}>
          {loans?.length || 0} loan{loans?.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {loans && loans.length > 0 ? (
        <View style={styles.loanList}>
          {loans.map((loan) => {
            const statusStyle = STATUS_COLORS[loan.status] || STATUS_COLORS.PENDING;
            return (
              <TouchableOpacity
                key={loan._id}
                style={styles.loanCard}
                onPress={() => router.push(`/loans/${loan._id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.loanHeader}>
                  <View>
                    <Text style={styles.loanNumber}>{loan.loanNumber}</Text>
                    <Text style={styles.loanProduct}>{loan.product.replace(/_/g, " ")}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {loan.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.loanDetails}>
                  <View style={styles.loanDetailRow}>
                    <Text style={styles.loanDetailLabel}>Principal</Text>
                    <Text style={styles.loanDetailValue}>GHS {loan.principal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.loanDetailRow}>
                    <Text style={styles.loanDetailLabel}>Total Payable</Text>
                    <Text style={styles.loanDetailValue}>GHS {loan.totalAmount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.loanDetailRow}>
                    <Text style={styles.loanDetailLabel}>Term</Text>
                    <Text style={styles.loanDetailValue}>{loan.term} months</Text>
                  </View>
                  <View style={styles.loanDetailRow}>
                    <Text style={styles.loanDetailLabel}>Applied</Text>
                    <Text style={styles.loanDetailValue}>
                      {new Date(loan.applicationDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cash-outline" size={48} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyText}>No active loans</Text>
          <Text style={styles.emptySubtext}>Apply for a loan to get started</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.applyButton}
        onPress={() => router.push("/loans/apply")}
      >
        <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
        <Text style={styles.applyButtonText}>Apply for Loan</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  loanList: {
    padding: 16,
    gap: 12,
  },
  loanCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  loanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  loanNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  loanProduct: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  loanDetails: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
    gap: 6,
  },
  loanDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  loanDetailLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  loanDetailValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563EB",
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
