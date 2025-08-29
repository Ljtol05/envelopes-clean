import { View, Text, ScrollView } from 'react-native';
export default function TransactionDetails() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Transaction Details</Text>
      <View style={{ height: 12 }} />
      <Text>Placeholder for a single transaction view.</Text>
    </ScrollView>
  );
}
