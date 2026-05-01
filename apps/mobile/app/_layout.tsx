import { Stack, useRouter, useSegments } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useEffect } from "react";
import { CustomClerkProvider } from "../providers/ClerkProvider";
import { ConvexClientProvider } from "../providers/ConvexProviderWithAuth";
import { usePushNotifications } from "../hooks/usePushNotifications";

function InitialLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Register for push notifications once the user is signed in
  usePushNotifications();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)");
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace("/sign-in");
    }
  }, [isSignedIn, isLoaded]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="transactions/deposit"
        options={{
          title: "Deposit",
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#FFFFFF",
        }}
      />
      <Stack.Screen
        name="transactions/withdraw"
        options={{
          title: "Withdraw",
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#FFFFFF",
        }}
      />
      <Stack.Screen
        name="transactions/transfer"
        options={{
          title: "Transfer",
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#FFFFFF",
        }}
      />
      <Stack.Screen
        name="account/[id]"
        options={{
          title: "Account Details",
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#FFFFFF",
        }}
      />
      <Stack.Screen
        name="loans/apply"
        options={{
          title: "Apply for Loan",
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#FFFFFF",
        }}
      />
      <Stack.Screen
        name="accounts/open"
        options={{
          title: "Open New Account",
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#FFFFFF",
        }}
      />
      <Stack.Screen
        name="profile/edit"
        options={{
          title: "Edit Profile",
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#FFFFFF",
        }}
      />
      <Stack.Screen
        name="loans/[id]"
        options={{
          title: "Loan Details",
          headerStyle: { backgroundColor: "#1E3A8A" },
          headerTintColor: "#FFFFFF",
        }}
      />
      <Stack.Screen
        name="loans/repay"
        options={{
          title: "Make a Payment",
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#FFFFFF",
        }}
      />
      <Stack.Screen
        name="transactions/[id]"
        options={{
          title: "Transaction Details",
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#FFFFFF",
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: "Notifications",
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#FFFFFF",
        }}
      />
      <Stack.Screen
        name="profile/security"
        options={{
          title: "Security",
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#FFFFFF",
        }}
      />
      <Stack.Screen
        name="profile/notification-settings"
        options={{
          title: "Notifications",
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#FFFFFF",
        }}
      />
      <Stack.Screen
        name="profile/kyc"
        options={{
          title: "Identity Verification",
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#FFFFFF",
        }}
      />
      <Stack.Screen
        name="account/statement"
        options={{
          title: "Account Statement",
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#FFFFFF",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <CustomClerkProvider>
      <ConvexClientProvider>
        <InitialLayout />
      </ConvexClientProvider>
    </CustomClerkProvider>
  );
}
