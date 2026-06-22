import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { localizePath, splitLocale, type Locale } from "@/lib/i18n/config";

/**
 * Build the internal rewrite URL for a request. French (default) has no URL
 * prefix, so `/dashboard` must be served by the `app/[lang]` tree as
 * `/fr/dashboard`. English requests already carry `/en`, so Next routes them
 * directly — no rewrite needed.
 */
function internalUrl(request: NextRequest, locale: Locale): URL | null {
  if (locale !== "fr") return null; // /en/* already maps to [lang]=en
  const url = request.nextUrl.clone();
  url.pathname = url.pathname === "/" ? "/fr" : `/fr${url.pathname}`;
  return url;
}

export async function proxy(request: NextRequest) {
  const rawPath = request.nextUrl.pathname;
  // Resolve the active locale and the locale-stripped "logical" path used by
  // the auth rules below (so /en/dashboard is treated like /dashboard).
  const { locale, pathname: path } = splitLocale(rawPath);

  // Locale-aware redirect helper: keep the user inside their language.
  const rewrite = internalUrl(request, locale);

  const isPublicDashboard =
    path.startsWith("/dashboard/competitions") ||
    path.startsWith("/dashboard/roadmap");

  // Whether this request needs the Supabase session dance at all. Public
  // marketing/SEO pages skip it to stay fast and cacheable.
  const needsAuth =
    (path.startsWith("/dashboard") && !isPublicDashboard) ||
    path === "/onboarding" ||
    path.startsWith("/admin") ||
    path === "/login" ||
    path.startsWith("/match") ||
    path.startsWith("/team");

  // Fast path: no auth needed → just apply the locale rewrite (if any).
  if (!needsAuth) {
    return rewrite ? NextResponse.rewrite(rewrite, { request }) : NextResponse.next({ request });
  }

  // IMPORTANT (Supabase SSR): `response` must be recreated inside setAll after
  // the request cookies are updated, otherwise the refreshed auth token is not
  // propagated and the browser/server sessions desync → random sign-outs.
  let response = rewrite
    ? NextResponse.rewrite(rewrite, { request })
    : NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = rewrite
            ? NextResponse.rewrite(rewrite, { request })
            : NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Triggers the token refresh whose new cookies setAll writes onto `response`.
  const { data: { user } } = await supabase.auth.getUser();
  const hasProfile = Boolean(user?.user_metadata?.bettor_profile);
  const isAdminUser = user?.app_metadata?.is_admin === true;

  // Redirect to a locale-aware destination, carrying over refreshed cookies.
  const redirectTo = (dest: string) => {
    const r = NextResponse.redirect(new URL(localizePath(dest, locale), request.url));
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
    if (!hasProfile && path.startsWith("/dashboard") && !isPublicDashboard) {
      return redirectTo("/onboarding");
    }
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
  // Run on every page request (for the locale rewrite) EXCEPT API routes, the
  // OAuth callback, Next internals, and static files (anything with a dot).
  matcher: [
    "/((?!api|auth|_next|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*\\.).*)",
  ],
};
