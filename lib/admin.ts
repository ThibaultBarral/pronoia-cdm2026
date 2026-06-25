import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_ANALYSES_LIMIT, type Plan } from "@/lib/plans";
import { WINBACK_MIN_VISIT_DAYS } from "@/lib/winback";
import { ACQUISITION_CHANNELS, isRealChannel } from "@/lib/acquisition";
import { NO_SUB_REASONS, isRealNoSubReason } from "@/lib/no-sub-survey";

const WHOP_COMPANY_ID = "biz_2exftzpAHl23k9";

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  isAdmin: boolean;
  bettorProfile: string | null;
  plan: Plan;
  status: string | null;
  analysesCount: number;
  freeAnalysesUsed: number;
  visitDays: number; // jours de visite distincts (tracking win-back)
  winbackSeen: boolean; // pop-up KICKOFF20 déjà affichée
  vip: boolean; // accès gratuit offert (admin), indépendant des plans payants
  revenue: number; // CA réel Whop (€), payé − remboursé
  acquisitionChannel: string | null; // "tiktok" | … | "skip" | null
  acquisitionDetail: string | null; // précision libre saisie par l'utilisateur
  noSubReason: string | null; // raison de non-abonnement | "skip" | null
  noSubDetail: string | null; // précision libre saisie par l'utilisateur
}

/** True if the currently authenticated user is an admin (app_metadata only). */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return Boolean(user?.app_metadata?.is_admin === true);
}

/**
 * Real revenue from Whop: sum of paid payments (creator subtotal − refunds),
 * total + per membership id. Empty/0 when there are no real payments yet.
 */
async function fetchWhopRevenue(): Promise<{ total: number; byMembership: Map<string, number> }> {
  const byMembership = new Map<string, number>();
  let total = 0;
  const key = process.env.WHOP_API_KEY;
  if (!key) return { total, byMembership };

  let cursor: string | null = null;
  try {
    for (let page = 0; page < 25; page++) {
      const url = new URL("https://api.whop.com/api/v1/payments");
      url.searchParams.set("company_id", WHOP_COMPANY_ID);
      url.searchParams.set("limit", "100");
      if (cursor) url.searchParams.set("starting_after", cursor);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) break;
      const json = await res.json();
      const data: Array<Record<string, unknown>> = json.data ?? [];

      for (const p of data) {
        if (p.status !== "paid") continue;
        const subtotal = typeof p.subtotal === "number" ? p.subtotal : 0;
        const refunded = typeof p.refunded_amount === "number" ? p.refunded_amount : 0;
        const net = subtotal - refunded;
        if (net <= 0) continue;
        total += net;
        const m = p.membership as { id?: string } | string | null;
        const mid = typeof m === "string" ? m : m?.id;
        if (mid) byMembership.set(mid, (byMembership.get(mid) ?? 0) + net);
      }

      cursor = (json.pagination?.next_cursor as string | null) ?? null;
      if (!cursor || data.length === 0) break;
    }
  } catch (err) {
    console.warn("[admin] Whop revenue fetch failed:", err);
  }
  return { total, byMembership };
}

/** Total real Whop revenue (€), payé − remboursé. For the costs dashboard. */
export async function getWhopRevenueTotal(): Promise<number> {
  return (await fetchWhopRevenue()).total;
}

/** All users + subscription/usage stats + real Whop revenue. Admin only. */
export async function getAdminData(): Promise<{ users: AdminUserRow[]; totalRevenue: number }> {
  if (!(await isAdmin())) return { users: [], totalRevenue: 0 };

  const admin = createAdminClient();

  const [{ data: list }, { data: subs }, revenue] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("subscriptions").select("user_id, plan, status, analyses_count, free_analyses_used, visit_days, winback_popup_seen_at, whop_membership_id, vip"),
    fetchWhopRevenue(),
  ]);

  const byId = new Map((subs ?? []).map((s) => [s.user_id as string, s]));
  const users = (list?.users ?? [])
    .map((u): AdminUserRow => {
      const s = byId.get(u.id);
      const membershipId = (s?.whop_membership_id as string | null) ?? null;
      const meta = u.user_metadata ?? {};
      const name =
        (meta.pseudo as string | undefined) ||
        (meta.full_name as string | undefined) ||
        (meta.name as string | undefined) ||
        null;
      return {
        id: u.id,
        name,
        email: u.email ?? null,
        createdAt: u.created_at ?? null,
        lastSignInAt: u.last_sign_in_at ?? null,
        isAdmin: u.app_metadata?.is_admin === true,
        bettorProfile: (u.user_metadata?.bettor_profile as string | null) ?? null,
        plan: ((s?.plan as Plan) ?? "free") as Plan,
        status: (s?.status as string | null) ?? null,
        analysesCount: (s?.analyses_count as number | null) ?? 0,
        freeAnalysesUsed: (s?.free_analyses_used as number | null) ?? 0,
        visitDays: (s?.visit_days as number | null) ?? 0,
        winbackSeen: Boolean(s?.winback_popup_seen_at),
        vip: Boolean(s?.vip),
        revenue: membershipId ? revenue.byMembership.get(membershipId) ?? 0 : 0,
        acquisitionChannel: (meta.acquisition_channel as string | null) ?? null,
        acquisitionDetail: (meta.acquisition_detail as string | null) ?? null,
        noSubReason: (meta.no_sub_reason as string | null) ?? null,
        noSubDetail: (meta.no_sub_detail as string | null) ?? null,
      };
    })
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return { users, totalRevenue: revenue.total };
}

// ─── Aggregated dashboard stats (pure, derived from the user rows) ─────────────

export interface PlanCount {
  plan: Plan;
  label: string;
  count: number;
}

export interface ChannelCount {
  channel: string;
  label: string;
  emoji: string;
  count: number;
}

export interface AdminStats {
  // Acquisition
  totalUsers: number;
  newUsers7d: number;
  newUsers30d: number;
  /** New users in the previous 7-day window (for a week-over-week delta). */
  prevNewUsers7d: number;
  signupsByDay: { date: string; count: number }[]; // last 14 days, oldest→newest
  // Activation / engagement
  onboardedRate: number; // % with a bettor profile
  activationRate: number; // % who ran ≥1 analysis
  usersWithAnalysis: number;
  totalAnalyses: number;
  avgAnalysesPerUser: number;
  // Retention
  activeUsers7d: number; // signed in within 7 days
  activeUsers30d: number;
  // Monetization
  paidUsers: number; // active/trialing on a paid plan
  vipUsers: number;
  conversionRate: number; // paidUsers / totalUsers
  totalRevenue: number;
  arpu: number; // revenue ÷ paying users
  planBreakdown: PlanCount[];
  // Acquisition channels ("comment nous as-tu connus")
  acquisitionBreakdown: ChannelCount[]; // real answered channels, desc by count
  acquisitionAnswered: number; // users who picked a real channel
  // Win-back (KICKOFF20)
  winbackShown: number; // pop-ups affichées (winback_popup_seen_at non null)
  winbackEligible: number; // non-abonnés actuellement éligibles (pas encore vue)
  // "Pourquoi pas d'abonnement ?"
  noSubBreakdown: { id: string; label: string; emoji: string; count: number }[];
  noSubAnswered: number; // utilisateurs ayant donné une vraie raison
  noSubDetails: { label: string; emoji: string; detail: string }[]; // verbatims libres
}

const PLAN_ORDER: Plan[] = ["free", "essential", "monthly", "lifetime", "weekly", "pass_cdm", "season"];
const PLAN_LABEL: Record<Plan, string> = {
  free: "Gratuit",
  essential: "Essential",
  monthly: "Premium",
  lifetime: "À vie",
  weekly: "Hebdo",
  pass_cdm: "Pass CDM",
  season: "Pass Saison",
};

/** Compute the dashboard metrics from already-fetched rows (no extra queries). */
export function computeAdminStats(
  users: AdminUserRow[],
  totalRevenue: number
): AdminStats {
  const now = Date.now();
  const DAY = 86_400_000;
  const within = (iso: string | null, fromDays: number, toDays = 0): boolean => {
    if (!iso) return false;
    const age = now - new Date(iso).getTime();
    return age >= toDays * DAY && age < fromDays * DAY;
  };

  const totalUsers = users.length;
  const newUsers7d = users.filter((u) => within(u.createdAt, 7)).length;
  const newUsers30d = users.filter((u) => within(u.createdAt, 30)).length;
  const prevNewUsers7d = users.filter((u) => within(u.createdAt, 14, 7)).length;

  const activeUsers7d = users.filter((u) => within(u.lastSignInAt, 7)).length;
  const activeUsers30d = users.filter((u) => within(u.lastSignInAt, 30)).length;

  const onboarded = users.filter((u) => u.bettorProfile).length;
  const usersWithAnalysis = users.filter((u) => u.analysesCount > 0).length;
  const totalAnalyses = users.reduce((s, u) => s + u.analysesCount, 0);

  const isPaid = (u: AdminUserRow) =>
    u.plan !== "free" && (u.status === "active" || u.status === "trialing");
  const paidUsers = users.filter(isPaid).length;
  const vipUsers = users.filter((u) => u.vip).length;

  // Signups for each of the last 14 calendar days (UTC), oldest → newest.
  const signupsByDay: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * DAY);
    const key = d.toISOString().slice(0, 10);
    const count = users.filter((u) => (u.createdAt ?? "").slice(0, 10) === key).length;
    signupsByDay.push({ date: key, count });
  }

  const planBreakdown: PlanCount[] = PLAN_ORDER.map((plan) => ({
    plan,
    label: PLAN_LABEL[plan],
    count: users.filter((u) => u.plan === plan).length,
  })).filter((p) => p.count > 0);

  const acquisitionBreakdown: ChannelCount[] = ACQUISITION_CHANNELS.map((c) => ({
    channel: c.id,
    label: c.label,
    emoji: c.emoji,
    count: users.filter((u) => u.acquisitionChannel === c.id).length,
  }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
  const acquisitionAnswered = users.filter((u) =>
    isRealChannel(u.acquisitionChannel)
  ).length;

  // Win-back (KICKOFF20): non-subscriber = free plan, not VIP.
  const winbackShown = users.filter((u) => u.winbackSeen).length;
  const winbackEligible = users.filter(
    (u) =>
      u.plan === "free" &&
      !u.vip &&
      !u.winbackSeen &&
      u.visitDays >= WINBACK_MIN_VISIT_DAYS &&
      u.freeAnalysesUsed >= FREE_ANALYSES_LIMIT,
  ).length;

  // "Pourquoi pas d'abonnement ?" — answered reasons, desc by count.
  const noSubBreakdown = NO_SUB_REASONS.map((r) => ({
    id: r.id,
    label: r.label,
    emoji: r.emoji,
    count: users.filter((u) => u.noSubReason === r.id).length,
  }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
  const noSubAnswered = users.filter((u) => isRealNoSubReason(u.noSubReason)).length;

  // Verbatims libres ("trop cher" → prix suggéré, "autre" → raison, etc.).
  const noSubDetails = users
    .filter((u) => isRealNoSubReason(u.noSubReason) && u.noSubDetail?.trim())
    .map((u) => {
      const meta = NO_SUB_REASONS.find((r) => r.id === u.noSubReason)!;
      return { label: meta.label, emoji: meta.emoji, detail: u.noSubDetail!.trim() };
    });

  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);

  return {
    totalUsers,
    newUsers7d,
    newUsers30d,
    prevNewUsers7d,
    signupsByDay,
    onboardedRate: pct(onboarded, totalUsers),
    activationRate: pct(usersWithAnalysis, totalUsers),
    usersWithAnalysis,
    totalAnalyses,
    avgAnalysesPerUser:
      totalUsers > 0 ? Math.round((totalAnalyses / totalUsers) * 10) / 10 : 0,
    activeUsers7d,
    activeUsers30d,
    paidUsers,
    vipUsers,
    conversionRate: pct(paidUsers, totalUsers),
    totalRevenue,
    arpu: paidUsers > 0 ? Math.round((totalRevenue / paidUsers) * 100) / 100 : 0,
    planBreakdown,
    acquisitionBreakdown,
    acquisitionAnswered,
    winbackShown,
    winbackEligible,
    noSubBreakdown,
    noSubAnswered,
    noSubDetails,
  };
}

async function findUserByEmail(email: string) {
  const admin = createAdminClient();
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return (list?.users ?? []).find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

/** Grant/revoke admin (sets app_metadata.is_admin). Admin only. */
export async function setAdmin(email: string, value: boolean): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Non autorisé." };

  const user = await findUserByEmail(email.trim());
  if (!user) return { ok: false, error: "Aucun compte avec cet e-mail." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...(user.app_metadata ?? {}), is_admin: value },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Conversion-funnel events (app_events) ────────────────────────────────────

export interface EventStats {
  days: number;
  welcomeView: number;
  welcomeClick: number;
  contactOpen: number;
  contactClick: number;
  contactByChannel: { channel: string; count: number }[];
}

/**
 * Aggregate the in-app funnel events over the last N days (welcome offer +
 * contact widget). Admin only; fail-safe — returns zeros if the table doesn't
 * exist yet (migration not applied) or on any error.
 */
export async function getAppEventStats(days = 7): Promise<EventStats> {
  const empty: EventStats = {
    days, welcomeView: 0, welcomeClick: 0, contactOpen: 0, contactClick: 0, contactByChannel: [],
  };
  if (!(await isAdmin())) return empty;
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const { data } = await admin
      .from("app_events")
      .select("name, props")
      .gte("created_at", since)
      .limit(20000);

    const rows = (data ?? []) as { name: string; props: Record<string, unknown> | null }[];
    const count = (n: string) => rows.filter((r) => r.name === n).length;

    const channels = new Map<string, number>();
    for (const r of rows) {
      if (r.name !== "contact_click") continue;
      const ch = String(r.props?.channel ?? "?");
      channels.set(ch, (channels.get(ch) ?? 0) + 1);
    }

    return {
      days,
      welcomeView: count("welcome_offer_view"),
      welcomeClick: count("welcome_offer_click"),
      contactOpen: count("contact_open"),
      contactClick: count("contact_click"),
      contactByChannel: [...channels.entries()]
        .map(([channel, c]) => ({ channel, count: c }))
        .sort((a, b) => b.count - a.count),
    };
  } catch (err) {
    console.warn("[admin] getAppEventStats error:", err);
    return empty;
  }
}

/**
 * Grant/revoke free VIP access (a comp) by email. Independent from the admin
 * role and from paid plans: sets subscriptions.vip. Admin only.
 */
export async function setFreeAccess(
  email: string,
  value: boolean
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Non autorisé." };

  const user = await findUserByEmail(email.trim());
  if (!user) return { ok: false, error: "Aucun compte avec cet e-mail." };

  const admin = createAdminClient();
  // Upsert keeps any existing paid-plan columns intact; only `vip` is set.
  // A brand-new row defaults plan='free' (column default).
  const { error } = await admin
    .from("subscriptions")
    .upsert({ user_id: user.id, vip: value }, { onConflict: "user_id" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
