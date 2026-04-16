import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { api } from "../../convex/_generated/api";

const WITHDRAWAL_METHODS = [
  {
    id: "MTN_MOMO",
    label: "MTN Mobile Money",
    icon: "phone-portrait-outline",
    color: "#FFC107",
  },
  {
    id: "VODAFONE_CASH",
    label: "Vodafone Cash",
    icon: "cash-outline",
    color: "#E60000",
  },
  {
    id: "AIRTELTIGO_MONEY",
    label: "AirtelTigo Money",
    icon: "card-outline",
    color: "#0077B5",
  },
];

export default function WithdrawScreen() {
  const accounts = useQuery(api.queries.accounts.getAccounts);
  const initiateWithdraw = useMutation(
    api.mutations.transactions.initiateWithdraw,
  );

  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("MTN_MOMO");
  const [loading, setLoading] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  const defaultAccount = accounts?.[0];
  const accountBalance = defaultAccount?.balance || 0;

  const handleWithdraw = async () => {
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

    if (numAmount > accountBalance) {
      Alert.alert(
        "Error",
        `Insufficient balance. Available: GHS ${accountBalance.toFixed(2)}`,
      );
      return;
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const result = await initiateWithdraw({
        accountId,
        amount: numAmount,
        method: selectedMethod as any,
        phoneNumber,
      });

      Alert.alert(
        "Withdrawal Initiated",
        `Your withdrawal will be sent to ${phoneNumber}.\nReference: ${result.reference}`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to initiate withdrawal");
    } finally {
      setLoading(false);
    }
  };

  const displayAccount =
    accounts?.find((acc) => acc._id === selectedAccount) || defaultAccount;

  return (
    <ScrollView style={styles.container}>
      {/* Account Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>From Account</Text>
        <TouchableOpacity
          style={styles.accountSelector}
          onPress={() => setShowAccountPicker(!showAccountPicker)}
        >
          <View>
            <Text style={styles.accountName}>
              {displayAccount?.accountNumber}
            </Text>
            <Text style={styles.accountBalance}>
              Balance: GHS {displayAccount?.balance?.toFixed(2) || "0.00"}
            </Text>
          </View>
          <Ionicons
            name={showAccountPicker ? "chevron-up" : "chevron-down"}
            size={24}
            color="#6B7280"
          />
        </TouchableOpacity>

        {showAccountPicker && (
          <View style={styles.accountList}>
            {accounts?.map((account) => (
              <TouchableOpacity
                key={account._id}
                style={styles.accountOption}
                onPress={() => {
                  setSelectedAccount(account._id);
                  setShowAccountPicker(false);
                }}
              >
                <View>
                  <Text style={styles.optionAccountName}>
                    {account.accountNumber}
                  </Text>
                  <Text style={styles.optionAccountBalance}>
                    GHS {account.balance.toFixed(2)}
                  </Text>
                </View>
                {selectedAccount === account._id && (
                  <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Amount Input */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Withdrawal Amount</Text>
        <View style={styles.amountInput}>
          <Text style={styles.currencySymbol}>GHS</Text>
          <TextInput
            style={styles.amountField}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholderTextColor="#D1D5DB"
          />
        </View>
        <Text style={styles.helperText}>
          Available: GHS {accountBalance.toFixed(2)}
        </Text>
      </View>

      {/* Withdrawal Method */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Withdrawal Method</Text>
        {WITHDRAWAL_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodOption,
              selectedMethod === method.id && styles.methodOptionSelected,
            ]}
            onPress={() => setSelectedMethod(method.id)}
          >
            <View
              style={[
                styles.methodIcon,
                { backgroundColor: method.color + "20" },
              ]}
            >
              <Ionicons
                name={method.icon as any}
                size={24}
                color={method.color}
              />
            </View>
            <Text style={styles.methodLabel}>{method.label}</Text>
            {selectedMethod === method.id && (
              <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Phone Number */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Phone Number</Text>
        <View style={styles.phoneInput}>
          <Text style={styles.phonePrefix}>+233</Text>
          <TextInput
            style={styles.phoneField}
            placeholder="2XXXXXXXX"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={9}
            placeholderTextColor="#D1D5DB"
          />
        </View>
      </View>

      {/* Withdraw Button */}
      <TouchableOpacity
        style={[styles.withdrawButton, loading && styles.buttonDisabled]}
        onPress={handleWithdraw}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Withdraw</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.cancelButton}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  accountSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  accountName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  accountBalance: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  accountList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 8,
    overflow: "hidden",
  },
  accountOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionAccountName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  optionAccountBalance: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  amountInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginRight: 8,
  },
  amountField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
  },
  methodOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  methodOptionSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  methodLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  phoneInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
  },
  phonePrefix: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginRight: 4,
  },
  phoneField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  cancelButton: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    paddingVertical: 12,
  },
});
