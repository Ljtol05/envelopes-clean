import Constants from 'expo-constants';
import { ApiClient } from '@envelopes/core';

const API_URL = (Constants?.expoConfig?.extra as any)?.API_URL || process.env.VITE_API_URL || '';

export const api = new ApiClient({
  baseUrl: API_URL,
  getAuthToken: () => undefined,
});
