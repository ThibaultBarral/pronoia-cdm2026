import { createClient } from "./client";
import type { BankrollData, Bet, BetResult, Playstyle } from "@/lib/bankroll";

// ── Load ──────────────────────────────────────────────────────────────────────

export async function loadUserBankroll(): Promise<BankrollData | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: bankroll } = await supabase
    .from("bankrolls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!bankroll) return null;

  const { data: bets } = await supabase
    .from("bets")
    .select("*")
    .eq("bankroll_id", bankroll.id)
    .order("created_at", { ascending: true });

  return {
    id: bankroll.id,
    name: bankroll.name,
    startDate: bankroll.start_date,
    initialAmount: bankroll.initial_amount,
    playstyle: (bankroll.playstyle as Playstyle) ?? undefined,
    bets: (bets ?? []).map(rowToBet),
  };
}

// ── Save (upsert full state) ───────────────────────────────────────────────────

export async function saveUserBankroll(data: BankrollData): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: bankroll, error } = await supabase
    .from("bankrolls")
    .upsert({
      ...(data.id ? { id: data.id } : {}),
      user_id: user.id,
      name: data.name ?? "Ma bankroll",
      initial_amount: data.initialAmount,
      start_date: data.startDate ?? new Date().toISOString().split("T")[0],
      ...(data.playstyle !== undefined ? { playstyle: data.playstyle } : {}),
    })
    .select("id")
    .single();

  if (error || !bankroll) return null;
  const bankrollId = bankroll.id as string;

  // Sync bets
  const { data: existing } = await supabase
    .from("bets")
    .select("id")
    .eq("bankroll_id", bankrollId);

  const existingIds = new Set((existing ?? []).map((b) => b.id as string));
  const newIds = new Set(data.bets.map((b) => b.id));

  const toDelete = [...existingIds].filter((id) => !newIds.has(id));
  if (toDelete.length) await supabase.from("bets").delete().in("id", toDelete);

  if (data.bets.length) {
    await supabase.from("bets").upsert(
      data.bets.map((b) => betToRow(b, bankrollId, user.id))
    );
  }

  return bankrollId;
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteUserBankroll(bankrollId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("bankrolls").delete().eq("id", bankrollId);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function rowToBet(row: Record<string, unknown>): Bet {
  return {
    id: row.id as string,
    date: row.date as string,
    match: row.match as string,
    competition: (row.competition as string) ?? "",
    betType: (row.bet_type as string) ?? "",
    bookmaker: (row.bookmaker as string) ?? "",
    odds: row.odds as number,
    stake: row.stake as number,
    result: row.result as BetResult,
    profit: row.profit as number,
    note: row.note as string | undefined,
    sport: row.sport as string | undefined,
    isFreebet: (row.is_freebet as boolean) ?? false,
  };
}

function betToRow(b: Bet, bankrollId: string, userId: string) {
  return {
    id: b.id,
    bankroll_id: bankrollId,
    user_id: userId,
    date: b.date,
    match: b.match,
    competition: b.competition,
    bet_type: b.betType,
    bookmaker: b.bookmaker,
    odds: b.odds,
    stake: b.stake,
    result: b.result,
    profit: b.profit,
    note: b.note ?? null,
    sport: b.sport ?? null,
    is_freebet: b.isFreebet ?? false,
  };
}
