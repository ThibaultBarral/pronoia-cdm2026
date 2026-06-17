/** FAQ — shared by the visible accordion (components/faq-section) and the
 *  FAQPage JSON-LD on the landing. Keep answers honest and concrete. */
export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ: FaqItem[] = [
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
    a: "Tu commences gratuitement avec 3 analyses offertes. Ensuite : Hebdo à 2,99 €/semaine pour tester, Mensuel à 8,99 €/mois (l'offre la plus complète, tous les outils), ou Accès à vie en paiement unique. L'Accès à vie est à 59 € en tarif de lancement jusqu'au 19 juillet, puis 99 €.",
  },
  {
    q: "Quelle est la différence entre les offres ?",
    a: "Toutes donnent les analyses IA illimitées, les value bets, les cotes en direct et le suivi de bankroll. Le Mensuel et l'Accès à vie ajoutent en plus le chat IA contextuel, le simulateur de parcours et le bracket interactif. L'Accès à vie, c'est tout ça pour toujours, sans abonnement.",
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
    a: "Le paiement est géré par Whop, une plateforme sécurisée — aucune donnée bancaire n'est stockée par Copafever. Les abonnements Hebdo et Mensuel sont sans engagement, résiliables à tout moment en un clic. L'Accès à vie est un paiement unique, sans reconduction.",
  },
  {
    q: "Est-ce légal et responsable ?",
    a: "Copafever est un outil d'aide à la décision : les analyses sont fournies à titre informatif uniquement et ne garantissent aucun gain. Les paris sportifs comportent des risques. Le service est réservé aux personnes de 18 ans et plus. Mise toujours de petites sommes, pour le plaisir, et joue responsable.",
  },
];
