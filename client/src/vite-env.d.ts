/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_BETA?: string; readonly VITE_FEEDBACK_URL?: string; readonly VITE_API_URL?: string }
interface ImportMeta { readonly env: ImportMetaEnv }
