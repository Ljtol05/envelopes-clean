import { View, Text, ScrollView } from 'react-native';
export default function Settings() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Settings</Text>
      <View style={{ height: 12 }} />
      <Text>Placeholder for settings.</Text>
    </ScrollView>
  );
}
