import { createClient } from "@supabase/supabase-js";
import { createServerClient as createSupabaseSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Admin client — service role, bypasses RLS. For server-side reads.
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// SSR-aware client — reads auth cookies, respects RLS.
// Use in Server Components and Server Actions that need the user's auth context.
export async function createSSRClient() {
  const cookieStore = await cookies();
  return createSupabaseSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // In RSC (read-only context), cookie writes are no-ops
          }
        },
      },
    }
  );
}
