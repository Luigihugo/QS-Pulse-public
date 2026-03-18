import { createClient } from "@/lib/supabase/server";

/**
 * Retorna o usuário autenticado no servidor (Server Components, Route Handlers, Server Actions).
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
