import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
