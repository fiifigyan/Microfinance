import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const PAYMENT_METHODS = [
  { id: "MTN_MOMO", label: "MTN Mobile Money", icon: "phone-portrait-outline", color: "#FFC107" },
  { id: "VODAFONE_CASH", label: "Vodafone Cash", icon: "cash-outline", color: "#E60000" },
  { id: "AIRTELTIGO_MONEY", label: "AirtelTigo Money", icon: "card-outline", color: "#0077B5" },
];

export default function DepositScreen() {
  const accounts = useQuery(api.queries.accounts.getAccounts);
  const initiateDeposit = useMutation(api.mutations.transactions.initiateDeposit);
  
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("MTN_MOMO");
  const [loading, setLoading] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  const defaultAccount = accounts?.[0];

  const handleDeposit = async () => {
    const accountId = selectedAccount || defaultAccount?._id;
    
    if (!accountId) {
      Alert.alert("Error", "No account selected");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1) {
      Alert.alert("Error", "Please enter a valid amount (minimum GHS 1)");
      return;
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const result = await initiateDeposit({
        accountId,
        amount: numAmount,
        method: selectedMethod as any,
        phoneNumber,
      });

      Alert.alert(
        "Deposit Initiated",
        `Please check your phone to complete the payment.\nReference: ${result.reference}`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Deposit Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedAccountData = accounts?.find(a => a._id === (selectedAccount || defaultAccount?._id));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="arrow-down-circle" size={48} color="#10B981" />
        <Text style={styles.title}>Deposit Funds</Text>
        <Text style={styles.subtitle}>Add money to your account via Mobile Money</Text>
      </View>

      {/* Account Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Account</Text>
        <TouchableOpacity 
          style={styles.accountSelector}
          onPress={() => setShowAccountPicker(!showAccountPicker)}
        >
          <View style={styles.accountInfo}>
            <Ionicons name="wallet" size={20} color="#2563EB" />
            <Text style={styles.accountText}>
              {selectedAccountData ? (
                `${selectedAccountData.type} - ${selectedAccountData.accountNumber}`
              ) : (
                "Select an account"
              )}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </TouchableOpacity>

        {showAccountPicker && accounts?.map((account) => (
          <TouchableOpacity
            key={account._id}
            style={styles.accountOption}
            onPress={() => {
              setSelectedAccount(account._id);
              setShowAccountPicker(false);
            }}
          >
            <Text style={styles.accountOptionText}>
              {account.type} - {account.accountNumber}
            </Text>
            <Text style={styles.accountBalance}>
              GHS {account.balance.toFixed(2)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Amount Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amount</Text>
        <View style={styles.amountInput}>
          <Text style={styles.currencySymbol}>GHS</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            editable={!loading}
          />
        </View>
        <View style={styles.quickAmounts}>
          {[50, 100, 200, 500].map((amt) => (
            <TouchableOpacity
              key={amt}
              style={styles.quickAmountButton}
              onPress={() => setAmount(amt.toString())}
            >
              <Text style={styles.quickAmountText}>GHS {amt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodOption,
              selectedMethod === method.id && styles.methodOptionSelected,
            ]}
            onPress={() => setSelectedMethod(method.id)}
          >
            <View style={styles.methodInfo}>
              <View style={[styles.methodIcon, { backgroundColor: method.color + "20" }]}>
                <Ionicons name={method.icon as any} size={20} color={method.color} />
              </View>
              <Text style={styles.methodLabel}>{method.label}</Text>
            </View>
            {selectedMethod === method.id && (
              <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Phone Number */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mobile Money Number</Text>
        <View style={styles.phoneInput}>
          <Text style={styles.phonePrefix}>+233</Text>
          <TextInput
            style={styles.input}
            placeholder="24 412 3456"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            editable={!loading}
          />
        </View>
      </View>

      {/* Summary */}
      {amount && selectedAccountData && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Account</Text>
            <Text style={styles.summaryValue}>{selectedAccountData.accountNumber}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>GHS {parseFloat(amount).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fee</Text>
            <Text style={styles.summaryValue}>GHS 0.00</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total to Pay</Text>
            <Text style={styles.summaryTotalValue}>GHS {parseFloat(amount).toFixed(2)}</Text>
          </View>
        </View>
      )}

      {/* Deposit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.depositButton, loading && styles.buttonDisabled]}
          onPress={handleDeposit}
          disabled={loading || !amount || !phoneNumber}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.depositButtonText}>Continue to Payment</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  accountSelector: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  accountText: {
    fontSize: 16,
    color: "#1F2937",
  },
  accountOption: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  accountOptionText: {
    fontSize: 14,
    color: "#1F2937",
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  amountInput: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: "#1F2937",
  },
  quickAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  quickAmountButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickAmountText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  methodOption: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  methodOptionSelected: {
    borderColor: "#2563EB",
    borderWidth: 2,
  },
  methodInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  methodLabel: {
    fontSize: 16,
    color: "#1F2937",
  },
  phoneInput: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  phonePrefix: {
    fontSize: 16,
    color: "#6B7280",
    marginRight: 8,
  },
  summary: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2563EB",
  },
  buttonContainer: {
    padding: 20,
  },
  depositButton: {
    backgroundColor: "#10B981",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  depositButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});