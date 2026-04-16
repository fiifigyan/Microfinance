import { Stack } from "expo-router";
import { CustomClerkProvider } from "../providers/ClerkProvider";
import { ConvexClientProvider } from "../providers/ConvexProviderWithAuth";

export default function RootLayout() {
  return (
    <CustomClerkProvider>
      <ConvexClientProvider>
        <Stack>
          <Stack.Screen 
            name="(auth)" 
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="transaction/deposit" 
            options={{ 
              title: "Deposit",
              headerStyle: { backgroundColor: "#2563EB" },
              headerTintColor: "#FFFFFF",
            }} 
          />
        </Stack>
      </ConvexClientProvider>
    </CustomClerkProvider>
  );
}