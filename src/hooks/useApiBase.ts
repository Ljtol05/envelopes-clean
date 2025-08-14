import { useMemo } from 'react';
import { API_BASE_URL } from '../config/api';

// Simple hook to retrieve (and memoize) the resolved API base URL for UI display / diagnostics.
export function useApiBase() {
  return useMemo(() => API_BASE_URL, []);
}

export default useApiBase;
