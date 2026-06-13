import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin, getWhopRevenueTotal } from "@/lib/admin";
import { getAnthropicCost } from "@/lib/anthropic-admin";

/** Anthropic token usage as returned on `message.usage`. */
export interface ClaudeUsage {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

export type AiKind = "match" | "team" | "chat" | "bets";

const KIND_LABEL: Record<AiKind, string> = {
  match: "Analyse de match",
  team: "Analyse d'équipe",
  chat: "Chat IA (match)",
  bets: "Lecture de tickets",
};

/**
 * Per-1M-token USD prices. Sonnet 4.5 and 4.6 share the same tier ($3 in /
 * $15 out); cache write = 1.25× input (5-min ephemeral), cache read = 0.1×
 * input. Source: claude-api skill pricing table + prompt-caching economics.
 */
interface ModelPrice { input: number; output: number; cacheWrite: number; cacheRead: number }
const PRICES: Record<string, ModelPrice> = {
  "claude-sonnet-4-5": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-sonnet-4-6": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-opus-4-8": { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.5 },
  "claude-haiku-4-5": { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 },
};
const DEFAULT_PRICE: ModelPrice = PRICES["claude-sonnet-4-5"];

function priceFor(model: string): ModelPrice {
  return PRICES[model] ?? DEFAULT_PRICE;
}

/** USD cost of one Claude call from its token usage. */
export function computeCostUsd(usage: ClaudeUsage, model: string): number {
  const p = priceFor(model);
  const inp = usage.input_tokens ?? 0;
  const out = usage.output_tokens ?? 0;
  const cw = usage.cache_creation_input_tokens ?? 0;
  const cr = usage.cache_read_input_tokens ?? 0;
  return (inp * p.input + out * p.output + cw * p.cacheWrite + cr * p.cacheRead) / 1_000_000;
}

/** Approximate EUR per USD — display-only, for the profitability view. */
export const EUR_PER_USD = 0.92;

/**
 * Record one real Claude generation's token usage + computed $ cost.
 * Best-effort: never throws (a logging failure must not break an analysis).
 * Called on a cache MISS only, so it reflects true generation cost.
 */
export async function logAiUsage(opts: {
  kind: AiKind;
  model: string;
  usage: ClaudeUsage;
  userId?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("ai_cost_log").insert({
      kind: opts.kind,
      model: opts.model,
      input_tokens: opts.usage.input_tokens ?? 0,
      output_tokens: opts.usage.output_tokens ?? 0,
      cache_creation_tokens: opts.usage.cache_creation_input_tokens ?? 0,
      cache_read_tokens: opts.usage.cache_read_input_tokens ?? 0,
      cost_usd: Math.round(computeCostUsd(opts.usage, opts.model) * 1e6) / 1e6,
      user_id: opts.userId ?? null,
    });
  } catch (err) {
    console.error("[ai-cost] logAiUsage failed:", err);
  }
}

// ─── Dashboard aggregation (admin only) ────────────────────────────────────

export interface CostByKind { kind: string; label: string; cost: number; count: number }
export interface CostByDay { date: string; cost: number }
export interface CostByModel { model: string; cost: number; count: number }
export interface TopConsumer { userId: string; email: string | null; name: string | null; cost: number; count: number }
export interface ActivityRow {
  at: string;
  kind: string;
  label: string;
  who: string | null; // email / pseudo, or null when unattributed
  costUsd: number;
}

export interface CostDashboard {
  hasData: boolean;
  // Volume
  totalGenerations: number;
  totalTokens: number;
  // Cost (USD)
  totalCostUsd: number;
  costTodayUsd: number;
  cost7dUsd: number;
  cost30dUsd: number;
  avgCostPerGenUsd: number;
  dailyBurnUsd: number; // mean daily spend over the last 7 days
  projectedMonthlyUsd: number;
  // Breakdowns
  byKind: CostByKind[];
  byModel: CostByModel[];
  byDay: CostByDay[]; // last 14 days, oldest → newest (estimate)
  chart14d: CostByDay[]; // last 14 days for the chart — real if available, else estimate
  topConsumers: TopConsumer[];
  recentActivity: ActivityRow[]; // last ~25 generations (who / what / when / cost)
  // Real billed cost from Anthropic's Admin API (the official $, not estimated)
  realAvailable: boolean;
  realCost7dUsd: number;
  realCost30dUsd: number;
  realCostSinceCheckpointUsd: number;
  realByDay: CostByDay[]; // since the window start, ascending
  realByModel: CostByModel[];
  // Credit balance estimate
  balanceUsd: number | null; // latest checkpoint reading
  balanceAt: string | null;
  costSinceCheckpointUsd: number; // our estimate (fallback when real unavailable)
  remainingUsd: number | null; // balance − (real if available else estimate) since checkpoint
  remainingBasis: "réel" | "estimé" | null;
  daysUntilEmpty: number | null;
  // Profitability (revenue from Whop is in EUR; cost converted approximately)
  revenueEur: number;
  totalCostEur: number;
  marginEur: number;
}

interface LogRow {
  created_at: string;
  kind: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  cost_usd: number;
  user_id: string | null;
}

const EMPTY: CostDashboard = {
  hasData: false,
  totalGenerations: 0,
  totalTokens: 0,
  totalCostUsd: 0,
  costTodayUsd: 0,
  cost7dUsd: 0,
  cost30dUsd: 0,
  avgCostPerGenUsd: 0,
  dailyBurnUsd: 0,
  projectedMonthlyUsd: 0,
  byKind: [],
  byModel: [],
  byDay: [],
  chart14d: [],
  topConsumers: [],
  recentActivity: [],
  realAvailable: false,
  realCost7dUsd: 0,
  realCost30dUsd: 0,
  realCostSinceCheckpointUsd: 0,
  realByDay: [],
  realByModel: [],
  balanceUsd: null,
  balanceAt: null,
  costSinceCheckpointUsd: 0,
  remainingUsd: null,
  remainingBasis: null,
  daysUntilEmpty: null,
  revenueEur: 0,
  totalCostEur: 0,
  marginEur: 0,
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** All cost metrics + Whop revenue for the /admin/couts dashboard. Admin only. */
export async function getCostDashboard(): Promise<CostDashboard> {
  if (!(await isAdmin())) return EMPTY;

  const admin = createAdminClient();
  const [logsRes, ckRes, revenueEur] = await Promise.all([
    admin
      .from("ai_cost_log")
      .select(
        "created_at, kind, model, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, cost_usd, user_id",
      )
      .order("created_at", { ascending: false })
      .limit(100000),
    admin
      .from("ai_credit_checkpoint")
      .select("balance_usd, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getWhopRevenueTotal().catch(() => 0),
  ]);

  const logs = (logsRes.data ?? []) as unknown as LogRow[];
  const now = Date.now();
  const DAY = 86_400_000;

  const totalCostUsd = logs.reduce((s, r) => s + Number(r.cost_usd), 0);
  const totalGenerations = logs.length;
  const totalTokens = logs.reduce(
    (s, r) =>
      s + r.input_tokens + r.output_tokens + r.cache_creation_tokens + r.cache_read_tokens,
    0,
  );

  const todayKey = new Date(now).toISOString().slice(0, 10);
  const costInWindow = (days: number) =>
    logs
      .filter((r) => now - new Date(r.created_at).getTime() < days * DAY)
      .reduce((s, r) => s + Number(r.cost_usd), 0);

  const costTodayUsd = logs
    .filter((r) => r.created_at.slice(0, 10) === todayKey)
    .reduce((s, r) => s + Number(r.cost_usd), 0);
  const cost7dUsd = costInWindow(7);
  const cost30dUsd = costInWindow(30);

  // Cost per kind.
  const kindOrder: AiKind[] = ["match", "team", "chat", "bets"];
  const byKind: CostByKind[] = kindOrder
    .map((k) => {
      const rows = logs.filter((r) => r.kind === k);
      return {
        kind: k,
        label: KIND_LABEL[k],
        cost: rows.reduce((s, r) => s + Number(r.cost_usd), 0),
        count: rows.length,
      };
    })
    .filter((x) => x.count > 0)
    .sort((a, b) => b.cost - a.cost);

  // Cost per model.
  const modelMap = new Map<string, { cost: number; count: number }>();
  for (const r of logs) {
    const m = modelMap.get(r.model) ?? { cost: 0, count: 0 };
    m.cost += Number(r.cost_usd);
    m.count += 1;
    modelMap.set(r.model, m);
  }
  const byModel: CostByModel[] = [...modelMap.entries()]
    .map(([model, v]) => ({ model, cost: v.cost, count: v.count }))
    .sort((a, b) => b.cost - a.cost);

  // Cost per day, last 14 calendar days (UTC), oldest → newest.
  const byDay: CostByDay[] = [];
  for (let i = 13; i >= 0; i--) {
    const key = new Date(now - i * DAY).toISOString().slice(0, 10);
    const cost = logs
      .filter((r) => r.created_at.slice(0, 10) === key)
      .reduce((s, r) => s + Number(r.cost_usd), 0);
    byDay.push({ date: key, cost: round4(cost) });
  }

  // Burn rate = mean daily spend over the last 7 days (logged).
  const dailyBurnUsd = cost7dUsd / 7;
  const projectedMonthlyUsd = dailyBurnUsd * 30;

  // Cost + request count per user (for "who consumes credits").
  const userMap = new Map<string, { cost: number; count: number }>();
  for (const r of logs) {
    if (!r.user_id) continue;
    const u = userMap.get(r.user_id) ?? { cost: 0, count: 0 };
    u.cost += Number(r.cost_usd);
    u.count += 1;
    userMap.set(r.user_id, u);
  }
  const topIds = [...userMap.entries()].sort((a, b) => b[1].cost - a[1].cost).slice(0, 8);

  // Latest checkpoint (real balance reading), used to anchor the estimate.
  const balanceUsd = ckRes.data ? Number(ckRes.data.balance_usd) : null;
  const balanceAt = ckRes.data ? (ckRes.data.created_at as string) : null;

  // Real billed cost from Anthropic's Admin API, over a window covering both the
  // checkpoint and the last 30 days (whichever starts earlier).
  const windowStartMs = Math.min(
    now - 31 * DAY,
    balanceAt ? new Date(balanceAt).getTime() : now,
  );
  const real = await getAnthropicCost(new Date(windowStartMs).toISOString(), new Date(now).toISOString());

  const realInWindow = (days: number) =>
    real.byDay
      .filter((d) => now - new Date(d.date + "T00:00:00Z").getTime() < days * DAY)
      .reduce((s, d) => s + d.cost, 0);
  const realCost7dUsd = real.available ? realInWindow(7) : 0;
  const realCost30dUsd = real.available ? realInWindow(30) : 0;
  const realCostSinceCheckpointUsd =
    real.available && balanceAt
      ? real.byDay
          .filter((d) => d.date >= balanceAt.slice(0, 10))
          .reduce((s, d) => s + d.cost, 0)
      : 0;

  // Resolve emails for the top consumers + the recent-activity feed in one call.
  const recentRows = logs.slice(0, 25);
  const idsToResolve = new Set<string>([
    ...topIds.map(([id]) => id),
    ...recentRows.map((r) => r.user_id).filter((x): x is string => Boolean(x)),
  ]);
  const byId = new Map<string, { email: string | null; name: string | null }>();
  if (idsToResolve.size) {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of list?.users ?? []) {
      const meta = u.user_metadata ?? {};
      const name =
        (meta.pseudo as string | undefined) ||
        (meta.full_name as string | undefined) ||
        (meta.name as string | undefined) ||
        null;
      byId.set(u.id, { email: u.email ?? null, name });
    }
  }
  const who = (id: string | null): string | null => {
    if (!id) return null;
    const u = byId.get(id);
    return u ? u.name || u.email || id.slice(0, 8) : id.slice(0, 8);
  };

  const topConsumers: TopConsumer[] = topIds.map(([userId, v]) => {
    const u = byId.get(userId);
    return { userId, email: u?.email ?? null, name: u?.name ?? null, cost: round4(v.cost), count: v.count };
  });

  const recentActivity: ActivityRow[] = recentRows.map((r) => ({
    at: r.created_at,
    kind: r.kind,
    label: KIND_LABEL[r.kind as AiKind] ?? r.kind,
    who: who(r.user_id),
    costUsd: round4(Number(r.cost_usd)),
  }));

  // Remaining credit: balance − real spend since checkpoint (fallback to our
  // token estimate when the Admin API isn't configured).
  const costSinceCheckpointUsd = balanceAt
    ? logs
        .filter((r) => new Date(r.created_at).getTime() >= new Date(balanceAt).getTime())
        .reduce((s, r) => s + Number(r.cost_usd), 0)
    : 0;
  const spentSince = real.available ? realCostSinceCheckpointUsd : costSinceCheckpointUsd;
  const remainingUsd = balanceUsd != null ? balanceUsd - spentSince : null;
  const remainingBasis: "réel" | "estimé" | null =
    balanceUsd == null ? null : real.available ? "réel" : "estimé";
  // Burn rate prefers the real 7-day spend when available.
  const burnUsd = real.available ? realCost7dUsd / 7 : dailyBurnUsd;
  const daysUntilEmpty =
    remainingUsd != null && burnUsd > 0 ? Math.floor(remainingUsd / burnUsd) : null;

  // 14-day chart series — real daily cost when available, else our estimate.
  const realDayMap = new Map(real.byDay.map((x) => [x.date, x.cost]));
  const estDayMap = new Map(byDay.map((x) => [x.date, x.cost]));
  const chart14d: CostByDay[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now - i * DAY).toISOString().slice(0, 10);
    const cost = real.available ? realDayMap.get(date) ?? 0 : estDayMap.get(date) ?? 0;
    chart14d.push({ date, cost: round4(cost) });
  }

  // Profitability — revenue is EUR (Whop); cost prefers real, converted USD→EUR.
  const costBasisUsd = real.available ? real.totalUsd : totalCostUsd;
  const totalCostEur = costBasisUsd * EUR_PER_USD;

  return {
    hasData: totalGenerations > 0 || real.available,
    totalGenerations,
    totalTokens,
    totalCostUsd: round4(totalCostUsd),
    costTodayUsd: round4(costTodayUsd),
    cost7dUsd: round4(cost7dUsd),
    cost30dUsd: round4(cost30dUsd),
    avgCostPerGenUsd: totalGenerations ? round4(totalCostUsd / totalGenerations) : 0,
    dailyBurnUsd: round4(dailyBurnUsd),
    projectedMonthlyUsd: round2(projectedMonthlyUsd),
    byKind: byKind.map((k) => ({ ...k, cost: round4(k.cost) })),
    byModel: byModel.map((m) => ({ ...m, cost: round4(m.cost) })),
    byDay,
    chart14d,
    topConsumers,
    recentActivity,
    realAvailable: real.available,
    realCost7dUsd: round4(realCost7dUsd),
    realCost30dUsd: round4(realCost30dUsd),
    realCostSinceCheckpointUsd: round4(realCostSinceCheckpointUsd),
    realByDay: real.byDay,
    realByModel: real.byModel.map((m) => ({ model: m.model, cost: m.cost, count: 0 })),
    balanceUsd,
    balanceAt,
    costSinceCheckpointUsd: round4(costSinceCheckpointUsd),
    remainingUsd: remainingUsd != null ? round2(remainingUsd) : null,
    remainingBasis,
    daysUntilEmpty,
    revenueEur: round2(revenueEur),
    totalCostEur: round2(totalCostEur),
    marginEur: round2(revenueEur - totalCostEur),
  };
}

/** Record a real credit-balance reading from console.anthropic.com. Admin only. */
export async function recordCreditCheckpoint(
  balanceUsd: number,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Non autorisé." };
  if (!Number.isFinite(balanceUsd) || balanceUsd < 0) {
    return { ok: false, error: "Montant invalide." };
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("ai_credit_checkpoint")
    .insert({ balance_usd: balanceUsd, note: note?.trim() || null });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
