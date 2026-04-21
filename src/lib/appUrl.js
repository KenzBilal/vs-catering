const DEFAULT_APP_URL = "https://vs-catering.vercel.app";

export const APP_BASE_URL = (import.meta.env.VITE_APP_BASE_URL || DEFAULT_APP_URL).replace(/\/$/, "");
