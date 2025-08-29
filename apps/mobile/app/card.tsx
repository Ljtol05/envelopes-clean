import { View, Text, ScrollView } from 'react-native';
export default function Card() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Card</Text>
      <View style={{ height: 12 }} />
      <Text>Placeholder for card details and controls.</Text>
    </ScrollView>
  );
}
