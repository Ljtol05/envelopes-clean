// KYC API wrapper (axios via central api client) – now respects runtime API base overrides.
import apiClient from '../config/api';

import type { KycFormData, KycStatusResponse } from '../types/kyc';

export async function apiStartKyc(form: KycFormData): Promise<KycStatusResponse> {
  const { data } = await apiClient.post<KycStatusResponse>('/api/kyc/start', form);
  return data;
}

export async function apiGetKycStatus(): Promise<KycStatusResponse> {
  const { data } = await apiClient.get<KycStatusResponse>('/api/kyc/status');
  return data;
}

export const startKyc = apiStartKyc;
export const getKycStatus = apiGetKycStatus;
