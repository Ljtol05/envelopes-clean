import { View, Text, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { getEnvelopes, EnvelopesResponse } from '@envelopes/core';
import { api } from '../src/api/client';

export default function Activity() {
  const [data, setData] = useState<EnvelopesResponse | null>(null);
  const [err, setErr] = useState<string>('');
  useEffect(() => {
    getEnvelopes(api)
      .then((d) => setData(d))
      .catch((e) => setErr(e instanceof Error ? e.message : 'unknown'));
  }, []);
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Activity</Text>
      <View style={{ height: 12 }} />
      {err ? <Text selectable style={{ color: 'red' }}>{err}</Text> : null}
      {data?.envelopes?.map((e, idx) => (
        <Text key={String(e.id || e.envelope_id || idx)}>{e.name}</Text>
      ))}
    </ScrollView>
  );
}
