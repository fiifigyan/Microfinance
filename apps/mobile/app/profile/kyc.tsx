import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../../convex/_generated/api";

const DOC_TYPES = [
  { value: "NATIONAL_ID", label: "National ID" },
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVERS_LICENSE", label: "Driver's License" },
  { value: "VOTERS_CARD", label: "Voter's Card" },
] as const;

type DocType = (typeof DOC_TYPES)[number]["value"];

const STATUS_CONFIG = {
  PENDING: { color: "#D97706", bg: "#FEF3C7", icon: "time-outline" as const, label: "Under Review" },
  APPROVED: { color: "#10B981", bg: "#DCFCE7", icon: "checkmark-circle" as const, label: "Verified" },
  REJECTED: { color: "#EF4444", bg: "#FEE2E2", icon: "close-circle" as const, label: "Rejected" },
};

export default function KycScreen() {
  const kyc = useQuery(api.queries.kyc.getMyKyc);
  const submitKyc = useMutation(api.mutations.kyc.submitKyc);

  const [docType, setDocType] = useState<DocType>("NATIONAL_ID");
  const [docNumber, setDocNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!docNumber.trim() || !fullName.trim() || !dob.trim()) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await submitKyc({ documentType: docType, documentNumber: docNumber.trim(), fullName: fullName.trim(), dateOfBirth: dob.trim() });
      Alert.alert("Submitted", "Your KYC has been submitted for review. We'll notify you once it's processed.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to submit KYC");
    } finally {
      setLoading(false);
    }
  }

  if (kyc === undefined) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  // Already has a KYC record
  if (kyc && kyc.status !== "REJECTED") {
    const cfg = STATUS_CONFIG[kyc.status];
    return (
      <View style={styles.container}>
        <View style={styles.statusCard}>
          <View style={[styles.statusIconWrap, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={36} color={cfg.color} />
          </View>
          <Text style={styles.statusTitle}>{cfg.label}</Text>
          <Text style={styles.statusBody}>
            {kyc.status === "APPROVED"
              ? "Your identity has been verified. You can now apply for loans."
              : "Your documents are being reviewed. You'll receive a notification once processed."}
          </Text>
          <View style={styles.detailBox}>
            <Row label="Document Type" value={DOC_TYPES.find(d => d.value === kyc.documentType)?.label ?? kyc.documentType} />
            <Row label="Document Number" value={kyc.documentNumber} />
            <Row label="Full Name" value={kyc.fullName} />
            <Row label="Date of Birth" value={kyc.dateOfBirth} />
            <Row
              label="Submitted"
              value={new Date(kyc.submittedAt).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {kyc?.status === "REJECTED" && (
          <View style={styles.rejectedBanner}>
            <Ionicons name="warning-outline" size={18} color="#B45309" />
            <Text style={styles.rejectedText}>
              {kyc.reviewNote
                ? `Previous submission rejected: ${kyc.reviewNote}`
                : "Previous submission was rejected. Please re-submit with correct details."}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Type</Text>
          <View style={styles.docTypeGrid}>
            {DOC_TYPES.map((dt) => (
              <TouchableOpacity
                key={dt.value}
                style={[styles.docTypeBtn, docType === dt.value && styles.docTypeBtnActive]}
                onPress={() => setDocType(dt.value)}
              >
                <Text style={[styles.docTypeBtnText, docType === dt.value && styles.docTypeBtnTextActive]}>
                  {dt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <Field label="Full Name (as on document)" value={fullName} onChange={setFullName} placeholder="e.g. Kwame Mensah" loading={loading} />
          <Field label="Document Number" value={docNumber} onChange={setDocNumber} placeholder="e.g. GHA-123456789-0" loading={loading} />
          <Field label="Date of Birth" value={dob} onChange={setDob} placeholder="DD/MM/YYYY" loading={loading} keyboardType="numbers-and-punctuation" />
        </View>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
          <Text style={styles.noticeText}>
            Provide details exactly as they appear on your ID. Review typically takes 1–2 business days.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit for Verification</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Field({
  label, value, onChange, placeholder, loading, keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  loading: boolean;
  keyboardType?: any;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        editable={!loading}
        keyboardType={keyboardType ?? "default"}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  statusCard: {
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statusIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  statusTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  statusBody: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20 },
  detailBox: {
    width: "100%",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  rowLabel: { fontSize: 13, color: "#6B7280" },
  rowValue: { fontSize: 13, fontWeight: "500", color: "#111827", maxWidth: "60%", textAlign: "right" },

  rejectedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    margin: 16,
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  rejectedText: { flex: 1, fontSize: 13, color: "#B45309", lineHeight: 18 },

  section: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  docTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  docTypeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  docTypeBtnActive: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  docTypeBtnText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  docTypeBtnTextActive: { color: "#2563EB", fontWeight: "600" },

  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: "#374151" },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    color: "#111827",
  },

  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  noticeText: { flex: 1, fontSize: 12, color: "#6B7280", lineHeight: 18 },

  submitBtn: {
    backgroundColor: "#2563EB",
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
