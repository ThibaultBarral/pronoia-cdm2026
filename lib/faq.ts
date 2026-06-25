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
    a: "Copafever est un assistant de paris propulsé par l'IA : pour chaque match, il croise la forme récente, les stats réelles, les compositions et les cotes du marché pour t'expliquer le match en clair et te proposer un pari à valeur, avec un niveau de confiance et une mise adaptée à ta bankroll.",
  },
  {
    q: "Comment ça marche concrètement ?",
    a: "Tu crées un compte gratuit, tu choisis un match, tu lances l'analyse. En quelques secondes tu obtiens : un résumé du match, les forces et faiblesses des deux équipes, les probabilités, les value bets détectés et une recommandation de pari claire (Faible / Moyen / Élevé) avec une mise conseillée. Tu gardes la main : Copafever conseille, tu décides.",
  },
  {
    q: "Qu'est-ce qu'un value bet ?",
    a: "Un value bet est un pari dont la probabilité réelle estimée est supérieure à celle qu'impliquent les cotes du bookmaker : le bookmaker sous-évalue une issue. Sur le long terme, miser sur ces écarts est statistiquement plus rentable. Copafever les repère automatiquement sur chaque match.",
  },
  {
    q: "Les données sont-elles réelles ?",
    a: "Oui, à 100 %. Copafever s'appuie sur des données sportives réelles : forme des équipes, confrontations directes, effectifs, statistiques et cotes en direct. Aucune analyse ne repose sur des chiffres inventés. Quand une donnée manque, on le dit honnêtement plutôt que de combler le vide.",
  },
  {
    q: "Combien ça coûte ?",
    a: "L'inscription est gratuite et te donne une première analyse offerte, plus un aperçu de chaque match (le verdict du modèle : favori, probabilités, buts attendus). L'analyse IA complète est réservée aux abonnés : Essential à 9,99 €/mois (analyses illimitées + l'analyse complète de chaque match), Premium à 14,99 €/mois (en plus toute la boîte à outils paris), ou Accès à vie en paiement unique. L'Accès à vie est à 89 € en tarif de lancement jusqu'au 19 juillet, puis 129 €.",
  },
  {
    q: "Quelle est la différence entre les offres ?",
    a: "Essential (9,99 €/mois) donne les analyses IA illimitées et l'analyse complète de chaque match (résumé, scénario, probabilités, xG, forces & faiblesses). Premium (14,99 €/mois) ajoute toute la boîte à outils paris : value bets et cotes en direct, buteurs probables et joueurs clés, chat IA contextuel, simulateur de parcours, bracket interactif et suivi de bankroll. L'Accès à vie, c'est tout Premium pour toujours, sans abonnement, plus le badge membre fondateur.",
  },
  {
    q: "Et après la Coupe du Monde 2026 ?",
    a: "Copafever continue sur toute la saison 2026/27 : Ligue 1, Premier League, Liga, Serie A, Bundesliga, Ligue des Champions et Ligue Europa — plus de 2 100 matchs analysables. Les abonnements continuent sur ces compétitions, et l'Accès à vie les couvre toutes, à vie.",
  },
  {
    q: "Puis-je suivre mes paris et ma bankroll ?",
    a: "Oui. Copafever intègre un suivi de bankroll complet : tu enregistres tes paris, tu vois ton ROI, ton taux de réussite, ta courbe de gains et tes séries. Tu peux aussi choisir ton style de pari (prudent à audacieux) pour que les recommandations et les mises s'adaptent à toi.",
  },
  {
    q: "Le paiement est-il sécurisé ? Puis-je résilier ?",
    a: "Le paiement est géré par Whop, une plateforme sécurisée — aucune donnée bancaire n'est stockée par Copafever. Les abonnements Essential et Premium sont sans engagement, résiliables à tout moment en un clic. L'Accès à vie est un paiement unique, sans reconduction.",
  },
  {
    q: "Est-ce légal et responsable ?",
    a: "Copafever est un outil d'aide à la décision : les analyses sont fournies à titre informatif uniquement et ne garantissent aucun gain. Les paris sportifs comportent des risques. Le service est réservé aux personnes de 18 ans et plus. Mise toujours de petites sommes, pour le plaisir, et joue responsable.",
  },
];

const FAQ_EN: FaqItem[] = [
  {
    q: "What is Copafever, in one sentence?",
    a: "Copafever is an AI-powered betting assistant: for every match, it combines recent form, real stats, lineups and market odds to explain the game in plain language and suggest a value bet, with a confidence level and a stake sized to your bankroll.",
  },
  {
    q: "How does it actually work?",
    a: "You create a free account, pick a match and run the analysis. In seconds you get: a match summary, each team's strengths and weaknesses, the probabilities, the value bets detected and a clear betting recommendation (Low / Medium / High) with a suggested stake. You stay in control: Copafever advises, you decide.",
  },
  {
    q: "What is a value bet?",
    a: "A value bet is a bet whose estimated true probability is higher than the one implied by the bookmaker's odds: the bookmaker underrates an outcome. Over the long run, backing these edges is statistically more profitable. Copafever spots them automatically on every match.",
  },
  {
    q: "Is the data real?",
    a: "Yes, 100%. Copafever relies on real sports data: team form, head-to-head records, squads, statistics and live odds. No analysis is based on made-up numbers. When a data point is missing, we say so honestly rather than filling the gap.",
  },
  {
    q: "How much does it cost?",
    a: "Signing up is free and gives you one free analysis, plus a preview of every match (the model's verdict: favorite, probabilities, expected goals). The full AI analysis is for subscribers: Essential at €9.99/month (unlimited analyses + the full analysis of every match), Premium at €14.99/month (plus the whole betting toolkit), or one-time Lifetime access. Lifetime is €89 as a launch price until July 19, then €129.",
  },
  {
    q: "What's the difference between the plans?",
    a: "Essential (€9.99/month) gives unlimited AI analyses and the full analysis of every match (summary, scenario, probabilities, xG, strengths & weaknesses). Premium (€14.99/month) adds the whole betting toolkit: value bets and live odds, probable scorers and key players, contextual AI chat, run simulator, interactive bracket and bankroll tracking. Lifetime is all of Premium forever, with no subscription, plus the founder badge.",
  },
  {
    q: "And after the 2026 World Cup?",
    a: "Copafever continues through the whole 2026/27 season: Ligue 1, Premier League, La Liga, Serie A, Bundesliga, Champions League and Europa League — over 2,100 analyzable matches. Subscriptions carry on across these competitions, and Lifetime covers them all, for life.",
  },
  {
    q: "Can I track my bets and bankroll?",
    a: "Yes. Copafever includes full bankroll tracking: you log your bets and see your ROI, win rate, profit curve and streaks. You can also pick your betting style (cautious to bold) so the recommendations and stakes adapt to you.",
  },
  {
    q: "Is payment secure? Can I cancel?",
    a: "Payment is handled by Whop, a secure platform — no banking details are stored by Copafever. Essential and Premium subscriptions are commitment-free, cancellable anytime in one click. Lifetime is a one-time payment, with no renewal.",
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
