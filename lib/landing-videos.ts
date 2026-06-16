/**
 * Reels affichés sur la landing (section "Copafever en vrai" — feeling TikTok).
 *
 * Les vidéos vivent dans `public/videos/` (reel-N.mp4 + reel-N.jpg poster).
 * Pour en ajouter/remplacer une : dépose le .mp4 vertical (9:16) compressé +
 * son poster .jpg, puis ajoute/édite une entrée ici. Tant qu'un `src` est
 * absent, une carte placeholder "Vidéo bientôt" s'affiche (page publiable).
 *
 * Specs conseillées : 9:16, court de préférence, compressé (faststart). Voir
 * public/videos/README.md pour la commande ffmpeg.
 */
export interface Reel {
  id: string;
  /** Chemin du fichier dans /public, ex. "/videos/reel-1.mp4". Absent = placeholder. */
  src?: string;
  /** Image affichée avant lecture, ex. "/videos/reel-1.jpg". */
  poster?: string;
  /** Auteur / créateur affiché en overlay. */
  author: string;
  /** Légende courte type TikTok. */
  caption: string;
  /** Lien "voir en entier" (profil TikTok/Insta ou vidéo). Optionnel. */
  href?: string;
  /** Petite stat d'engagement (déco, feeling TikTok). */
  likes?: string;
  comments?: string;
}

export const REELS: Reel[] = [
  {
    id: "reel-1",
    src: "/videos/reel-1.mp4",
    poster: "/videos/reel-1.jpg",
    author: "@0xcopa",
    caption: "L'IA a prédit TOUS les matchs ?! 😱",
    href: "https://www.tiktok.com/@0xcopa",
    likes: "12.4k",
    comments: "843",
  },
  {
    id: "reel-2",
    src: "/videos/reel-2.mp4",
    poster: "/videos/reel-2.jpg",
    author: "@0xcopa",
    caption: "3 matchs sur 4 prédits par l'IA 🤯",
    href: "https://www.tiktok.com/@0xcopa",
    likes: "8.9k",
    comments: "512",
  },
  {
    id: "reel-3",
    src: "/videos/reel-3.mp4",
    poster: "/videos/reel-3.jpg",
    author: "@0xcopa",
    caption: "T'utilises pas encore cette IA ?! 😤",
    href: "https://www.tiktok.com/@0xcopa",
    likes: "15.1k",
    comments: "1.2k",
  },
  {
    id: "reel-4",
    src: "/videos/reel-4.mp4",
    poster: "/videos/reel-4.jpg",
    author: "@0xcopa",
    caption: "L'IA me prédit le match en détail 🔥",
    href: "https://www.tiktok.com/@0xcopa",
    likes: "6.7k",
    comments: "388",
  },
  {
    id: "reel-5",
    src: "/videos/reel-5.mp4",
    poster: "/videos/reel-5.jpg",
    author: "@0xcopa",
    caption: "L'IA avait tout vu 😱 Brésil – Maroc",
    href: "https://www.tiktok.com/@0xcopa",
    likes: "9.3k",
    comments: "604",
  },
];
