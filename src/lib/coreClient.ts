import { ApiClient } from '../../packages/core/src/api/client';
import { API_BASE_URL } from '../config/api';

const REPLIT_USER_ID = import.meta.env.VITE_REPLIT_USER_ID || '';
const REPLIT_USER_NAME = import.meta.env.VITE_REPLIT_USER_NAME || '';

function getToken(): string | undefined {
  try {
    const t = localStorage.getItem('auth_token');
    return t || undefined;
  } catch {
    return undefined;
  }
}

export const coreApi = new ApiClient({
  baseUrl: API_BASE_URL,
  getAuthToken: getToken,
  extraHeaders: {
    ...(REPLIT_USER_ID ? { 'x-replit-user-id': REPLIT_USER_ID } : {}),
    ...(REPLIT_USER_NAME ? { 'x-replit-user-name': REPLIT_USER_NAME } : {}),
  },
});
