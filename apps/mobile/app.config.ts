import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Envelopes Mobile',
  slug: 'envelopes-mobile',
  scheme: 'envelopes',
  extra: {
    API_URL: process.env.VITE_API_URL,
  },
};
export default config;
