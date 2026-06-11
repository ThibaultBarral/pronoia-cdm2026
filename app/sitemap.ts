import type { MetadataRoute } from "next";
import { getMatches, teamSlug } from "@/lib/data-service";
import { TEAM_META } from "@/lib/team-ids";
import { COMPETITIONS } from "@/lib/competitions";
import { getCompetitionClubs } from "@/lib/competition-data";

const BASE = "https://copafever.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/dashboard/competitions`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/dashboard/roadmap`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/cgu`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/confidentialite`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Competition pages + their real club fiches (high SEO value per championship).
  const competitionPages: MetadataRoute.Sitemap = [];
  for (const c of COMPETITIONS) {
    competitionPages.push({
      url: `${BASE}/dashboard/competitions/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    });
    try {
      const clubs = await getCompetitionClubs(c.slug);
      for (const club of clubs) {
        competitionPages.push({
          url: `${BASE}/dashboard/competitions/${c.slug}/${club.slug}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    } catch {
      /* sitemap still valid without this competition's clubs */
    }
  }

  let matchPages: MetadataRoute.Sitemap = [];
  try {
    const matches = await getMatches();
    const today = now.toISOString().slice(0, 10);
    // Soonest upcoming matches first → highest priority, decreasing gradually.
    const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date));
    matchPages = sorted.map((m, i): MetadataRoute.Sitemap[number] => {
      const upcoming = m.date >= today;
      // 0.9 for the very next match, easing down to ~0.6 for the last one.
      const priority = Math.max(
        0.6,
        Number((0.9 - (i / Math.max(sorted.length - 1, 1)) * 0.3).toFixed(2))
      );
      return {
        url: `${BASE}/match/${m.id}`,
        lastModified: now,
        changeFrequency: upcoming ? "daily" : "weekly",
        priority,
      };
    });
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

  return [...staticPages, ...competitionPages, ...matchPages, ...teamPages];
}
