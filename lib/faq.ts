/** FAQ — shared by the visible accordion (components/faq-section) and the
 *  FAQPage JSON-LD on the landing. Keep answers honest and concrete.
 *  Copafever is a match-analysis tool. */
import type { Locale } from "@/lib/i18n/config";

export interface FaqItem {
  q: string;
  a: string;
}

const FAQ_FR: FaqItem[] = [
  {
    q: "C'est quoi Copafever, en une phrase ?",
    a: "Copafever est un outil d'analyse de matchs de football : pour chaque rencontre, il croise la forme réelle des deux équipes, les confrontations passées, les effectifs, les absents et les statistiques joueurs, puis l'IA en tire une lecture claire du match, avant le coup d'envoi.",
  },
  {
    q: "D'où viennent les données ?",
    a: "De données sportives réelles, mises à jour en continu : résultats, buts marqués et encaissés, compositions, effectifs, blessés et suspendus, confrontations directes, classements et statistiques individuelles sur les grands championnats européens. Aucune analyse ne repose sur un chiffre inventé. Quand une donnée manque, on le dit plutôt que de combler le vide.",
  },
  {
    q: "Comment l'IA construit son analyse ?",
    a: "Elle part des chiffres : la forme sur les 10 derniers matchs, les buts attendus, le rendement à domicile et à l'extérieur, les joueurs qui jouent et marquent vraiment, les absents. Un modèle statistique estime la probabilité de chaque issue, puis l'IA explique ce que ces chiffres racontent : le scénario probable, les forces et les faiblesses, les joueurs à suivre.",
  },
  {
    q: "Quels championnats sont couverts ?",
    a: "Toute la saison 2026/27 : Ligue 1, Premier League, Liga, Serie A, Bundesliga, Ligue des Champions et Ligue Europa. Plus de 2 100 matchs analysables sur la saison.",
  },
  {
    q: "Comment ça marche concrètement ?",
    a: "Tu crées un compte, tu choisis un match, tu lances l'analyse. En quelques secondes tu obtiens le résumé du match, les probabilités de chaque issue, les buts attendus, les forces et faiblesses des deux équipes, les joueurs à suivre, et tu peux poser tes propres questions à l'IA sur ce match.",
  },
  {
    q: "Vous prédisez vraiment les scores ?",
    a: "On estime des probabilités, pas des certitudes. Un match de foot reste imprévisible, et une analyse qui prétend le contraire te ment. Copafever te donne la lecture la plus solide possible à partir des données, en montrant son raisonnement, pour que tu comprennes le match avant qu'il commence.",
  },
  {
    q: "Combien ça coûte ?",
    a: "Un seul plan, trois durées, sans palier gratuit : Semaine à 9,99 €, Mois à 19,99 €, Saison à 169 € (12 mois, soit 14,10 €/mois, 30 % de moins que le mensuel). Le contenu est identique dans les trois : toutes les analyses, le chat IA, l'historique. Seule la durée change.",
  },
  {
    q: "Le paiement est-il sécurisé ? Puis-je résilier ?",
    a: "Le paiement est géré par Whop, une plateforme sécurisée. Aucune donnée bancaire n'est stockée par Copafever. Les trois formules sont sans engagement et résiliables à tout moment en un clic depuis ton espace.",
  },
];

export function getFaq(locale: Locale): FaqItem[] {
  // French-only site: the legacy "en" locale is never served.
  void locale;
  return FAQ_FR;
}

/** Back-compat default export (French) for any non-localized consumer. */
export const FAQ = FAQ_FR;
