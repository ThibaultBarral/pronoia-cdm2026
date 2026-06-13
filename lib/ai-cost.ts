import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin, getWhopRevenueTotal } from "@/lib/admin";

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
  byDay: CostByDay[]; // last 14 days, oldest → newest
  topConsumers: TopConsumer[];
  // Credit balance estimate
  balanceUsd: number | null; // latest checkpoint reading
  balanceAt: string | null;
  costSinceCheckpointUsd: number;
  remainingUsd: number | null;
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
  topConsumers: [],
  balanceUsd: null,
  balanceAt: null,
  costSinceCheckpointUsd: 0,
  remainingUsd: null,
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

  // Top consumers (by $ cost), resolve emails for the top few only.
  const userMap = new Map<string, { cost: number; count: number }>();
  for (const r of logs) {
    if (!r.user_id) continue;
    const u = userMap.get(r.user_id) ?? { cost: 0, count: 0 };
    u.cost += Number(r.cost_usd);
    u.count += 1;
    userMap.set(r.user_id, u);
  }
  const topIds = [...userMap.entries()]
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 8);

  let topConsumers: TopConsumer[] = [];
  if (topIds.length) {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const byId = new Map((list?.users ?? []).map((u) => [u.id, u]));
    topConsumers = topIds.map(([userId, v]) => {
      const u = byId.get(userId);
      const meta = u?.user_metadata ?? {};
      const name =
        (meta.pseudo as string | undefined) ||
        (meta.full_name as string | undefined) ||
        (meta.name as string | undefined) ||
        null;
      return { userId, email: u?.email ?? null, name, cost: v.cost, count: v.count };
    });
  }

  // Credit balance estimate from the latest checkpoint.
  const balanceUsd = ckRes.data ? Number(ckRes.data.balance_usd) : null;
  const balanceAt = ckRes.data ? (ckRes.data.created_at as string) : null;
  const costSinceCheckpointUsd = balanceAt
    ? logs
        .filter((r) => new Date(r.created_at).getTime() >= new Date(balanceAt).getTime())
        .reduce((s, r) => s + Number(r.cost_usd), 0)
    : 0;
  const remainingUsd = balanceUsd != null ? balanceUsd - costSinceCheckpointUsd : null;
  const daysUntilEmpty =
    remainingUsd != null && dailyBurnUsd > 0 ? Math.floor(remainingUsd / dailyBurnUsd) : null;

  // Profitability — revenue is EUR (Whop), cost converted USD→EUR (approx).
  const totalCostEur = totalCostUsd * EUR_PER_USD;

  return {
    hasData: totalGenerations > 0,
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
    topConsumers: topConsumers.map((c) => ({ ...c, cost: round4(c.cost) })),
    balanceUsd,
    balanceAt,
    costSinceCheckpointUsd: round4(costSinceCheckpointUsd),
    remainingUsd: remainingUsd != null ? round2(remainingUsd) : null,
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
