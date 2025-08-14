/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string; // optional in dev (auto-detected origin)
  readonly VITE_API_URL?: string; // new preferred short variable name
  readonly VITE_EVENTS_URL?: string;
  readonly VITE_REPLIT_USER_ID?: string;
  readonly VITE_REPLIT_USER_NAME?: string;
  readonly VITE_DEV_BYPASS_AUTH?: string;
  readonly VITE_NODE_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
