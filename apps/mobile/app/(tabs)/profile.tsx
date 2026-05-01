import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../../convex/_generated/api";
import { useModal } from "../../hooks/useModal";

const APP_VERSION = "1.0.0";

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  SAVINGS: "Savings",
  CURRENT: "Current",
  FIXED_DEPOSIT: "Fixed Deposit",
};

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: "Customer",
  AGENT: "Agent",
  ADMIN: "Admin",
};

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const profile = useQuery(api.queries.users.getProfile);
  const kyc = useQuery(api.queries.kyc.getMyKyc);
  const { showConfirm, modalElement } = useModal();

  const handleLogout = () => {
    showConfirm(
      "Logout",
      "Are you sure you want to logout?",
      () => signOut(),
      { confirmText: "Logout", destructive: true },
    );
  };

  const handleContactSupport = () => {
    Linking.openURL("mailto:support@microfinance.gh?subject=Support%20Request");
  };

  if (profile === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (profile === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load profile.</Text>
      </View>
    );
  }

  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();
  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-GH", {
    month: "long",
    year: "numeric",
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── Profile Header ───────────────────────────────── */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {profile.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={10} color="#FFFFFF" />
            </View>
          )}
        </View>

        <Text style={styles.profileName}>
          {profile.firstName} {profile.lastName}
        </Text>
        <Text style={styles.profileEmail}>{profile.email}</Text>

        <View style={styles.metaRow}>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{ROLE_LABEL[profile.role]}</Text>
          </View>
          {profile.phone ? (
            <Text style={styles.phoneText}>+233 {profile.phone}</Text>
          ) : null}
        </View>

        <Text style={styles.memberSince}>Member since {memberSince}</Text>
      </View>

      {/* ── Stats ────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            GHS {profile.stats.totalBalance.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Total Balance</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile.stats.accountCount}</Text>
          <Text style={styles.statLabel}>Accounts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile.stats.activeLoans}</Text>
          <Text style={styles.statLabel}>Active Loans</Text>
        </View>
      </View>

      {/* ── Accounts ─────────────────────────────────────── */}
      {profile.accounts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Accounts</Text>
          {profile.accounts.map((account) => (
            <TouchableOpacity
              key={account._id}
              style={styles.accountRow}
              onPress={() => router.push(`/account/${account._id}`)}
            >
              <View style={styles.accountIconBox}>
                <Ionicons name="wallet-outline" size={18} color="#2563EB" />
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountType}>
                  {ACCOUNT_TYPE_LABEL[account.type]}
                </Text>
                <Text style={styles.accountNumber}>{account.accountNumber}</Text>
              </View>
              <Text style={styles.accountBalance}>
                GHS {account.balance.toFixed(2)}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Settings ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/profile/edit")}
        >
          <View style={[styles.menuIcon, { backgroundColor: "#EFF6FF" }]}>
            <Ionicons name="person-outline" size={18} color="#2563EB" />
          </View>
          <Text style={styles.menuLabel}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/profile/security")}
        >
          <View style={[styles.menuIcon, { backgroundColor: "#F0FDF4" }]}>
            <Ionicons name="lock-closed-outline" size={18} color="#10B981" />
          </View>
          <Text style={styles.menuLabel}>Security</Text>
          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/profile/notification-settings")}
        >
          <View style={[styles.menuIcon, { backgroundColor: "#FFFBEB" }]}>
            <Ionicons name="notifications-outline" size={18} color="#D97706" />
          </View>
          <Text style={styles.menuLabel}>Notifications</Text>
          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemLast]}
          onPress={() => router.push("/profile/kyc")}
        >
          <View style={[
            styles.menuIcon,
            {
              backgroundColor: kyc?.status === "APPROVED"
                ? "#F0FDF4"
                : kyc?.status === "PENDING"
                ? "#FFFBEB"
                : "#FFF5F5",
            },
          ]}>
            <Ionicons
              name={
                kyc?.status === "APPROVED"
                  ? "shield-checkmark-outline"
                  : kyc?.status === "PENDING"
                  ? "time-outline"
                  : "shield-outline"
              }
              size={18}
              color={
                kyc?.status === "APPROVED"
                  ? "#10B981"
                  : kyc?.status === "PENDING"
                  ? "#D97706"
                  : "#EF4444"
              }
            />
          </View>
          <Text style={styles.menuLabel}>Identity Verification</Text>
          {kyc?.status === "APPROVED" ? (
            <Text style={styles.kycVerifiedBadge}>Verified</Text>
          ) : kyc?.status === "PENDING" ? (
            <Text style={styles.kycPendingBadge}>Pending</Text>
          ) : (
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Help & Support ───────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help & Support</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Linking.openURL("https://microfinance.gh/help")}
        >
          <View style={[styles.menuIcon, { backgroundColor: "#F5F3FF" }]}>
            <Ionicons name="help-circle-outline" size={18} color="#7C3AED" />
          </View>
          <Text style={styles.menuLabel}>Help Center</Text>
          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleContactSupport}
        >
          <View style={[styles.menuIcon, { backgroundColor: "#FFF1F2" }]}>
            <Ionicons name="mail-outline" size={18} color="#E11D48" />
          </View>
          <Text style={styles.menuLabel}>Contact Support</Text>
          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemLast]}
          onPress={() => Linking.openURL("https://microfinance.gh/legal")}
        >
          <View style={[styles.menuIcon, { backgroundColor: "#F3F4F6" }]}>
            <Ionicons name="document-text-outline" size={18} color="#6B7280" />
          </View>
          <Text style={styles.menuLabel}>Terms & Privacy</Text>
          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </TouchableOpacity>
      </View>

      {/* ── Logout ───────────────────────────────────────── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* ── App Version ──────────────────────────────────── */}
      <Text style={styles.version}>Version {APP_VERSION}</Text>

      {modalElement}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#6B7280", fontSize: 14 },

  // Header
  profileHeader: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  avatarWrapper: { position: "relative", marginBottom: 12 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#FFFFFF" },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileName: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4 },
  profileEmail: { fontSize: 14, color: "#6B7280", marginBottom: 10 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  rolePill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleText: { fontSize: 12, fontWeight: "600", color: "#2563EB" },
  phoneText: { fontSize: 13, color: "#374151" },
  memberSince: { fontSize: 12, color: "#9CA3AF" },

  // Stats
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statCard: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 2 },
  statLabel: { fontSize: 11, color: "#6B7280" },
  statDivider: { width: 1, backgroundColor: "#E5E7EB", marginVertical: 4 },

  // Section
  section: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },

  // Account rows
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 10,
  },
  accountIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  accountInfo: { flex: 1 },
  accountType: { fontSize: 14, fontWeight: "600", color: "#111827" },
  accountNumber: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  accountBalance: { fontSize: 13, fontWeight: "600", color: "#111827", marginRight: 4 },

  // Menu items
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: { flex: 1, fontSize: 14, color: "#111827" },
  kycVerifiedBadge: { fontSize: 12, fontWeight: "600", color: "#10B981" },
  kycPendingBadge: { fontSize: 12, fontWeight: "600", color: "#D97706" },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FFF5F5",
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#EF4444" },

  // Version
  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#D1D5DB",
    marginTop: 16,
    marginBottom: 32,
  },
});
