import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


type PermissionStatus = "granted" | "denied" | "undetermined";

export default function NotificationSettingsScreen() {
  const [status, setStatus] = useState<PermissionStatus>("undetermined");

  useEffect(() => {
    Notifications.getPermissionsAsync().then((result) => {
      setStatus(result.status as PermissionStatus);
    });
  }, []);

  async function handleEnable() {
    if (status === "denied") {
      Alert.alert(
        "Notifications Blocked",
        "Push notifications are blocked. Open your device Settings to enable them.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () =>
              Platform.OS === "ios"
                ? Linking.openURL("app-settings:")
                : Linking.openSettings(),
          },
        ],
      );
      return;
    }

    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    setStatus(newStatus as PermissionStatus);

    if (newStatus === "granted") {
      Alert.alert("Notifications Enabled", "You'll now receive alerts for loans and payments.");
    }
  }

  const isGranted = status === "granted";

  return (
    <View style={styles.container}>
      {/* Status card */}
      <View style={styles.card}>
        <View style={[styles.statusIcon, isGranted ? styles.iconOn : styles.iconOff]}>
          <Ionicons
            name={isGranted ? "notifications" : "notifications-off"}
            size={28}
            color={isGranted ? "#2563EB" : "#9CA3AF"}
          />
        </View>

        <Text style={styles.statusTitle}>
          {isGranted ? "Notifications are on" : "Notifications are off"}
        </Text>
        <Text style={styles.statusBody}>
          {isGranted
            ? "You'll receive push notifications for loan approvals, disbursements, deposits, and repayments."
            : "Enable notifications to stay updated on your loan status and account activity."}
        </Text>

        {!isGranted && (
          <TouchableOpacity style={styles.enableBtn} onPress={handleEnable}>
            <Text style={styles.enableBtnText}>Enable Notifications</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* What you'll receive */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>You'll be notified for</Text>
        {[
          { icon: "checkmark-circle", text: "Loan approved or rejected", color: "#10B981" },
          { icon: "checkmark-circle", text: "Loan disbursed to your account", color: "#10B981" },
          { icon: "checkmark-circle", text: "Deposit confirmed", color: "#10B981" },
          { icon: "checkmark-circle", text: "Withdrawal failed", color: "#10B981" },
          { icon: "checkmark-circle", text: "Repayment received", color: "#10B981" },
          { icon: "checkmark-circle", text: "Loan fully repaid", color: "#10B981" },
        ].map((item, i) => (
          <View key={i} style={styles.item}>
            <Ionicons name={item.icon as any} size={18} color={item.color} />
            <Text style={styles.itemText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  card: {
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  iconOn: { backgroundColor: "#EFF6FF" },
  iconOff: { backgroundColor: "#F3F4F6" },
  statusTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  statusBody: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20 },
  enableBtn: {
    marginTop: 8,
    backgroundColor: "#2563EB",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  enableBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  section: {
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemText: { fontSize: 14, color: "#374151" },
});
