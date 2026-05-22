/**
 * Complete mapping of WC 2026 team names → API-Football team IDs + metadata.
 * IDs are the official API-Football (api-sports.io) national team IDs.
 */

export interface TeamMeta {
  apiId: number;
  shortName: string;
  flag: string;
  fifaRanking: number;
}

export const TEAM_META: Record<string, TeamMeta> = {
  // Group A
  Mexico: { apiId: 16, shortName: "MEX", flag: "🇲🇽", fifaRanking: 15 },
  "South Africa": { apiId: 1531, shortName: "RSA", flag: "🇿🇦", fifaRanking: 57 },
  "South Korea": { apiId: 17, shortName: "KOR", flag: "🇰🇷", fifaRanking: 22 },
  "Czech Republic": { apiId: 770, shortName: "CZE", flag: "🇨🇿", fifaRanking: 37 },

  // Group B
  Canada: { apiId: 5529, shortName: "CAN", flag: "🇨🇦", fifaRanking: 47 },
  "Bosnia & Herzegovina": { apiId: 1113, shortName: "BIH", flag: "🇧🇦", fifaRanking: 58 },
  Qatar: { apiId: 1569, shortName: "QAT", flag: "🇶🇦", fifaRanking: 68 },
  Switzerland: { apiId: 15, shortName: "SUI", flag: "🇨🇭", fifaRanking: 19 },

  // Group C
  Brazil: { apiId: 6, shortName: "BRA", flag: "🇧🇷", fifaRanking: 5 },
  Morocco: { apiId: 31, shortName: "MAR", flag: "🇲🇦", fifaRanking: 14 },
  Haiti: { apiId: 2386, shortName: "HAI", flag: "🇭🇹", fifaRanking: 82 },
  Scotland: { apiId: 1108, shortName: "SCO", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", fifaRanking: 39 },

  // Group D
  USA: { apiId: 2384, shortName: "USA", flag: "🇺🇸", fifaRanking: 16 },
  Paraguay: { apiId: 2380, shortName: "PAR", flag: "🇵🇾", fifaRanking: 63 },
  Uzbekistan: { apiId: 1568, shortName: "UZB", flag: "🇺🇿", fifaRanking: 70 },
  Jordan: { apiId: 1548, shortName: "JOR", flag: "🇯🇴", fifaRanking: 74 },

  // Group E
  Germany: { apiId: 25, shortName: "GER", flag: "🇩🇪", fifaRanking: 13 },
  "Curaçao": { apiId: 5530, shortName: "CUW", flag: "🇨🇼", fifaRanking: 90 },
  Australia: { apiId: 20, shortName: "AUS", flag: "🇦🇺", fifaRanking: 23 },
  Iran: { apiId: 22, shortName: "IRN", flag: "🇮🇷", fifaRanking: 22 },

  // Group F
  Netherlands: { apiId: 1118, shortName: "NED", flag: "🇳🇱", fifaRanking: 7 },
  Japan: { apiId: 12, shortName: "JPN", flag: "🇯🇵", fifaRanking: 17 },
  Norway: { apiId: 1090, shortName: "NOR", flag: "🇳🇴", fifaRanking: 30 },
  Iraq: { apiId: 1567, shortName: "IRQ", flag: "🇮🇶", fifaRanking: 62 },

  // Group G
  Belgium: { apiId: 1, shortName: "BEL", flag: "🇧🇪", fifaRanking: 6 },
  Egypt: { apiId: 32, shortName: "EGY", flag: "🇪🇬", fifaRanking: 35 },
  Colombia: { apiId: 8, shortName: "COL", flag: "🇨🇴", fifaRanking: 9 },
  "DR Congo": { apiId: 1508, shortName: "COD", flag: "🇨🇩", fifaRanking: 53 },

  // Group H
  Spain: { apiId: 9, shortName: "ESP", flag: "🇪🇸", fifaRanking: 8 },
  "Cape Verde": { apiId: 1533, shortName: "CPV", flag: "🇨🇻", fifaRanking: 50 },
  "Ivory Coast": { apiId: 1501, shortName: "CIV", flag: "🇨🇮", fifaRanking: 48 },
  Austria: { apiId: 775, shortName: "AUT", flag: "🇦🇹", fifaRanking: 27 },

  // Group I
  France: { apiId: 2, shortName: "FRA", flag: "🇫🇷", fifaRanking: 2 },
  Senegal: { apiId: 13, shortName: "SEN", flag: "🇸🇳", fifaRanking: 18 },
  Sweden: { apiId: 5, shortName: "SWE", flag: "🇸🇪", fifaRanking: 26 },
  Uruguay: { apiId: 7, shortName: "URU", flag: "🇺🇾", fifaRanking: 12 },

  // Group J
  Argentina: { apiId: 26, shortName: "ARG", flag: "🇦🇷", fifaRanking: 1 },
  Algeria: { apiId: 1532, shortName: "ALG", flag: "🇩🇿", fifaRanking: 44 },
  "New Zealand": { apiId: 4673, shortName: "NZL", flag: "🇳🇿", fifaRanking: 97 },
  Ecuador: { apiId: 2382, shortName: "ECU", flag: "🇪🇨", fifaRanking: 31 },

  // Group K
  Portugal: { apiId: 27, shortName: "POR", flag: "🇵🇹", fifaRanking: 4 },
  Turkey: { apiId: 777, shortName: "TUR", flag: "🇹🇷", fifaRanking: 29 },
  Tunisia: { apiId: 28, shortName: "TUN", flag: "🇹🇳", fifaRanking: 33 },

  // Group L
  England: { apiId: 10, shortName: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", fifaRanking: 3 },
  Croatia: { apiId: 3, shortName: "CRO", flag: "🇭🇷", fifaRanking: 10 },
  Ghana: { apiId: 1504, shortName: "GHA", flag: "🇬🇭", fifaRanking: 60 },
  Panama: { apiId: 11, shortName: "PAN", flag: "🇵🇦", fifaRanking: 55 },

  // Additional teams that may appear
  Poland: { apiId: 24, shortName: "POL", flag: "🇵🇱", fifaRanking: 28 },
  Denmark: { apiId: 21, shortName: "DEN", flag: "🇩🇰", fifaRanking: 21 },
  "Saudi Arabia": { apiId: 23, shortName: "KSA", flag: "🇸🇦", fifaRanking: 56 },
  Serbia: { apiId: 14, shortName: "SRB", flag: "🇷🇸", fifaRanking: 33 },
};

export function getTeamMeta(name: string): TeamMeta {
  return (
    TEAM_META[name] ?? {
      apiId: 0,
      shortName: name.slice(0, 3).toUpperCase(),
      flag: "🏳️",
      fifaRanking: 0,
    }
  );
}
