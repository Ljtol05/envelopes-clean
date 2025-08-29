import { View, Text, ScrollView } from 'react-native';
export default function Rules() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Rules</Text>
      <View style={{ height: 12 }} />
      <Text>Placeholder for rules list and editing.</Text>
    </ScrollView>
  );
}
