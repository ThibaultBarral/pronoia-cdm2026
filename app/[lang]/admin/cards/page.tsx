import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppSidebar from "@/components/dashboard/app-sidebar";
import CardsStudio from "@/components/admin/cards-studio";
import { isAdmin } from "@/lib/admin";
import { COMPETITIONS } from "@/lib/competitions";
import { getCompetitionUpcoming, type ClubFixture } from "@/lib/club-data";

export const metadata: Metadata = { title: "Cards TikTok — Admin Copafever", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Admin content studio: every upcoming fixture of the 7 competitions, one
 * click → the basic 9:16 prediction card (the share route, `v=lecture`), to
 * post on TikTok / Reels without opening the match page.
 */
export default async function AdminCardsPage() {
  if (!(await isAdmin())) notFound();

  const lists = await Promise.all(COMPETITIONS.map((c) => getCompetitionUpcoming(c.slug, 12).catch(() => [] as ClubFixture[])));
  const fixtures = lists
    .flat()
    .filter((f) => f.analyzable)
    .sort((a, b) => Date.parse(a.kickoffIso) - Date.parse(b.kickoffIso));

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-5">
            <ArrowLeft size={14} /> Admin
          </Link>
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text)]">Cards TikTok</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1.5">
              Un match, un clic, une image 1080 × 1920 prête à poster. Les matchs à moins de 7 jours, 7 compétitions.
            </p>
          </header>
          <CardsStudio fixtures={fixtures} />
        </main>
      </div>
    </div>
  );
}
