// lib/supabase.ts
// Браузерный клиент Supabase.
// ВАЖНО: createBrowserClient хранит сессию в КУКАХ — middleware (middleware.ts)
// видит авторизацию. Обычный createClient хранил бы в localStorage и вход не работал бы.

import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);