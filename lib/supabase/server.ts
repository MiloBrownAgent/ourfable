import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    !(supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))
  ) {
    console.error(
      'Supabase server client: invalid configuration. ' +
        `NEXT_PUBLIC_SUPABASE_URL="${supabaseUrl}", ` +
        `NEXT_PUBLIC_SUPABASE_ANON_KEY set=${Boolean(supabaseAnonKey)}`
    );
    throw new Error(
      'Supabase server client is not configured correctly. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.'
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
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
          // Ignored in Server Components where cookies can't be set
        }
      },
    },
  });
}
