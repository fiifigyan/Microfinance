import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { Stack } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../convex/_generated/api";

export default function NotificationsScreen() {
  const notifications = useQuery(api.queries.notifications.getNotifications);
  const markAllRead = useMutation(api.mutations.notifications.markAllRead);
  const markRead = useMutation(api.mutations.notifications.markRead);

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  function formatTime(ts: number) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString("en-GH", { day: "numeric", month: "short" });
  }

  if (notifications === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () =>
            unreadCount > 0 ? (
              <TouchableOpacity onPress={() => markAllRead({})} style={styles.markAllBtn}>
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={52} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>
            You'll see alerts here for loans, payments, and account activity.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {notifications.map((n) => (
            <TouchableOpacity
              key={n._id}
              style={[styles.row, !n.read && styles.rowUnread]}
              activeOpacity={0.7}
              onPress={() => { if (!n.read) markRead({ notificationId: n._id }); }}
            >
              <View style={[styles.dot, n.read && styles.dotRead]} />
              <View style={styles.content}>
                <Text style={[styles.title, !n.read && styles.titleUnread]}>{n.title}</Text>
                <Text style={styles.body} numberOfLines={2}>{n.body}</Text>
                <Text style={styles.time}>{formatTime(n.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  markAllBtn: { marginRight: 4, paddingHorizontal: 4, paddingVertical: 4 },
  markAllText: { fontSize: 13, color: "#FFFFFF", fontWeight: "500" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 10,
    marginTop: -60,
  },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#374151", marginTop: 8 },
  emptySubtitle: { fontSize: 14, color: "#9CA3AF", textAlign: "center", lineHeight: 20 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  rowUnread: { backgroundColor: "#EFF6FF" },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
    marginTop: 6,
    flexShrink: 0,
  },
  dotRead: { backgroundColor: "#E5E7EB" },
  content: { flex: 1, gap: 3 },
  title: { fontSize: 14, fontWeight: "500", color: "#374151" },
  titleUnread: { fontWeight: "700", color: "#111827" },
  body: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  time: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
});
