"use server";

import {
  searchClubs,
  getClubById,
  getClubFixtures,
  getCompetitionUpcoming,
  type ClubSummary,
  type ClubFixture,
} from "@/lib/club-data";
import { createClient } from "@/lib/supabase/server";

/** Club name search for the team picker (onboarding + dashboard). */
export async function searchClubsAction(query: string): Promise<ClubSummary[]> {
  return searchClubs(query, 8);
}

export async function getClubAction(apiId: number): Promise<ClubSummary | null> {
  return getClubById(apiId);
}

/** Past + upcoming fixtures of a club (lean rows, 7-day analysable flag). */
export async function getClubFixturesAction(
  apiId: number,
): Promise<{ past: ClubFixture[]; upcoming: ClubFixture[] }> {
  return getClubFixtures(apiId);
}

/**
 * Remember the supporter's club on the account (user metadata) and mark the
 * onboarding as done. `bettor_profile` is the legacy flag the proxy checks to
 * decide whether onboarding is complete; its value is meaningless now.
 */
export async function saveFavoriteClubAction(club: {
  apiId: number;
  name: string;
  logo: string | null;
  competitionSlug: string;
}): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: {
      favorite_club_id: club.apiId,
      favorite_club_name: club.name,
      favorite_club_logo: club.logo,
      favorite_club_competition: club.competitionSlug,
      bettor_profile: "supporter",
    },
  });
  return { ok: !error };
}

/** Next fixtures of a competition — the landing page chips. */
export async function getCompetitionFixturesAction(slug: string): Promise<ClubFixture[]> {
  return getCompetitionUpcoming(slug, 8);
}
