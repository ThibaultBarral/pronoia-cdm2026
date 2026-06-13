import "server-only";

/**
 * Real billed cost from Anthropic's Admin Cost API (the official $ figure, not
 * our token estimate). Requires an Admin API key (`sk-ant-admin...`), set as
 * ANTHROPIC_ADMIN_KEY. Org-level — since this app uses a dedicated Anthropic
 * org/key, org cost ≈ app cost.
 *
 * There is NO "remaining credit balance" endpoint: the Cost API reports spend,
 * not balance. Remaining is derived as (balance checkpoint − real spend since).
 */

export interface RealCost {
  available: boolean; // false when no admin key or the call failed
  totalUsd: number;
  byModel: { model: string; cost: number }[];
  byDay: { date: string; cost: number }[]; // ascending by date
}

const UNAVAILABLE: RealCost = { available: false, totalUsd: 0, byModel: [], byDay: [] };

interface CostResult {
  amount: string; // cost in CENTS as a decimal string ("123.45" => $1.2345)
  model: string | null;
}
interface CostBucket {
  starting_at: string;
  ending_at: string;
  results: CostResult[];
}
interface CostReport {
  data: CostBucket[];
  has_more: boolean;
  next_page: string | null;
}

const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** Is the real-cost integration configured? */
export function hasAnthropicAdminKey(): boolean {
  return Boolean(process.env.ANTHROPIC_ADMIN_KEY);
}

/**
 * Real billed USD cost for [startISO, endISO), grouped by description so we get
 * a per-model and per-day breakdown. Best-effort: returns `available:false` on
 * any failure (missing key, non-200, network), never throws.
 */
export async function getAnthropicCost(startISO: string, endISO: string): Promise<RealCost> {
  const key = process.env.ANTHROPIC_ADMIN_KEY;
  if (!key) return UNAVAILABLE;

  const byModel = new Map<string, number>();
  const byDay = new Map<string, number>();
  let total = 0;
  let page: string | null = null;

  try {
    for (let i = 0; i < 12; i++) {
      const url = new URL("https://api.anthropic.com/v1/organizations/cost_report");
      url.searchParams.set("starting_at", startISO);
      url.searchParams.set("ending_at", endISO);
      url.searchParams.set("bucket_width", "1d");
      url.searchParams.append("group_by[]", "description");
      url.searchParams.set("limit", "31");
      if (page) url.searchParams.set("page", page);

      const res = await fetch(url, {
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
        cache: "no-store",
      });
      if (!res.ok) {
        console.error("[anthropic-admin] cost_report", res.status, await res.text().catch(() => ""));
        return UNAVAILABLE;
      }
      const json = (await res.json()) as CostReport;
      for (const bucket of json.data ?? []) {
        const day = bucket.starting_at.slice(0, 10);
        for (const r of bucket.results ?? []) {
          const usd = Number(r.amount) / 100; // amount is in cents
          if (!Number.isFinite(usd)) continue;
          total += usd;
          byDay.set(day, (byDay.get(day) ?? 0) + usd);
          const m = r.model ?? "autre";
          byModel.set(m, (byModel.get(m) ?? 0) + usd);
        }
      }
      if (!json.has_more || !json.next_page) break;
      page = json.next_page;
    }
  } catch (err) {
    console.error("[anthropic-admin] cost fetch failed:", err);
    return UNAVAILABLE;
  }

  return {
    available: true,
    totalUsd: round4(total),
    byModel: [...byModel.entries()]
      .map(([model, cost]) => ({ model, cost: round4(cost) }))
      .sort((a, b) => b.cost - a.cost),
    byDay: [...byDay.entries()]
      .map(([date, cost]) => ({ date, cost: round4(cost) }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}
