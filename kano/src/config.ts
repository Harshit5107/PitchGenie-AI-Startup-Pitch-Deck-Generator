// Centralized Configuration for Environment Variables
// In Vite, VITE_ prefix is required for client-side access

const getEnv = (name: string, fallback: string = "") => {
  const value = import.meta.env[name];
  if (!value || value === "placeholder-url" || value === "placeholder-key") {
    console.warn(`[Config] Missing Environment Variable: ${name}`);
    return fallback;
  }
  return value;
};

export const CONFIG = {
  SUPABASE_URL: getEnv("VITE_SUPABASE_URL", "https://placeholder-url.supabase.co"),
  SUPABASE_ANON_KEY: getEnv("VITE_SUPABASE_ANON_KEY", "placeholder-key"),
  BACKEND_URL: getEnv("VITE_BACKEND_URL", "http://localhost:3001"),
  GEMINI_API_KEY: getEnv("VITE_GEMINI_API_KEY"),
  FAL_KEY: getEnv("FAL_KEY"),
};

// Log initialization status for debugging (without leaking secrets)
console.log("[Config] Initialization Check:", {
  supabase: !!CONFIG.SUPABASE_URL && CONFIG.SUPABASE_URL !== "https://placeholder-url.supabase.co",
  anonKey: !!CONFIG.SUPABASE_ANON_KEY && CONFIG.SUPABASE_ANON_KEY !== "placeholder-key",
  backend: !!CONFIG.BACKEND_URL && CONFIG.BACKEND_URL !== "http://localhost:3001",
});
