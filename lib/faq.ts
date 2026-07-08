/** FAQ — shared by the visible accordion (components/faq-section) and the
 *  FAQPage JSON-LD on the landing. Keep answers honest and concrete. */
import type { Locale } from "@/lib/i18n/config";

export interface FaqItem {
  q: string;
  a: string;
}

const FAQ_FR: FaqItem[] = [
  {
    q: "C'est quoi Copafever, en une phrase ?",
    a: "Copafever est un assistant foot propulsé par l'IA : pour chaque match, il croise la forme récente, les stats réelles, les compositions et les cotes du marché pour t'expliquer le match en clair — favori, scénario probable, buteurs et joueurs à suivre.",
  },
  {
    q: "Comment ça marche concrètement ?",
    a: "Tu crées un compte, tu choisis un match, tu cliques sur « Analyser ». En quelques secondes tu obtiens : un résumé du match, les probabilités, les buts attendus (xG), les forces et faiblesses des deux équipes, et les buteurs probables. Simple, sans jargon.",
  },
  {
    q: "Qu'est-ce qu'une value du jour ?",
    a: "Une value est un pari dont la probabilité réelle estimée par notre modèle est supérieure à celle qu'impliquent les cotes du bookmaker : le bookmaker sous-évalue une issue. L'onglet « Values du jour » les repère automatiquement sur les prochains matchs, cotes réelles à l'appui.",
  },
  {
    q: "Les données sont-elles réelles ?",
    a: "Oui, à 100 %. Copafever s'appuie sur des données sportives réelles : forme des équipes, confrontations directes, effectifs, statistiques et cotes en direct. Aucune analyse ne repose sur des chiffres inventés. Quand une donnée manque, on le dit honnêtement plutôt que de combler le vide.",
  },
  {
    q: "Combien ça coûte ?",
    a: "Copafever propose trois offres, sans palier gratuit : Mini à 2,99 €/mois (5 analyses par mois), Pro à 9,99 €/mois ou 59,99 €/an (analyses illimitées, values du jour, bankroll, chat IA), et l'Accès à vie à 79 € en paiement unique.",
  },
  {
    q: "Quelle est la différence entre les offres ?",
    a: "Mini (2,99 €/mois) donne 5 analyses IA complètes par mois. Pro (9,99 €/mois ou 59,99 €/an) donne tout en illimité : analyses, values du jour, buteurs probables et joueurs clés, chat IA contextuel et suivi de bankroll. L'Accès à vie, c'est tout Pro pour toujours, en un seul paiement.",
  },
  {
    q: "Et après la Coupe du Monde 2026 ?",
    a: "Copafever continue sur toute la saison 2026/27 : Ligue 1, Premier League, Liga, Serie A, Bundesliga, Ligue des Champions et Ligue Europa — plus de 2 100 matchs analysables. Les offres Mini, Pro et Accès à vie couvrent ces compétitions.",
  },
  {
    q: "Puis-je suivre mes paris et ma bankroll ?",
    a: "Oui, avec Pro ou l'Accès à vie. Copafever intègre un suivi de bankroll complet : tu enregistres tes paris, tu vois ton ROI, ton taux de réussite, ta courbe de gains et tes séries.",
  },
  {
    q: "Le paiement est-il sécurisé ? Puis-je résilier ?",
    a: "Le paiement est géré par Whop, une plateforme sécurisée — aucune donnée bancaire n'est stockée par Copafever. Les abonnements Mini et Pro sont sans engagement, résiliables à tout moment en un clic. L'Accès à vie est un paiement unique, sans reconduction.",
  },
  {
    q: "Est-ce légal et responsable ?",
    a: "Copafever est un outil d'aide à la décision : les analyses sont fournies à titre informatif uniquement et ne garantissent aucun gain. Les paris sportifs comportent des risques. Le service est réservé aux personnes de 18 ans et plus. Mise toujours de petites sommes, pour le plaisir, et joue responsable.",
  },
];

const FAQ_EN: FaqItem[] = [
  {
    q: "What is Copafever, in one sentence?",
    a: "Copafever is an AI-powered football assistant: for every match, it combines recent form, real stats, lineups and market odds to explain the game in plain language — favorite, likely scenario, probable scorers and players to watch.",
  },
  {
    q: "How does it actually work?",
    a: "You create an account, pick a match, and click \"Analyze\". In seconds you get: a match summary, the probabilities, expected goals (xG), each team's strengths and weaknesses, and probable scorers. Simple, no jargon.",
  },
  {
    q: "What is a daily value?",
    a: "A value is a bet whose true probability, estimated by our model, is higher than the one implied by the bookmaker's odds: the bookmaker underrates an outcome. The \"Values of the day\" tab spots them automatically on upcoming matches, backed by real odds.",
  },
  {
    q: "Is the data real?",
    a: "Yes, 100%. Copafever relies on real sports data: team form, head-to-head records, squads, statistics and live odds. No analysis is based on made-up numbers. When a data point is missing, we say so honestly rather than filling the gap.",
  },
  {
    q: "How much does it cost?",
    a: "Copafever has three offers, no free tier: Mini at €2.99/month (5 analyses per month), Pro at €9.99/month or €59.99/year (unlimited analyses, daily values, bankroll, AI chat), and one-time Lifetime access at €79.",
  },
  {
    q: "What's the difference between the plans?",
    a: "Mini (€2.99/month) gives 5 full AI analyses per month. Pro (€9.99/month or €59.99/year) gives everything unlimited: analyses, daily values, probable scorers and key players, contextual AI chat and bankroll tracking. Lifetime is all of Pro forever, in one payment.",
  },
  {
    q: "And after the 2026 World Cup?",
    a: "Copafever continues through the whole 2026/27 season: Ligue 1, Premier League, La Liga, Serie A, Bundesliga, Champions League and Europa League — over 2,100 analyzable matches. Mini, Pro and Lifetime cover these competitions.",
  },
  {
    q: "Can I track my bets and bankroll?",
    a: "Yes, with Pro or Lifetime. Copafever includes full bankroll tracking: you log your bets and see your ROI, win rate, profit curve and streaks.",
  },
  {
    q: "Is payment secure? Can I cancel?",
    a: "Payment is handled by Whop, a secure platform — no banking details are stored by Copafever. Mini and Pro subscriptions are commitment-free, cancellable anytime in one click. Lifetime is a one-time payment, with no renewal.",
  },
  {
    q: "Is it legal and responsible?",
    a: "Copafever is a decision-support tool: the analyses are provided for informational purposes only and guarantee no winnings. Sports betting carries risk. The service is for people aged 18 and over. Always stake small amounts, for fun, and play responsibly.",
  },
];

export function getFaq(locale: Locale): FaqItem[] {
  return locale === "en" ? FAQ_EN : FAQ_FR;
}

/** Back-compat default export (French) for any non-localized consumer. */
export const FAQ = FAQ_FR;
