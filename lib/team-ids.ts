/**
 * Complete mapping of WC 2026 team names → API-Football team IDs + metadata.
 * Keys stay ENGLISH (OpenFootball / API-Football source); `fr` is the French
 * display name used across the (French-only) UI and search.
 */

export interface TeamMeta {
  apiId: number;
  shortName: string;
  flag: string;
  fifaRanking: number;
  fr: string;
}

export const TEAM_META: Record<string, TeamMeta> = {
  // Group A
  Mexico: { apiId: 16, shortName: "MEX", flag: "🇲🇽", fifaRanking: 15, fr: "Mexique" },
  "South Africa": { apiId: 1531, shortName: "RSA", flag: "🇿🇦", fifaRanking: 60, fr: "Afrique du Sud" },
  "South Korea": { apiId: 17, shortName: "KOR", flag: "🇰🇷", fifaRanking: 25, fr: "Corée du Sud" },
  "Czech Republic": { apiId: 770, shortName: "CZE", flag: "🇨🇿", fifaRanking: 41, fr: "Tchéquie" },

  // Group B
  Canada: { apiId: 5529, shortName: "CAN", flag: "🇨🇦", fifaRanking: 30, fr: "Canada" },
  "Bosnia & Herzegovina": { apiId: 1113, shortName: "BIH", flag: "🇧🇦", fifaRanking: 65, fr: "Bosnie-Herzégovine" },
  Qatar: { apiId: 1569, shortName: "QAT", flag: "🇶🇦", fifaRanking: 55, fr: "Qatar" },
  Switzerland: { apiId: 15, shortName: "SUI", flag: "🇨🇭", fifaRanking: 19, fr: "Suisse" },

  // Group C
  Brazil: { apiId: 6, shortName: "BRA", flag: "🇧🇷", fifaRanking: 6, fr: "Brésil" },
  Morocco: { apiId: 31, shortName: "MAR", flag: "🇲🇦", fifaRanking: 8, fr: "Maroc" },
  Haiti: { apiId: 2386, shortName: "HAI", flag: "🇭🇹", fifaRanking: 83, fr: "Haïti" },
  Scotland: { apiId: 1108, shortName: "SCO", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", fifaRanking: 43, fr: "Écosse" },

  // Group D
  USA: { apiId: 2384, shortName: "USA", flag: "🇺🇸", fifaRanking: 16, fr: "États-Unis" },
  Paraguay: { apiId: 2380, shortName: "PAR", flag: "🇵🇾", fifaRanking: 40, fr: "Paraguay" },
  Uzbekistan: { apiId: 1568, shortName: "UZB", flag: "🇺🇿", fifaRanking: 50, fr: "Ouzbékistan" },
  Jordan: { apiId: 1548, shortName: "JOR", flag: "🇯🇴", fifaRanking: 63, fr: "Jordanie" },

  // Group E
  Germany: { apiId: 25, shortName: "GER", flag: "🇩🇪", fifaRanking: 10, fr: "Allemagne" },
  "Curaçao": { apiId: 5530, shortName: "CUW", flag: "🇨🇼", fifaRanking: 82, fr: "Curaçao" },
  Australia: { apiId: 20, shortName: "AUS", flag: "🇦🇺", fifaRanking: 27, fr: "Australie" },
  Iran: { apiId: 22, shortName: "IRN", flag: "🇮🇷", fifaRanking: 21, fr: "Iran" },

  // Group F
  Netherlands: { apiId: 1118, shortName: "NED", flag: "🇳🇱", fifaRanking: 7, fr: "Pays-Bas" },
  Japan: { apiId: 12, shortName: "JPN", flag: "🇯🇵", fifaRanking: 18, fr: "Japon" },
  Norway: { apiId: 1090, shortName: "NOR", flag: "🇳🇴", fifaRanking: 31, fr: "Norvège" },
  Iraq: { apiId: 1567, shortName: "IRQ", flag: "🇮🇶", fifaRanking: 57, fr: "Irak" },

  // Group G
  Belgium: { apiId: 1, shortName: "BEL", flag: "🇧🇪", fifaRanking: 9, fr: "Belgique" },
  Egypt: { apiId: 32, shortName: "EGY", flag: "🇪🇬", fifaRanking: 29, fr: "Égypte" },
  Colombia: { apiId: 8, shortName: "COL", flag: "🇨🇴", fifaRanking: 13, fr: "Colombie" },
  "DR Congo": { apiId: 1508, shortName: "COD", flag: "🇨🇩", fifaRanking: 46, fr: "RD Congo" },

  // Group H
  Spain: { apiId: 9, shortName: "ESP", flag: "🇪🇸", fifaRanking: 2, fr: "Espagne" },
  "Cape Verde": { apiId: 1533, shortName: "CPV", flag: "🇨🇻", fifaRanking: 69, fr: "Cap-Vert" },
  "Ivory Coast": { apiId: 1501, shortName: "CIV", flag: "🇨🇮", fifaRanking: 34, fr: "Côte d'Ivoire" },
  Austria: { apiId: 775, shortName: "AUT", flag: "🇦🇹", fifaRanking: 24, fr: "Autriche" },

  // Group I
  France: { apiId: 2, shortName: "FRA", flag: "🇫🇷", fifaRanking: 1, fr: "France" },
  Senegal: { apiId: 13, shortName: "SEN", flag: "🇸🇳", fifaRanking: 14, fr: "Sénégal" },
  Sweden: { apiId: 5, shortName: "SWE", flag: "🇸🇪", fifaRanking: 38, fr: "Suède" },
  Uruguay: { apiId: 7, shortName: "URU", flag: "🇺🇾", fifaRanking: 17, fr: "Uruguay" },

  // Group J
  Argentina: { apiId: 26, shortName: "ARG", flag: "🇦🇷", fifaRanking: 3, fr: "Argentine" },
  Algeria: { apiId: 1532, shortName: "ALG", flag: "🇩🇿", fifaRanking: 28, fr: "Algérie" },
  "New Zealand": { apiId: 4673, shortName: "NZL", flag: "🇳🇿", fifaRanking: 85, fr: "Nouvelle-Zélande" },
  Ecuador: { apiId: 2382, shortName: "ECU", flag: "🇪🇨", fifaRanking: 23, fr: "Équateur" },

  // Group K
  Portugal: { apiId: 27, shortName: "POR", flag: "🇵🇹", fifaRanking: 5, fr: "Portugal" },
  Turkey: { apiId: 777, shortName: "TUR", flag: "🇹🇷", fifaRanking: 22, fr: "Turquie" },
  Tunisia: { apiId: 28, shortName: "TUN", flag: "🇹🇳", fifaRanking: 44, fr: "Tunisie" },

  // Group L
  England: { apiId: 10, shortName: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", fifaRanking: 4, fr: "Angleterre" },
  Croatia: { apiId: 3, shortName: "CRO", flag: "🇭🇷", fifaRanking: 11, fr: "Croatie" },
  Ghana: { apiId: 1504, shortName: "GHA", flag: "🇬🇭", fifaRanking: 74, fr: "Ghana" },
  Panama: { apiId: 11, shortName: "PAN", flag: "🇵🇦", fifaRanking: 33, fr: "Panama" },

  // Additional teams that may appear
  Poland: { apiId: 24, shortName: "POL", flag: "🇵🇱", fifaRanking: 26, fr: "Pologne" },
  Denmark: { apiId: 21, shortName: "DEN", flag: "🇩🇰", fifaRanking: 20, fr: "Danemark" },
  "Saudi Arabia": { apiId: 23, shortName: "KSA", flag: "🇸🇦", fifaRanking: 61, fr: "Arabie saoudite" },
  Serbia: { apiId: 14, shortName: "SRB", flag: "🇷🇸", fifaRanking: 33, fr: "Serbie" },
};

export function getTeamMeta(name: string): TeamMeta {
  return (
    TEAM_META[name] ?? {
      apiId: 0,
      shortName: name.slice(0, 3).toUpperCase(),
      flag: "🏳️",
      fifaRanking: 0,
      fr: name,
    }
  );
}

/** French display name for an English team key (fallback: the input). */
export function teamNameFr(english: string): string {
  return TEAM_META[english]?.fr ?? english;
}
