import { ApiClient } from './client';

export type EnvelopesResponse = {
  envelopes: Array<{
    id?: number;
    envelope_id?: string;
    name: string;
    balanceCents?: number;
    balance_cents?: number;
  }>;
};

export async function getEnvelopes(api: ApiClient): Promise<EnvelopesResponse> {
  return api.get<EnvelopesResponse>('/api/ai/mcp/envelopes');
}
