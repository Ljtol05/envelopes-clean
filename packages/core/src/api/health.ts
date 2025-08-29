import { ApiClient } from './client';

export type HealthResponse = {
  status: string;
  timestamp?: string;
  service?: string;
  [k: string]: unknown;
};

export async function getHealth(api: ApiClient): Promise<HealthResponse> {
  return api.get<HealthResponse>('/healthz');
}
