import Constants from 'expo-constants';
import { ApiClient } from '@envelopes/core';

type ExpoExtra = { API_URL?: string } | undefined;
const extra = (Constants?.expoConfig?.extra as ExpoExtra) || undefined;
const API_URL = extra?.API_URL || process.env.VITE_API_URL || '';

export const api = new ApiClient({
  baseUrl: API_URL,
  getAuthToken: () => undefined,
});
