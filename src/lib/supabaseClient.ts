import { createClient } from "@supabase/supabase-js";

// Retrieve keys from environment variables or use the user-provided fallbacks
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "https://nmngoqurkcxzeurjjwfl.supabase.co";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "sb_publishable_VaLtT9gGWOLj5qxadJj_jQ_dqaWwe3G";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isVercelDeployment() {
  // Check if we are running in a Vercel-like environment (often window.location contains specific terms, or during development vs production static builds)
  return window.location.hostname.includes("vercel") || window.location.hostname.includes("amplify") || window.location.hostname.includes("github.io");
}
