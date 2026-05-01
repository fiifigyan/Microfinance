import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type ModalType = "success" | "error" | "warning" | "info";

export type ModalButton = {
  text: string;
  onPress: () => void;
  variant?: "default" | "destructive" | "cancel";
};

export type AppModalProps = {
  visible: boolean;
  title?: string;
  message: string;
  type?: ModalType;
  buttons: ModalButton[];
  onBackdropPress?: () => void;
};

const TYPE_CONFIG: Record<
  ModalType,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  success: { icon: "checkmark-circle", color: "#10B981", bg: "#DCFCE7" },
  error: { icon: "close-circle", color: "#EF4444", bg: "#FEE2E2" },
  warning: { icon: "warning", color: "#F59E0B", bg: "#FEF3C7" },
  info: { icon: "information-circle", color: "#2563EB", bg: "#EFF6FF" },
};

export function AppModal({
  visible,
  title,
  message,
  type = "info",
  buttons,
  onBackdropPress,
}: AppModalProps) {
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(0.88);
      opacity.setValue(0);
    }
  }, [visible]);

  const cfg = TYPE_CONFIG[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onBackdropPress}
    >
      <Pressable style={styles.backdrop} onPress={onBackdropPress}>
        <Animated.View
          style={[styles.card, { opacity, transform: [{ scale }] }]}
          // prevent backdrop press from firing when tapping inside the card
          onStartShouldSetResponder={() => true}
        >
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={32} color={cfg.color} />
          </View>

          {/* Text */}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View
            style={[
              styles.buttonRow,
              buttons.length === 1 && styles.buttonRowSingle,
            ]}
          >
            {buttons.map((btn, i) => {
              const isDestructive = btn.variant === "destructive";
              const isCancel = btn.variant === "cancel";
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.btn,
                    buttons.length === 1 && styles.btnFull,
                    isDestructive && styles.btnDestructive,
                    isCancel && styles.btnCancel,
                    !isDestructive && !isCancel && styles.btnPrimary,
                  ]}
                  onPress={btn.onPress}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isDestructive && styles.btnTextDestructive,
                      isCancel && styles.btnTextCancel,
                      !isDestructive && !isCancel && styles.btnTextPrimary,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  buttonRowSingle: {
    flexDirection: "column",
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnFull: { flex: undefined, width: "100%" },
  btnPrimary: { backgroundColor: "#2563EB" },
  btnDestructive: { backgroundColor: "#EF4444" },
  btnCancel: { backgroundColor: "#F3F4F6" },
  btnText: { fontSize: 15, fontWeight: "600" },
  btnTextPrimary: { color: "#FFFFFF" },
  btnTextDestructive: { color: "#FFFFFF" },
  btnTextCancel: { color: "#374151" },
});
