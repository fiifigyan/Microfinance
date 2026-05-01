import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { useModal } from "../../hooks/useModal";

export default function EditProfileScreen() {
  const profile = useQuery(api.queries.users.getProfile);
  const updateProfile = useMutation(api.mutations.users.updateProfile);
  const { showAlert, modalElement } = useModal();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!firstName.trim()) {
      showAlert("Validation", "First name is required.", "warning");
      return;
    }
    if (!lastName.trim()) {
      showAlert("Validation", "Last name is required.", "warning");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      showAlert("Success", "Profile updated successfully.", "success", () =>
        router.back(),
      );
    } catch (err: any) {
      showAlert("Error", err.message ?? "Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneRow}>
              <View style={styles.phonePrefixBox}>
                <Text style={styles.phonePrefix}>+233</Text>
              </View>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                value={phone}
                onChangeText={setPhone}
                placeholder="24 000 0000"
                keyboardType="phone-pad"
                maxLength={12}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={profile.email}
              editable={false}
            />
            <Text style={styles.hint}>Email is managed by your account provider.</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      {modalElement}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  form: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  fieldGroup: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  label: { fontSize: 12, fontWeight: "600", color: "#6B7280", marginBottom: 6, textTransform: "uppercase" },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  inputDisabled: { backgroundColor: "#F9FAFB", color: "#9CA3AF" },
  phoneRow: { flexDirection: "row", gap: 8 },
  phonePrefixBox: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
  },
  phonePrefix: { fontSize: 15, color: "#374151", fontWeight: "500" },
  phoneInput: { flex: 1 },
  hint: { fontSize: 12, color: "#9CA3AF", marginTop: 6 },
  saveBtn: {
    marginHorizontal: 16,
    marginVertical: 24,
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
