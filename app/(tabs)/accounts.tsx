import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function AccountsScreen() {
  const accounts = useQuery(api.queries.accounts.getAccounts);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Accounts</Text>
        <Text style={styles.headerSubtitle}>
          {accounts?.length || 0} active account{accounts?.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {accounts?.map((account) => (
        <TouchableOpacity 
          key={account._id}
          style={styles.accountCard}
          onPress={() => router.push(`/account/${account._id}`)}
        >
          <View style={styles.accountHeader}>
            <View style={styles.accountTypeContainer}>
              <Ionicons name="wallet" size={24} color="#2563EB" />
              <Text style={styles.accountType}>{account.type}</Text>
            </View>
            {account.isActive ? (
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>Active</Text>
              </View>
            ) : null}
          </View>
          
          <Text style={styles.accountNumber}>{account.accountNumber}</Text>
          
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>GHS {account.balance.toFixed(2)}</Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.currencyText}>Currency: {account.currency}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.newAccountButton}>
        <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
        <Text style={styles.newAccountText}>Open New Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  accountCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accountType: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  activeBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  accountNumber: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  balanceContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  balanceLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  currencyText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  newAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 16,
    padding: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
  },
  newAccountText: {
    fontSize: 16,
    color: "#2563EB",
    fontWeight: "600",
  },
});