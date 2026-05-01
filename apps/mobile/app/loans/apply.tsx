import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useModal } from "../../hooks/useModal";

const LOAN_PRODUCTS = [
  { id: "SMALL_LOAN", label: "Small Loan", description: "Up to GHS 1,000", minAmount: 100, maxAmount: 1000 },
  { id: "INDIVIDUAL_LOAN", label: "Individual Loan", description: "GHS 1,000 – 10,000", minAmount: 1000, maxAmount: 10000 },
  { id: "SME_LOAN", label: "SME Loan", description: "GHS 5,000 – 100,000", minAmount: 5000, maxAmount: 100000 },
  { id: "EDUCATION_LOAN", label: "Education Loan", description: "Up to GHS 20,000", minAmount: 500, maxAmount: 20000 },
  { id: "ASSET_FINANCING", label: "Asset Financing", description: "GHS 2,000 – 50,000", minAmount: 2000, maxAmount: 50000 },
] as const;

const TERM_OPTIONS = [3, 6, 12, 18, 24, 36];
const MONTHLY_RATE = 0.02;

export default function ApplyLoanScreen() {
  const accounts = useQuery(api.queries.accounts.getAccounts);
  const applyForLoan = useMutation(api.mutations.loans.applyForLoan);
  const { showAlert, modalElement } = useModal();

  const [selectedProduct, setSelectedProduct] = useState<string>("SMALL_LOAN");
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState(12);
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);

  const defaultAccount = accounts?.[0];
  const accountId = selectedAccount || defaultAccount?._id;

  const principal = parseFloat(amount) || 0;
  const totalInterest = principal * MONTHLY_RATE * term;
  const totalAmount = principal + totalInterest;
  const monthlyPayment = totalAmount / term;

  const handleApply = async () => {
    if (!accountId) {
      showAlert("Error", "No account selected", "warning");
      return;
    }

    if (principal < 100) {
      showAlert("Error", "Minimum loan amount is GHS 100", "warning");
      return;
    }

    if (!purpose.trim()) {
      showAlert("Error", "Please describe the purpose of the loan", "warning");
      return;
    }

    setLoading(true);
    try {
      const result = await applyForLoan({
        accountId,
        product: selectedProduct as any,
        principal,
        term,
        purpose,
      });

      showAlert(
        "Application Submitted",
        `Your loan application ${result.loanNumber} has been submitted for review. You will be notified once approved.`,
        "success",
        () => router.back(),
      );
    } catch (error: any) {
      showAlert("Application Failed", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Loan Product */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loan Type</Text>
        {LOAN_PRODUCTS.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={[
              styles.productOption,
              selectedProduct === product.id && styles.productOptionSelected,
            ]}
            onPress={() => setSelectedProduct(product.id)}
          >
            <View style={styles.productInfo}>
              <Text style={styles.productLabel}>{product.label}</Text>
              <Text style={styles.productDescription}>{product.description}</Text>
            </View>
            {selectedProduct === product.id && (
              <Ionicons name="checkmark-circle" size={22} color="#2563EB" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Disbursement Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Disbursement Account</Text>
        {accounts?.map((account) => (
          <TouchableOpacity
            key={account._id}
            style={[
              styles.accountOption,
              accountId === account._id && styles.accountOptionSelected,
            ]}
            onPress={() => setSelectedAccount(account._id)}
          >
            <View>
              <Text style={styles.accountNumber}>{account.accountNumber}</Text>
              <Text style={styles.accountType}>{account.type}</Text>
            </View>
            <View style={styles.accountRight}>
              <Text style={styles.accountBalance}>GHS {account.balance.toFixed(2)}</Text>
              {accountId === account._id && (
                <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Amount */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loan Amount</Text>
        <View style={styles.amountInput}>
          <Text style={styles.currencySymbol}>GHS</Text>
          <TextInput
            style={styles.amountField}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholderTextColor="#D1D5DB"
            editable={!loading}
          />
        </View>
      </View>

      {/* Term */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repayment Period</Text>
        <View style={styles.termGrid}>
          {TERM_OPTIONS.map((months) => (
            <TouchableOpacity
              key={months}
              style={[styles.termOption, term === months && styles.termOptionSelected]}
              onPress={() => setTerm(months)}
            >
              <Text style={[styles.termText, term === months && styles.termTextSelected]}>
                {months} mo
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Purpose */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Purpose of Loan</Text>
        <TextInput
          style={styles.purposeInput}
          placeholder="Describe how you will use the loan..."
          value={purpose}
          onChangeText={setPurpose}
          multiline
          numberOfLines={3}
          editable={!loading}
        />
      </View>

      {/* Summary */}
      {principal > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Loan Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Principal</Text>
            <Text style={styles.summaryValue}>GHS {principal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Interest ({(MONTHLY_RATE * 100).toFixed(0)}% / month)</Text>
            <Text style={styles.summaryValue}>GHS {totalInterest.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Term</Text>
            <Text style={styles.summaryValue}>{term} months</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryDivider]}>
            <Text style={styles.summaryTotalLabel}>Total Payable</Text>
            <Text style={styles.summaryTotalValue}>GHS {totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monthly Payment</Text>
            <Text style={styles.summaryValue}>GHS {monthlyPayment.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {modalElement}

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.buttonDisabled]}
        onPress={handleApply}
        disabled={loading || !amount || !purpose}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Application</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  productOption: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  productOptionSelected: {
    borderColor: "#2563EB",
    borderWidth: 2,
  },
  productInfo: {
    flex: 1,
  },
  productLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  productDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  accountOption: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  accountOptionSelected: {
    borderColor: "#2563EB",
    borderWidth: 2,
  },
  accountNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  accountType: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  accountRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  amountInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginRight: 8,
  },
  amountField: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 18,
    color: "#111827",
  },
  termGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  termOption: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  termOptionSelected: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  termText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  termTextSelected: {
    color: "#FFFFFF",
  },
  purposeInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#111827",
    textAlignVertical: "top",
    minHeight: 80,
  },
  summary: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  summaryDivider: {
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#BFDBFE",
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563EB",
  },
  submitButton: {
    backgroundColor: "#2563EB",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
