import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Plan } from "@/lib/plans";

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
  vip: boolean; // accès gratuit offert (admin), indépendant des plans payants
  revenue: number; // CA réel Whop (€), payé − remboursé
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

/** All users + subscription/usage stats + real Whop revenue. Admin only. */
export async function getAdminData(): Promise<{ users: AdminUserRow[]; totalRevenue: number }> {
  if (!(await isAdmin())) return { users: [], totalRevenue: 0 };

  const admin = createAdminClient();

  const [{ data: list }, { data: subs }, revenue] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("subscriptions").select("user_id, plan, status, analyses_count, free_analyses_used, whop_membership_id, vip"),
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
        vip: Boolean(s?.vip),
        revenue: membershipId ? revenue.byMembership.get(membershipId) ?? 0 : 0,
      };
    })
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return { users, totalRevenue: revenue.total };
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
