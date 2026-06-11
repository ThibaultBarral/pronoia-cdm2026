import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // IMPORTANT (Supabase SSR): `response` must be recreated inside setAll after
  // the request cookies are updated, otherwise the refreshed auth token is not
  // propagated and the browser/server sessions desync → random sign-outs. See
  // the canonical @supabase/ssr Next.js middleware pattern.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Must run immediately after createServerClient — triggers the token refresh
  // whose new cookies setAll writes onto `response`.
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const hasProfile = Boolean(user?.user_metadata?.bettor_profile);
  const isAdminUser = user?.app_metadata?.is_admin === true;

  // Read-only vitrine pages under /dashboard that stay public (SEO + conversion):
  // the Competitions hub/detail and the Roadmap. They never expose user data and
  // are crawlable, so they're exempt from the auth + onboarding redirects below.
  const isPublicDashboard =
    path.startsWith("/dashboard/competitions") ||
    path.startsWith("/dashboard/roadmap");

  // Redirect while carrying over any refreshed auth cookies, so navigating into
  // a redirect branch never drops the freshly-rotated session.
  const redirectTo = (dest: string) => {
    const r = NextResponse.redirect(new URL(dest, request.url));
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  // Not signed in → protect private areas.
  if (
    !user &&
    ((path.startsWith("/dashboard") && !isPublicDashboard) ||
      path === "/onboarding" ||
      path.startsWith("/admin"))
  ) {
    return redirectTo("/login");
  }

  // Admin area — admins only.
  if (user && path.startsWith("/admin") && !isAdminUser) {
    return redirectTo("/dashboard");
  }

  if (user) {
    // Signed in but no bettor profile yet → force onboarding once.
    if (!hasProfile && path.startsWith("/dashboard") && !isPublicDashboard) {
      return redirectTo("/onboarding");
    }
    // Already onboarded → keep them out of /login and /onboarding.
    if (path === "/login") {
      return redirectTo("/dashboard");
    }
    if (hasProfile && path === "/onboarding") {
      return redirectTo("/dashboard");
    }
  }

  return response;
}

export const config = {
  // Refresh the Supabase session everywhere a signed-in user navigates —
  // including /match (where they read "un pari") so the token never goes stale
  // there and they aren't bounced to /login on the next click. Public marketing
  // pages (/, /cgu, …) are left out so anonymous/SEO traffic skips the auth hop.
  matcher: [
    "/dashboard/:path*",
    "/match/:path*",
    "/team/:path*",
    "/login",
    "/onboarding",
    "/admin/:path*",
    "/admin",
  ],
};
