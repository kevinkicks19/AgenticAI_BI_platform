/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  // More env variables can be added here
}

interface ImportMeta {
  readonly env: ImportMetaEnv & {
    readonly PROD: boolean;
    readonly DEV: boolean;
    readonly MODE: string;
  };
}

