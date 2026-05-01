import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
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
import { Id } from "../../../../convex/_generated/dataModel";
import { useModal } from "../../hooks/useModal";

const PAYMENT_METHODS = [
  { id: "MTN_MOMO",        label: "MTN Mobile Money",  color: "#FFC107" },
  { id: "VODAFONE_CASH",   label: "Vodafone Cash",     color: "#E60000" },
  { id: "AIRTELTIGO_MONEY",label: "AirtelTigo Money",  color: "#0077B5" },
] as const;

type MethodId = (typeof PAYMENT_METHODS)[number]["id"];

export default function RepayScreen() {
  const { loanId, loanNumber, monthlyPayment } = useLocalSearchParams<{
    loanId: string;
    loanNumber: string;
    monthlyPayment: string;
  }>();

  const initiateRepayment = useMutation(api.mutations.loans.initiateRepayment);
  const { showAlert, modalElement } = useModal();

  const [amount, setAmount] = useState(monthlyPayment ?? "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<MethodId>("MTN_MOMO");
  const [loading, setLoading] = useState(false);

  const parsedAmount = parseFloat(amount);
  const validAmount = !isNaN(parsedAmount) && parsedAmount >= 1;

  const handlePay = async () => {
    if (!validAmount) {
      showAlert("Invalid Amount", "Minimum repayment is GHS 1.", "warning");
      return;
    }
    if (!phoneNumber || phoneNumber.replace(/\s/g, "").length < 9) {
      showAlert("Invalid Number", "Please enter a valid mobile money number.", "warning");
      return;
    }

    setLoading(true);
    try {
      const result = await initiateRepayment({
        loanId: loanId as Id<"loans">,
        amount: parsedAmount,
        method: selectedMethod,
        phoneNumber: `+233${phoneNumber.replace(/\s/g, "")}`,
      });
      showAlert(
        "Payment Initiated",
        `GHS ${parsedAmount.toFixed(2)} repayment is being processed.\n\nReference: ${result.reference}`,
        "success",
        () => router.back(),
      );
    } catch (err: any) {
      showAlert("Payment Failed", err.message || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Loan info */}
      <View style={styles.loanBanner}>
        <Ionicons name="card-outline" size={28} color="#2563EB" />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.loanTitle}>Repay Loan</Text>
          <Text style={styles.loanSub}>{loanNumber}</Text>
        </View>
      </View>

      {/* Amount */}
      <View style={styles.section}>
        <Text style={styles.label}>Amount (GHS)</Text>
        <View style={styles.amountRow}>
          <Text style={styles.currency}>GHS</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            editable={!loading}
          />
        </View>
        {monthlyPayment && (
          <TouchableOpacity
            onPress={() => setAmount(monthlyPayment)}
            style={styles.presetBtn}
          >
            <Text style={styles.presetText}>
              Use monthly installment (GHS {parseFloat(monthlyPayment).toFixed(2)})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Method */}
      <View style={styles.section}>
        <Text style={styles.label}>Payment Method</Text>
        {PAYMENT_METHODS.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.methodRow, selectedMethod === m.id && styles.methodRowActive]}
            onPress={() => setSelectedMethod(m.id)}
          >
            <View style={[styles.methodDot, { backgroundColor: m.color }]} />
            <Text style={styles.methodLabel}>{m.label}</Text>
            {selectedMethod === m.id && (
              <Ionicons name="checkmark-circle" size={22} color="#2563EB" style={{ marginLeft: "auto" }} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Phone */}
      <View style={styles.section}>
        <Text style={styles.label}>Mobile Money Number</Text>
        <View style={styles.phoneRow}>
          <Text style={styles.prefix}>+233</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="24 412 3456"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            editable={!loading}
          />
        </View>
      </View>

      {/* Summary */}
      {validAmount && (
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Loan</Text>
            <Text style={styles.summaryValue}>{loanNumber}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>GHS {parsedAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Method</Text>
            <Text style={styles.summaryValue}>
              {PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.label}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, (!validAmount || !phoneNumber || loading) && styles.btnDisabled]}
        onPress={handlePay}
        disabled={!validAmount || !phoneNumber || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.btnText}>Pay Now</Text>
        )}
      </TouchableOpacity>

      {modalElement}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  loanBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#BFDBFE",
  },
  loanTitle: { fontSize: 17, fontWeight: "700", color: "#1E3A8A" },
  loanSub: { fontSize: 13, color: "#2563EB", marginTop: 2 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 10 },
  amountRow: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  currency: { fontSize: 22, fontWeight: "700", color: "#6B7280", marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: "700", color: "#1F2937" },
  presetBtn: { marginTop: 8 },
  presetText: { fontSize: 13, color: "#2563EB" },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  methodRowActive: { borderColor: "#2563EB", borderWidth: 2 },
  methodDot: { width: 12, height: 12, borderRadius: 6 },
  methodLabel: { fontSize: 15, color: "#1F2937" },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden",
  },
  prefix: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  phoneInput: { flex: 1, padding: 14, fontSize: 16, color: "#1F2937" },
  summary: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    gap: 8,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 14, color: "#6B7280" },
  summaryValue: { fontSize: 14, fontWeight: "500", color: "#1F2937" },
  btn: {
    backgroundColor: "#2563EB",
    marginHorizontal: 20,
    marginTop: 28,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
});
