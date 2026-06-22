import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/onboarding", "/api/", "/en/dashboard", "/en/onboarding"],
    },
    sitemap: "https://copafever.com/sitemap.xml",
    host: "https://copafever.com",
  };
}
