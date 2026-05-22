/** Convert a 2-letter ISO 3166-1 country code to a flag emoji */
export function codeToFlag(code: string): string {
  if (!code || code.length !== 2) return "🏳️";
  const base = 0x1f1e6 - 65;
  return String.fromCodePoint(base + code.toUpperCase().charCodeAt(0)) +
         String.fromCodePoint(base + code.toUpperCase().charCodeAt(1));
}

/** Map team name as returned by API-Football to flag emoji */
export const TEAM_FLAGS: Record<string, string> = {
  // Europe
  France: "🇫🇷",
  Germany: "🇩🇪",
  Spain: "🇪🇸",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Portugal: "🇵🇹",
  Netherlands: "🇳🇱",
  Italy: "🇮🇹",
  Belgium: "🇧🇪",
  Croatia: "🇭🇷",
  Switzerland: "🇨🇭",
  Denmark: "🇩🇰",
  Austria: "🇦🇹",
  Poland: "🇵🇱",
  "Czech Republic": "🇨🇿",
  Czechia: "🇨🇿",
  Hungary: "🇭🇺",
  Serbia: "🇷🇸",
  Ukraine: "🇺🇦",
  "North Macedonia": "🇲🇰",
  Slovenia: "🇸🇮",
  Slovakia: "🇸🇰",
  Albania: "🇦🇱",
  Georgia: "🇬🇪",
  Turkey: "🇹🇷",
  Romania: "🇷🇴",
  Greece: "🇬🇷",
  Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  Ireland: "🇮🇪",
  Iceland: "🇮🇸",
  // Americas
  Argentina: "🇦🇷",
  Brazil: "🇧🇷",
  "United States": "🇺🇸",
  USA: "🇺🇸",
  Mexico: "🇲🇽",
  Colombia: "🇨🇴",
  Uruguay: "🇺🇾",
  Chile: "🇨🇱",
  Ecuador: "🇪🇨",
  Peru: "🇵🇪",
  Bolivia: "🇧🇴",
  Paraguay: "🇵🇾",
  Venezuela: "🇻🇪",
  Canada: "🇨🇦",
  Costa: "🇨🇷",
  "Costa Rica": "🇨🇷",
  Panama: "🇵🇦",
  Honduras: "🇭🇳",
  Jamaica: "🇯🇲",
  // Africa
  Morocco: "🇲🇦",
  Senegal: "🇸🇳",
  Nigeria: "🇳🇬",
  "Ivory Coast": "🇨🇮",
  "Côte d'Ivoire": "🇨🇮",
  Ghana: "🇬🇭",
  Cameroon: "🇨🇲",
  Mali: "🇲🇱",
  Egypt: "🇪🇬",
  Algeria: "🇩🇿",
  Tunisia: "🇹🇳",
  "South Africa": "🇿🇦",
  Congo: "🇨🇬",
  "DR Congo": "🇨🇩",
  Zambia: "🇿🇲",
  // Asia & Middle East
  Japan: "🇯🇵",
  "South Korea": "🇰🇷",
  Australia: "🇦🇺",
  Iran: "🇮🇷",
  "Saudi Arabia": "🇸🇦",
  Qatar: "🇶🇦",
  Iraq: "🇮🇶",
  Uzbekistan: "🇺🇿",
  China: "🇨🇳",
  Indonesia: "🇮🇩",
  // Others
  "New Zealand": "🇳🇿",
};

export function teamFlag(name: string): string {
  return TEAM_FLAGS[name] ?? "🏳️";
}

/** ISO-639 player country code → flag (used for squad player nationalities) */
export const PLAYER_FLAGS: Record<string, string> = {
  FR: "🇫🇷", DE: "🇩🇪", ES: "🇪🇸", GB: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", PT: "🇵🇹",
  NL: "🇳🇱", IT: "🇮🇹", BE: "🇧🇪", HR: "🇭🇷", CH: "🇨🇭",
  DK: "🇩🇰", AT: "🇦🇹", PL: "🇵🇱", HU: "🇭🇺", RS: "🇷🇸",
  AR: "🇦🇷", BR: "🇧🇷", US: "🇺🇸", MX: "🇲🇽", CO: "🇨🇴",
  UY: "🇺🇾", CL: "🇨🇱", EC: "🇪🇨", CA: "🇨🇦",
  MA: "🇲🇦", SN: "🇸🇳", NG: "🇳🇬", CI: "🇨🇮", GH: "🇬🇭",
  CM: "🇨🇲", DZ: "🇩🇿", TN: "🇹🇳", JP: "🇯🇵", KR: "🇰🇷",
  AU: "🇦🇺", IR: "🇮🇷", SA: "🇸🇦", QA: "🇶🇦",
};

export function playerFlag(countryCode: string): string {
  return PLAYER_FLAGS[countryCode?.toUpperCase()] ?? "🏳️";
}

/** Shorten a 3-letter FIFA code for display */
export const SHORT_NAMES: Record<string, string> = {
  France: "FRA", Germany: "GER", Spain: "ESP", England: "ENG",
  Portugal: "POR", Netherlands: "NED", Italy: "ITA", Belgium: "BEL",
  Croatia: "CRO", Switzerland: "SUI", Denmark: "DEN", Austria: "AUT",
  Poland: "POL", Serbia: "SRB", Ukraine: "UKR", Turkey: "TUR",
  Romania: "ROU", Greece: "GRE", Scotland: "SCO", Wales: "WAL",
  Argentina: "ARG", Brazil: "BRA", "United States": "USA", Mexico: "MEX",
  Colombia: "COL", Uruguay: "URU", Chile: "CHI", Ecuador: "ECU",
  "Costa Rica": "CRC", Canada: "CAN",
  Morocco: "MAR", Senegal: "SEN", Nigeria: "NGA", "Ivory Coast": "CIV",
  Ghana: "GHA", Cameroon: "CMR", Algeria: "ALG", Tunisia: "TUN",
  Egypt: "EGY",
  Japan: "JPN", "South Korea": "KOR", Australia: "AUS", Iran: "IRN",
  "Saudi Arabia": "KSA", Qatar: "QAT",
};

export function shortName(name: string): string {
  return SHORT_NAMES[name] ?? name.slice(0, 3).toUpperCase();
}
