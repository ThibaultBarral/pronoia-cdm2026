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

/** Aggregated failed/abandoned payment attempts for one would-be customer. */
interface FailedAttempt {
  userId: string;
  attempts: number; // nombre de tentatives non abouties
  lastAmount: number; // montant de la dernière tentative (€)
  lastOffer: string; // intitulé de l'offre tentée
  lastReason: string; // catégorie d'échec (3DS, carte refusée, …)
  lastAt: string; // ISO de la dernière tentative
}

/** Extract our Supabase userId from a Whop payment's metadata (object or JSON string). */
function whopUserId(p: Record<string, unknown>): string | null {
  const m = p.metadata;
  if (m && typeof m === "object") {
    const id = (m as Record<string, unknown>).userId;
    return typeof id === "string" ? id : null;
  }
  if (typeof m === "string") {
    try {
      const id = JSON.parse(m)?.userId;
      return typeof id === "string" ? id : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Short, human label for why a payment attempt failed. */
function failureCategory(p: Record<string, unknown>): string {
  const raw = [
    p.failure_reason, p.failure_message, p.last_payment_error,
    (p.error as { message?: string } | null)?.message,
  ]
    .map((x) => (typeof x === "string" ? x : ""))
    .join(" ")
    .toLowerCase();
  if (/3d ?secure|3ds|verify your identity|verification/.test(raw)) return "3D Secure (vérif. bancaire)";
  if (/insufficient funds/.test(raw)) return "Fonds insuffisants";
  if (/declined/.test(raw)) return "Carte refusée";
  if (String(p.status) === "open" || String(p.status) === "incomplete") return "Abandon en cours de paiement";
  return "Autre échec";
}

/**
 * Real revenue from Whop: sum of paid payments (creator subtotal − refunds),
 * total + per membership id. Also surfaces would-be customers whose payment
 * attempts all failed (3DS, declined…) — money to recover. Empty when there
 * are no real payments yet.
 */
async function fetchWhopRevenue(): Promise<{
  total: number;
  byMembership: Map<string, number>;
  paidUserIds: Set<string>;
  failedByUser: Map<string, FailedAttempt>;
}> {
  const byMembership = new Map<string, number>();
  const paidUserIds = new Set<string>();
  const failedByUser = new Map<string, FailedAttempt>();
  let total = 0;
  const key = process.env.WHOP_API_KEY;
  if (!key) return { total, byMembership, paidUserIds, failedByUser };

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
        const uid = whopUserId(p);

        if (p.status === "paid") {
          if (uid) paidUserIds.add(uid);
          const subtotal = typeof p.subtotal === "number" ? p.subtotal : 0;
          const refunded = typeof p.refunded_amount === "number" ? p.refunded_amount : 0;
          const net = subtotal - refunded;
          if (net <= 0) continue;
          total += net;
          const m = p.membership as { id?: string } | string | null;
          const mid = typeof m === "string" ? m : m?.id;
          if (mid) byMembership.set(mid, (byMembership.get(mid) ?? 0) + net);
          continue;
        }

        // Non-paid attempt (open / failed / pending / incomplete) → recovery candidate.
        if (!uid) continue;
        const amount = typeof p.subtotal === "number" ? p.subtotal : 0;
        const at = typeof p.created_at === "string" ? p.created_at : "";
        const offer = typeof p.description === "string" && p.description ? p.description : "Offre";
        const prev = failedByUser.get(uid);
        if (!prev) {
          failedByUser.set(uid, {
            userId: uid, attempts: 1, lastAmount: amount, lastOffer: offer,
            lastReason: failureCategory(p), lastAt: at,
          });
        } else {
          prev.attempts += 1;
          if (at >= prev.lastAt) {
            prev.lastAmount = amount;
            prev.lastOffer = offer;
            prev.lastReason = failureCategory(p);
            prev.lastAt = at;
          }
        }
      }

      cursor = (json.pagination?.next_cursor as string | null) ?? null;
      if (!cursor || data.length === 0) break;
    }
  } catch (err) {
    console.warn("[admin] Whop revenue fetch failed:", err);
  }
  return { total, byMembership, paidUserIds, failedByUser };
}

/** Total real Whop revenue (€), payé − remboursé. For the costs dashboard. */
export async function getWhopRevenueTotal(): Promise<number> {
  return (await fetchWhopRevenue()).total;
}

/** A would-be customer whose payment attempts all failed — money to recover. */
export interface RecoverablePayment {
  userId: string;
  email: string | null;
  name: string | null;
  amount: number; // montant de la dernière tentative (€)
  offer: string; // intitulé de l'offre tentée
  reason: string; // catégorie d'échec (3DS, carte refusée…)
  attempts: number; // nombre de tentatives non abouties
  lastAt: string; // ISO de la dernière tentative
  sentAt: string | null; // ISO du dernier e-mail de relance envoyé (persisté)
}

/** All users + subscription/usage stats + real Whop revenue. Admin only. */
export async function getAdminData(): Promise<{
  users: AdminUserRow[];
  totalRevenue: number;
  recoverable: RecoverablePayment[];
}> {
  if (!(await isAdmin())) return { users: [], totalRevenue: 0, recoverable: [] };

  const admin = createAdminClient();

  const [{ data: list }, { data: subs }, revenue, { data: sentEvents }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("subscriptions").select("user_id, plan, status, analyses_count, free_analyses_used, visit_days, winback_popup_seen_at, whop_membership_id, vip"),
    fetchWhopRevenue(),
    admin.from("app_events").select("user_id, created_at").eq("name", "recovery_email_sent").order("created_at", { ascending: false }),
  ]);

  // Dernier e-mail de relance envoyé par utilisateur (badge "Relancé" persistant).
  const recoveryByUser = new Map<string, string>();
  for (const e of sentEvents ?? []) {
    const uid = e.user_id as string | null;
    if (uid && !recoveryByUser.has(uid)) recoveryByUser.set(uid, e.created_at as string);
  }

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

  // Clients qui ont tenté de payer sans jamais aboutir → à relancer.
  const usersById = new Map(users.map((u) => [u.id, u]));
  const recoverable: RecoverablePayment[] = [...revenue.failedByUser.values()]
    .filter((f) => !revenue.paidUserIds.has(f.userId))
    .map((f) => {
      const u = usersById.get(f.userId);
      return {
        userId: f.userId,
        email: u?.email ?? null,
        name: u?.name ?? null,
        amount: f.lastAmount,
        offer: f.lastOffer,
        reason: f.lastReason,
        attempts: f.attempts,
        lastAt: f.lastAt,
        sentAt: recoveryByUser.get(f.userId) ?? null,
      };
    })
    // Plus de tentatives = client le plus motivé → en haut.
    .sort((a, b) => b.attempts - a.attempts || (b.lastAt ?? "").localeCompare(a.lastAt ?? ""));

  return { users, totalRevenue: revenue.total, recoverable };
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
  revenue: number; // CA réel Whop (€) généré par les inscrits venus de ce canal
  paidCount: number; // nombre de clients payants venus de ce canal
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

  const acquisitionBreakdown: ChannelCount[] = ACQUISITION_CHANNELS.map((c) => {
    const fromChannel = users.filter((u) => u.acquisitionChannel === c.id);
    return {
      channel: c.id,
      label: c.label,
      emoji: c.emoji,
      count: fromChannel.length,
      revenue: fromChannel.reduce((s, u) => s + u.revenue, 0),
      paidCount: fromChannel.filter((u) => u.revenue > 0).length,
    };
  })
    .filter((c) => c.count > 0)
    // Le canal qui rapporte le plus d'argent en premier ; à CA égal, le plus gros volume.
    .sort((a, b) => b.revenue - a.revenue || b.count - a.count);
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
