import type { MetadataRoute } from "next";
import { getMatches, teamSlug } from "@/lib/data-service";
import { TEAM_META } from "@/lib/team-ids";

const BASE = "https://copafever.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/cgu`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/confidentialite`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  let matchPages: MetadataRoute.Sitemap = [];
  try {
    const matches = await getMatches();
    matchPages = matches.map((m): MetadataRoute.Sitemap[number] => ({
      url: `${BASE}/match/${m.id}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    }));
  } catch {
    /* sitemap still valid without match pages */
  }

  const teamPages: MetadataRoute.Sitemap = Object.keys(TEAM_META).map(
    (name): MetadataRoute.Sitemap[number] => ({
      url: `${BASE}/team/${teamSlug(name)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    })
  );

  return [...staticPages, ...matchPages, ...teamPages];
}
