// Dynamic backend URL based on environment
// In local dev, it defaults to localhost:3001
// In production, it uses VITE_BACKEND_URL from environment variables

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
