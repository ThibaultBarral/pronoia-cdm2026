export type BetResult = "won" | "lost" | "void" | "pending";

export type Playstyle = "safe" | "balanced" | "opportunist" | "aggressive";

export interface PlaystyleConfig {
  id: Playstyle;
  label: string;
  tagline: string;
  description: string;
  /** Types/marchés de paris qui collent au profil (= AUDACE, pas montant). */
  betGuidance: string;
  emoji: string;
  stakePercent: number; // % de bankroll recommandé (reste modeste pour tous)
  stakeRange: string;
  color: string;
  accent: string;
}

export const PLAYSTYLES: PlaystyleConfig[] = [
  {
    id: "safe",
    label: "Prudent",
    tagline: "Je joue la sécurité",
    description: "Des paris à forte probabilité, pour gagner souvent même si les gains sont plus petits.",
    betGuidance:
      "Marchés sûrs : double chance, victoire d'un favori net, plus/moins de buts prudent. Évite les paris fantaisie.",
    emoji: "🛡️",
    stakePercent: 2,
    stakeRange: "1-2%",
    color: "#22c55e",
    accent: "#22c55e20",
  },
  {
    id: "balanced",
    label: "Équilibré",
    tagline: "Un bon mélange",
    description: "Un mix de paris sûrs et de bons coups quand l'occasion est claire.",
    betGuidance:
      "Surtout du 1X2 et des value bets raisonnables ; un peu de variété (BTTS, plus/moins) si l'occasion est nette.",
    emoji: "⚖️",
    stakePercent: 2.5,
    stakeRange: "2-3%",
    color: "var(--accent-soft)",
    accent: "color-mix(in srgb, var(--accent-soft) 13%, transparent)",
  },
  {
    id: "opportunist",
    label: "Chercheur de bons coups",
    tagline: "Je traque la valeur",
    description: "Je cible les paris où le bookmaker se trompe, même un peu plus pointus.",
    betGuidance:
      "Paris où la cote semble trop généreuse : BTTS, handicap léger, plus/moins, paris mi-temps. Plus pointu mais réfléchi.",
    emoji: "🎯",
    stakePercent: 3,
    stakeRange: "2-4%",
    color: "#ffd700",
    accent: "#ffd70020",
  },
  {
    id: "aggressive",
    label: "Audacieux",
    tagline: "J'aime le frisson",
    description: "Des paris osés et excitants, qui passent moins souvent mais rapportent gros.",
    betGuidance:
      "Paris OSÉS à forte récompense : score exact, buteur, combinés, outsider qui surprend. C'est l'AUDACE du pari qui change — la mise reste petite.",
    emoji: "🔥",
    stakePercent: 3.5,
    stakeRange: "2-4%",
    color: "#ef4444",
    accent: "#ef444420",
  },
];

export interface Bet {
  id: string;
  date: string;
  match: string;
  competition: string;
  betType: string;
  bookmaker: string;
  odds: number;
  stake: number;
  result: BetResult;
  profit: number;
  note?: string;
  sport?: string;
  isFreebet?: boolean;
}

export const SPORTS = [
  "Football", "Tennis", "Basketball", "Rugby", "Baseball",
  "Hockey", "Handball", "Cyclisme", "MMA", "Boxe", "Autre",
];

export interface BankrollData {
  id?: string;       // Supabase row id
  name?: string;
  startDate?: string;
  initialAmount: number;
  playstyle?: Playstyle;
  bets: Bet[];
}

const STORAGE_KEY = "pronoia_bankroll_v1";

export const BOOKMAKERS = [
  "Winamax", "Unibet", "PMU", "Betclic", "Bwin",
  "Bet365", "Parions Sport", "Autre",
];

export const BET_TYPES = [
  "1 (Victoire domicile)", "N (Match nul)", "2 (Victoire extérieur)",
  "1X", "X2", "Double chance",
  "Over 0.5", "Over 1.5", "Over 2.5", "Over 3.5",
  "Under 0.5", "Under 1.5", "Under 2.5", "Under 3.5",
  "BTTS Oui", "BTTS Non",
  "Buteur", "Mi-temps/Fin de match",
  "Autre",
];

export function calcProfit(stake: number, odds: number, result: BetResult): number {
  if (result === "won") return parseFloat((stake * (odds - 1)).toFixed(2));
  if (result === "lost") return -stake;
  return 0; // void or pending
}

export function loadBankroll(): BankrollData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveBankroll(data: BankrollData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export interface BankrollStats {
  currentAmount: number;
  totalProfit: number;
  roiPercent: number;
  winRate: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  pendingBets: number;
  avgOdds: number;
  avgStake: number;
  totalStaked: number;
  bestStreak: number;
  currentStreak: number;
  biggestWin: number;
  biggestLoss: number;
  equityCurve: number[];
}

export function computeStats(data: BankrollData): BankrollStats {
  const settled = data.bets.filter((b) => b.result === "won" || b.result === "lost");
  const won = settled.filter((b) => b.result === "won");
  const lost = settled.filter((b) => b.result === "lost");
  const pending = data.bets.filter((b) => b.result === "pending");

  const totalProfit = data.bets.reduce((acc, b) => acc + b.profit, 0);
  const totalStaked = settled.reduce((acc, b) => acc + b.stake, 0);
  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
  const winRate = settled.length > 0 ? (won.length / settled.length) * 100 : 0;
  const avgOdds = settled.length > 0
    ? settled.reduce((acc, b) => acc + b.odds, 0) / settled.length
    : 0;
  const avgStake = settled.length > 0
    ? totalStaked / settled.length
    : 0;

  // Streak calculation
  let best = 0, current = 0, streak = 0;
  let lastResult: BetResult | null = null;
  for (const b of [...settled].reverse()) {
    if (b.result === lastResult) streak++;
    else { streak = 1; lastResult = b.result; }
    if (b.result === "won") { current = streak; best = Math.max(best, streak); }
  }

  // Current streak (from most recent)
  let currentStreak = 0;
  if (settled.length > 0) {
    const last = settled[settled.length - 1].result;
    for (let i = settled.length - 1; i >= 0; i--) {
      if (settled[i].result === last) currentStreak++;
      else break;
    }
    if (last === "lost") currentStreak = -currentStreak;
  }

  // Equity curve: bankroll after each settled bet
  const equityCurve = [data.initialAmount];
  let running = data.initialAmount;
  for (const b of data.bets) {
    running += b.profit;
    equityCurve.push(parseFloat(running.toFixed(2)));
  }

  const profits = won.map((b) => b.profit);
  const losses = lost.map((b) => Math.abs(b.profit));

  return {
    currentAmount: parseFloat((data.initialAmount + totalProfit).toFixed(2)),
    totalProfit: parseFloat(totalProfit.toFixed(2)),
    roiPercent: parseFloat(roi.toFixed(1)),
    winRate: parseFloat(winRate.toFixed(1)),
    totalBets: settled.length,
    wonBets: won.length,
    lostBets: lost.length,
    pendingBets: pending.length,
    avgOdds: parseFloat(avgOdds.toFixed(2)),
    avgStake: parseFloat(avgStake.toFixed(2)),
    totalStaked: parseFloat(totalStaked.toFixed(2)),
    bestStreak: best,
    currentStreak,
    biggestWin: profits.length ? Math.max(...profits) : 0,
    biggestLoss: losses.length ? Math.max(...losses) : 0,
    equityCurve,
  };
}
