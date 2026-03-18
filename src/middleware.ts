import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Se as env vars não estiverem configuradas no Vercel, não quebre o middleware.
  // Isso permite que a tela de login carregue e exiba erro normal do Supabase no front.
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  let user: any = null;
  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: object }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const res = await supabase.auth.getUser();
    user = res.data.user ?? null;
  } catch {
    // Falha ao falar com Supabase/edge runtime: não bloquear rotas públicas.
    return response;
  }

  const isAuthRoute = request.nextUrl.pathname === "/login";
  const isResetRoute = request.nextUrl.pathname.startsWith("/login/reset");
  const isOnboarding = request.nextUrl.pathname === "/onboarding";
  const isAppRoute = request.nextUrl.pathname.startsWith("/app");

  if (!user) {
    if (isAppRoute || isOnboarding) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (user && isAuthRoute && !isResetRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/app/feed";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/login", "/login/reset", "/onboarding", "/app/:path*"],
};
