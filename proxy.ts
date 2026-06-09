import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const hasProfile = Boolean(user?.user_metadata?.bettor_profile);
  const isAdminUser = user?.app_metadata?.is_admin === true;

  // Not signed in → protect private areas.
  if (!user && (path.startsWith("/dashboard") || path === "/onboarding" || path.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin area — admins only.
  if (user && path.startsWith("/admin") && !isAdminUser) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (user) {
    // Signed in but no bettor profile yet → force onboarding once.
    if (!hasProfile && path.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    // Already onboarded → keep them out of /login and /onboarding.
    if (path === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (hasProfile && path === "/onboarding") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/onboarding", "/admin/:path*", "/admin"],
};
