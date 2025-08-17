// KYC API wrapper (axios via central api client) – now respects runtime API base overrides.
import apiClient from '../config/api';
import { ENDPOINTS } from '../config/endpoints';

import type { KycFormData, KycStatusResponse } from '../types/kyc';

export async function apiStartKyc(form: KycFormData): Promise<KycStatusResponse> {
  const { data } = await apiClient.post<KycStatusResponse>(ENDPOINTS.kycStart, form);
  return data;
}

export async function apiGetKycStatus(): Promise<KycStatusResponse> {
  const { data } = await apiClient.get<KycStatusResponse>(ENDPOINTS.kycStatus);
  return data;
}

export const startKyc = apiStartKyc;
export const getKycStatus = apiGetKycStatus;
