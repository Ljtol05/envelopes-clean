import { View, Text, ScrollView } from 'react-native';
export default function Activity() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Activity</Text>
      <View style={{ height: 12 }} />
      <Text>Placeholder for recent transactions.</Text>
    </ScrollView>
  );
}
