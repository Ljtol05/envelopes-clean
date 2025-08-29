import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="home" options={{ title: 'Home' }} />
        <Stack.Screen name="activity" options={{ title: 'Activity' }} />
        <Stack.Screen name="card" options={{ title: 'Card' }} />
        <Stack.Screen name="rules" options={{ title: 'Rules' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="transaction-details" options={{ title: 'Transaction' }} />
      </Stack>
      <StatusBar style="auto" />
    </View>
  );
}
