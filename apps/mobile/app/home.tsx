import { View, Text, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { api } from '../src/api/client';
import { useState } from 'react';
import { getHealth } from '@envelopes/core';

export default function Home() {
  const [status, setStatus] = useState<string>('');
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Home</Text>
      <View style={{ height: 12 }} />
      <Text>Placeholder for envelopes overview. Logic will come from @envelopes/core soon.</Text>
      <View style={{ height: 12 }} />
      <Pressable
        onPress={async () => {
          try {
            const res = await getHealth(api);
            setStatus(JSON.stringify(res));
          } catch (e) {
            setStatus(`error: ${e instanceof Error ? e.message : 'unknown'}`);
          }
        }}
        style={{ padding: 12, backgroundColor: '#eee', borderRadius: 8 }}
      >
        <Text>Ping API</Text>
      </Pressable>
      <View style={{ height: 12 }} />
      <Text selectable>{status}</Text>
      <View style={{ height: 24 }} />
      <Link href="/activity">Go to Activity</Link>
    </ScrollView>
  );
}
