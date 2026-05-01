import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useModal } from "../../hooks/useModal";

const PAYMENT_METHODS = [
  { id: "MTN_MOMO", label: "MTN Mobile Money", color: "#FFC107" },
  { id: "VODAFONE_CASH", label: "Vodafone Cash", color: "#E60000" },
  { id: "AIRTELTIGO_MONEY", label: "AirtelTigo Money", color: "#0077B5" },
] as const;

type MethodId = (typeof PAYMENT_METHODS)[number]["id"];

export default function WithdrawScreen() {
  const accounts = useQuery(api.queries.accounts.getAccounts);
  const initiateWithdraw = useMutation(api.mutations.transactions.initiateWithdraw);
  const { showAlert, modalElement } = useModal();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<MethodId>("MTN_MOMO");
  const [loading, setLoading] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  const activeAccountId = selectedAccountId ?? accounts?.[0]?._id ?? null;
  const activeAccount = accounts?.find((a) => a._id === activeAccountId);
  const parsedAmount = parseFloat(amount);
  const validAmount = !isNaN(parsedAmount) && parsedAmount >= 1;
  const hasEnoughBalance = validAmount && (activeAccount?.balance ?? 0) >= parsedAmount;

  const handleWithdraw = async () => {
    if (!activeAccountId) {
      showAlert("No Account", "Please select an account.", "warning");
      return;
    }
    if (!validAmount) {
      showAlert("Invalid Amount", "Minimum withdrawal is GHS 1.", "warning");
      return;
    }
    if (!hasEnoughBalance) {
      showAlert(
        "Insufficient Funds",
        `Available balance: GHS ${(activeAccount?.balance ?? 0).toFixed(2)}`,
        "error",
      );
      return;
    }
    if (!phoneNumber || phoneNumber.replace(/\s/g, "").length < 9) {
      showAlert("Invalid Number", "Please enter a valid mobile money number.", "warning");
      return;
    }

    setLoading(true);
    try {
      const result = await initiateWithdraw({
        accountId: activeAccountId as any,
        amount: parsedAmount,
        method: selectedMethod,
        phoneNumber: phoneNumber.replace(/\s/g, ""),
      });

      showAlert(
        "Withdrawal Initiated",
        `GHS ${parsedAmount.toFixed(2)} will be sent to +233${phoneNumber.replace(/\s/g, "")}.\n\nReference: ${result.reference}`,
        "success",
        () => router.back(),
      );
    } catch (err: any) {
      showAlert("Withdrawal Failed", err.message || "Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="arrow-up" size={28} color="#EF4444" />
        </View>
        <Text style={styles.title}>Withdraw Funds</Text>
        <Text style={styles.subtitle}>Send money to your Mobile Money wallet</Text>
      </View>

      {/* Account Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>From Account</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowAccountPicker((v) => !v)}
        >
          <View style={styles.selectorLeft}>
            <Ionicons name="wallet-outline" size={20} color="#EF4444" />
            <View>
              <Text style={styles.selectorText}>
                {activeAccount
                  ? `${activeAccount.type} · ${activeAccount.accountNumber}`
                  : accounts === undefined
                  ? "Loading..."
                  : "Select account"}
              </Text>
              {activeAccount && (
                <Text style={styles.selectorBalance}>
                  Available: GHS {activeAccount.balance.toFixed(2)}
                </Text>
              )}
            </View>
          </View>
          <Ionicons
            name={showAccountPicker ? "chevron-up" : "chevron-down"}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>

        {showAccountPicker &&
          accounts?.map((account) => (
            <TouchableOpacity
              key={account._id}
              style={[
                styles.dropdownItem,
                account._id === activeAccountId && styles.dropdownItemActive,
              ]}
              onPress={() => {
                setSelectedAccountId(account._id);
                setShowAccountPicker(false);
              }}
            >
              <View>
                <Text style={styles.dropdownItemText}>
                  {account.type} · {account.accountNumber}
                </Text>
                <Text style={styles.dropdownBalance}>
                  GHS {account.balance.toFixed(2)}
                </Text>
              </View>
              {account._id === activeAccountId && (
                <Ionicons name="checkmark-circle" size={20} color="#EF4444" />
              )}
            </TouchableOpacity>
          ))}
      </View>

      {/* Amount */}
      <View style={styles.section}>
        <Text style={styles.label}>Amount</Text>
        <View style={[styles.amountRow, !hasEnoughBalance && validAmount && styles.amountRowError]}>
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
        {validAmount && !hasEnoughBalance && (
          <Text style={styles.errorText}>
            Exceeds available balance of GHS {(activeAccount?.balance ?? 0).toFixed(2)}
          </Text>
        )}
        <View style={styles.quickRow}>
          {[50, 100, 200, 500].map((q) => {
            const disabled = (activeAccount?.balance ?? 0) < q;
            return (
              <TouchableOpacity
                key={q}
                style={[
                  styles.quickBtn,
                  amount === String(q) && styles.quickBtnActive,
                  disabled && styles.quickBtnDisabled,
                ]}
                onPress={() => !disabled && setAmount(String(q))}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.quickBtnText,
                    amount === String(q) && styles.quickBtnTextActive,
                  ]}
                >
                  {q}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Payment Method */}
      <View style={styles.section}>
        <Text style={styles.label}>Send To</Text>
        {PAYMENT_METHODS.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.methodRow, selectedMethod === m.id && styles.methodRowActive]}
            onPress={() => setSelectedMethod(m.id)}
          >
            <View style={[styles.methodDot, { backgroundColor: m.color }]} />
            <Text style={styles.methodLabel}>{m.label}</Text>
            {selectedMethod === m.id && (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color="#EF4444"
                style={{ marginLeft: "auto" }}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Phone Number */}
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
      {validAmount && hasEnoughBalance && activeAccount && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>From</Text>
            <Text style={styles.summaryValue}>{activeAccount.accountNumber}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>GHS {parsedAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fee</Text>
            <Text style={styles.summaryValue}>GHS 0.00</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining Balance</Text>
            <Text style={styles.summaryValue}>
              GHS {(activeAccount.balance - parsedAmount).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryTotalLabel}>You Receive</Text>
            <Text style={styles.summaryTotalValue}>GHS {parsedAmount.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {modalElement}

      {/* Submit */}
      <View style={styles.btnContainer}>
        <TouchableOpacity
          style={[
            styles.btn,
            (!validAmount || !hasEnoughBalance || !phoneNumber || loading) &&
              styles.btnDisabled,
          ]}
          onPress={handleWithdraw}
          disabled={!validAmount || !hasEnoughBalance || !phoneNumber || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.btnText}>Withdraw Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#1F2937" },
  subtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 10 },
  selector: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  selectorText: { fontSize: 15, color: "#1F2937" },
  selectorBalance: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  dropdownItem: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 14,
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownItemActive: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
  dropdownItemText: { fontSize: 14, color: "#1F2937" },
  dropdownBalance: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  amountRow: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  amountRowError: { borderColor: "#EF4444" },
  currency: { fontSize: 22, fontWeight: "700", color: "#6B7280", marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: "700", color: "#1F2937" },
  errorText: { fontSize: 12, color: "#EF4444", marginTop: 6 },
  quickRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  quickBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  quickBtnActive: { backgroundColor: "#EF4444" },
  quickBtnDisabled: { opacity: 0.4 },
  quickBtnText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  quickBtnTextActive: { color: "#FFFFFF" },
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
  methodRowActive: { borderColor: "#EF4444", borderWidth: 2 },
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
    backgroundColor: "#FFF7F7",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#991B1B",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 14, color: "#6B7280" },
  summaryValue: { fontSize: 14, color: "#1F2937", fontWeight: "500" },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#FECACA",
    paddingTop: 10,
    marginTop: 4,
  },
  summaryTotalLabel: { fontSize: 16, fontWeight: "700", color: "#991B1B" },
  summaryTotalValue: { fontSize: 18, fontWeight: "700", color: "#EF4444" },
  btnContainer: { paddingHorizontal: 20, marginTop: 28 },
  btn: {
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
});
