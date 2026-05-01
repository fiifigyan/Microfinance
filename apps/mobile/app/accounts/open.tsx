import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useModal } from "../../hooks/useModal";

type AccountType = "SAVINGS" | "CURRENT" | "FIXED_DEPOSIT";

const ACCOUNT_TYPES: {
  type: AccountType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  description: string;
  features: string[];
}[] = [
  {
    type: "SAVINGS",
    label: "Savings Account",
    icon: "wallet-outline",
    color: "#10B981",
    bg: "#DCFCE7",
    description: "Earn interest while keeping your money safe and accessible.",
    features: ["Earn monthly interest", "Unlimited deposits", "Easy withdrawals"],
  },
  {
    type: "CURRENT",
    label: "Current Account",
    icon: "swap-horizontal-outline",
    color: "#2563EB",
    bg: "#EFF6FF",
    description: "Everyday banking for frequent transactions and business use.",
    features: ["Unlimited transactions", "No minimum balance", "Instant transfers"],
  },
  {
    type: "FIXED_DEPOSIT",
    label: "Fixed Deposit",
    icon: "lock-closed-outline",
    color: "#D97706",
    bg: "#FEF3C7",
    description: "Lock in your funds for a fixed period and earn higher returns.",
    features: ["Higher interest rates", "Flexible terms", "Guaranteed returns"],
  },
];

export default function OpenAccountScreen() {
  const [selected, setSelected] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(false);
  const createAccount = useMutation(api.mutations.accounts.createAccount);
  const { showAlert, showConfirm, modalElement } = useModal();

  const doCreate = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const result = await createAccount({ type: selected });
      showAlert(
        "Account Opened",
        `Your new account has been created.\nAccount Number: ${result.accountNumber}`,
        "success",
        () => router.back(),
      );
    } catch (err: any) {
      showAlert("Error", err.message || "Failed to open account", "error");
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = () => {
    if (!selected) return;
    const label = ACCOUNT_TYPES.find((a) => a.type === selected)?.label;
    showConfirm("Open Account", `Open a new ${label}?`, doCreate, {
      confirmText: "Open",
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        Choose the type of account you'd like to open.
      </Text>

      {ACCOUNT_TYPES.map((item) => {
        const isSelected = selected === item.type;
        return (
          <TouchableOpacity
            key={item.type}
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => setSelected(item.type)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.cardTitleGroup}>
                <Text style={styles.cardTitle}>{item.label}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </View>

            <View style={styles.features}>
              {item.features.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={item.color} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        );
      })}

      {modalElement}

      <TouchableOpacity
        style={[styles.button, (!selected || loading) && styles.buttonDisabled]}
        onPress={onConfirm}
        disabled={!selected || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Open Account</Text>
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardSelected: {
    borderColor: "#2563EB",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitleGroup: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  radioSelected: {
    borderColor: "#2563EB",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563EB",
  },
  features: {
    marginTop: 12,
    gap: 6,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: "#374151",
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
