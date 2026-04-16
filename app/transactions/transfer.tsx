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

export default function TransferScreen() {
  const accounts = useQuery(api.queries.accounts.getAccounts);
  const initiateTransfer = useMutation(
    api.mutations.transactions.initiateTransfer,
  );

  const [fromAccount, setFromAccount] = useState<string | null>(null);
  const [toAccount, setToAccount] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const defaultAccount = accounts?.[0];
  const fromAccountData = accounts?.find(
    (acc) => acc._id === (fromAccount || defaultAccount?._id),
  );
  const toAccountData = accounts?.find((acc) => acc._id === toAccount);
  const availableToAccounts = accounts?.filter(
    (acc) => acc._id !== (fromAccount || defaultAccount?._id),
  );

  const handleTransfer = async () => {
    const from = fromAccount || defaultAccount?._id;
    const to = toAccount;

    if (!from) {
      Alert.alert("Error", "Please select a source account");
      return;
    }

    if (!to) {
      Alert.alert("Error", "Please select a destination account");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1) {
      Alert.alert("Error", "Please enter a valid amount (minimum GHS 1)");
      return;
    }

    if (numAmount > (fromAccountData?.balance || 0)) {
      Alert.alert(
        "Error",
        `Insufficient balance. Available: GHS ${fromAccountData?.balance?.toFixed(2) || "0.00"}`,
      );
      return;
    }

    setLoading(true);
    try {
      const result = await initiateTransfer({
        fromAccountId: from,
        toAccountId: to,
        amount: numAmount,
      });

      Alert.alert(
        "Transfer Successful",
        `GHS ${numAmount.toFixed(2)} transferred successfully.\nReference: ${result.reference}`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to transfer funds");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* From Account */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Transfer From</Text>
        <TouchableOpacity
          style={styles.accountSelector}
          onPress={() => setShowFromPicker(!showFromPicker)}
        >
          <View>
            <Text style={styles.accountName}>
              {fromAccountData?.accountNumber}
            </Text>
            <Text style={styles.accountBalance}>
              Balance: GHS {fromAccountData?.balance?.toFixed(2) || "0.00"}
            </Text>
          </View>
          <Ionicons
            name={showFromPicker ? "chevron-up" : "chevron-down"}
            size={24}
            color="#6B7280"
          />
        </TouchableOpacity>

        {showFromPicker && (
          <View style={styles.accountList}>
            {accounts?.map((account) => (
              <TouchableOpacity
                key={account._id}
                style={styles.accountOption}
                onPress={() => {
                  setFromAccount(account._id);
                  setShowFromPicker(false);
                  setToAccount(null); // Reset to account
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
                {fromAccount === account._id && (
                  <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Transfer Arrow */}
      <View style={styles.arrowContainer}>
        <Ionicons name="swap-vertical" size={24} color="#D1D5DB" />
      </View>

      {/* To Account */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Transfer To</Text>
        <TouchableOpacity
          style={styles.accountSelector}
          onPress={() => setShowToPicker(!showToPicker)}
        >
          <View>
            {toAccountData ? (
              <>
                <Text style={styles.accountName}>
                  {toAccountData.accountNumber}
                </Text>
                <Text style={styles.accountBalance}>
                  Balance: GHS {toAccountData.balance.toFixed(2)}
                </Text>
              </>
            ) : (
              <Text style={styles.placeholder}>Select destination account</Text>
            )}
          </View>
          <Ionicons
            name={showToPicker ? "chevron-up" : "chevron-down"}
            size={24}
            color="#6B7280"
          />
        </TouchableOpacity>

        {showToPicker && (
          <View style={styles.accountList}>
            {availableToAccounts && availableToAccounts.length > 0 ? (
              availableToAccounts.map((account) => (
                <TouchableOpacity
                  key={account._id}
                  style={styles.accountOption}
                  onPress={() => {
                    setToAccount(account._id);
                    setShowToPicker(false);
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
                  {toAccount === account._id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#2563EB"
                    />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noAccounts}>
                <Text style={styles.noAccountsText}>
                  You need at least 2 accounts to transfer
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Amount */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Transfer Amount</Text>
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
          Available: GHS {fromAccountData?.balance?.toFixed(2) || "0.00"}
        </Text>
      </View>

      {/* Transfer Button */}
      <TouchableOpacity
        style={[styles.transferButton, loading && styles.buttonDisabled]}
        onPress={handleTransfer}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Transfer</Text>
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
    marginBottom: 20,
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
  placeholder: {
    fontSize: 14,
    color: "#D1D5DB",
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
  noAccounts: {
    paddingVertical: 16,
    alignItems: "center",
  },
  noAccountsText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  arrowContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
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
  transferButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
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
