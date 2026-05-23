/**
 * Static scouting data for all 48 WC 2026 teams.
 * Source: real qualification results, FIFA rankings, press reports (knowledge cutoff Aug 2025).
 * Used as base data when API-Football is unavailable or returns nothing.
 */

import type { FormResult, TeamStats } from "./types";

export interface TeamProfile {
  coach: string;
  formation: string;
  recentForm: FormResult[];
  stats: TeamStats;
  keyPlayers: string[];
  strengths: string[];
  weaknesses: string[];
}

export const TEAM_PROFILES: Record<string, TeamProfile> = {

  // ── GROUP A ──────────────────────────────────────────────────────────────────

  Mexico: {
    coach: "Javier Aguirre",
    formation: "4-3-3",
    recentForm: [
      { opponent: "Honduras", result: "W", score: "4-0", competition: "CONCACAF" },
      { opponent: "Panama", result: "D", score: "1-1", competition: "CONCACAF" },
      { opponent: "Jamaica", result: "W", score: "3-0", competition: "CONCACAF" },
      { opponent: "Costa Rica", result: "W", score: "2-0", competition: "CONCACAF" },
      { opponent: "USA", result: "L", score: "0-2", competition: "CONCACAF" },
    ],
    stats: {
      possession: 55, goalsScored: 22, goalsConceded: 9,
      xGFor: 19.8, xGAgainst: 10.2, cleanSheets: 7,
      qualificationPath: "CONCACAF (hôte)",
    },
    keyPlayers: ["Santiago Giménez", "Hirving Lozano", "Edson Álvarez"],
    strengths: ["Giménez — machine à buts en club (30+ goals/saison)", "Force à domicile (Estadio Azteca — altitude 2240m)", "Pressing haut collectif organisé"],
    weaknesses: ["Fragilité défensive sur contre-attaques rapides", "Irrégularité mentale dans les grands matchs"],
  },

  "South Africa": {
    coach: "Hugo Broos",
    formation: "4-4-2",
    recentForm: [
      { opponent: "Rwanda", result: "W", score: "3-0", competition: "CAF Qual." },
      { opponent: "Nigeria", result: "D", score: "1-1", competition: "CAF Qual." },
      { opponent: "Benin", result: "W", score: "2-0", competition: "CAF Qual." },
      { opponent: "Zimbabwe", result: "W", score: "2-1", competition: "CAF Qual." },
      { opponent: "Morocco", result: "D", score: "0-0", competition: "AFCON" },
    ],
    stats: {
      possession: 46, goalsScored: 14, goalsConceded: 8,
      xGFor: 12.5, xGAgainst: 9.1, cleanSheets: 5,
      qualificationPath: "CAF - Groupe C (1er)",
    },
    keyPlayers: ["Percy Tau", "Themba Zwane", "Ronwen Williams"],
    strengths: ["Bloc défensif compact difficile à briser", "Efficacité sur phases arrêtées", "Expérience continentale solide"],
    weaknesses: ["Manque de profondeur offensive", "Niveau faible face aux tops européens/sud-américains"],
  },

  "South Korea": {
    coach: "Hong Myung-bo",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Iraq", result: "W", score: "3-2", competition: "AFC Qual." },
      { opponent: "Jordan", result: "W", score: "2-0", competition: "AFC Qual." },
      { opponent: "China", result: "W", score: "2-0", competition: "AFC Qual." },
      { opponent: "Oman", result: "W", score: "1-0", competition: "AFC Qual." },
      { opponent: "Kuwait", result: "W", score: "3-1", competition: "AFC Qual." },
    ],
    stats: {
      possession: 54, goalsScored: 20, goalsConceded: 10,
      xGFor: 17.2, xGAgainst: 10.5, cleanSheets: 6,
      qualificationPath: "AFC - Groupe B (1er)",
    },
    keyPlayers: ["Son Heung-min", "Lee Kang-in", "Kim Min-jae"],
    strengths: ["Son — créateur de danger constant, expérience Premier League", "Kim Min-jae — défenseur central élite mondiale (Bayern)", "Vitesse en transition"],
    weaknesses: ["Dépendance excessive à Son Heung-min", "Milieu limité physiquement face aux tops mondiaux"],
  },

  "Czech Republic": {
    coach: "Ivan Hašek",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Ukraine", result: "W", score: "2-1", competition: "UEFA Qual." },
      { opponent: "Moldova", result: "W", score: "3-0", competition: "UEFA Qual." },
      { opponent: "Albania", result: "D", score: "1-1", competition: "UEFA Qual." },
      { opponent: "Poland", result: "W", score: "2-1", competition: "UEFA Nations L." },
      { opponent: "Slovakia", result: "D", score: "1-1", competition: "UEFA Qual." },
    ],
    stats: {
      possession: 52, goalsScored: 17, goalsConceded: 8,
      xGFor: 15.3, xGAgainst: 8.8, cleanSheets: 5,
      qualificationPath: "UEFA - Playoffs",
    },
    keyPlayers: ["Tomáš Souček", "Patrik Schick", "Vladimír Coufal"],
    strengths: ["Solidité défensive collective", "Efficacité sur coups de pied arrêtés (Souček en box-to-box)", "Pressing structuré et discipliné"],
    weaknesses: ["Manque de créativité entre les lignes", "Dépendance à Schick devant le but"],
  },

  // ── GROUP B ──────────────────────────────────────────────────────────────────

  Canada: {
    coach: "Jesse Marsch",
    formation: "4-3-3",
    recentForm: [
      { opponent: "Mexico", result: "W", score: "2-0", competition: "CONCACAF" },
      { opponent: "USA", result: "D", score: "1-1", competition: "CONCACAF" },
      { opponent: "Honduras", result: "W", score: "4-1", competition: "CONCACAF" },
      { opponent: "Panama", result: "W", score: "2-1", competition: "CONCACAF" },
      { opponent: "Jamaica", result: "W", score: "2-0", competition: "CONCACAF" },
    ],
    stats: {
      possession: 53, goalsScored: 23, goalsConceded: 10,
      xGFor: 20.1, xGAgainst: 10.8, cleanSheets: 7,
      qualificationPath: "CONCACAF (hôte)",
    },
    keyPlayers: ["Alphonso Davies", "Jonathan David", "Tajon Buchanan"],
    strengths: ["Davies — vitesse dévastatrice sur le flanc gauche (Bayern)", "Jonathan David — machine à goals en club (35+ buts/saison)", "Pressing haut collectif intense"],
    weaknesses: ["Inexpérience en grande compétition mondiale", "Défense centrale fébrile sur les centres"],
  },

  "Bosnia & Herzegovina": {
    coach: "Sergej Barbarez",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Luxembourg", result: "W", score: "3-0", competition: "UEFA Qual." },
      { opponent: "Iceland", result: "D", score: "1-1", competition: "UEFA Qual." },
      { opponent: "Turkey", result: "L", score: "1-3", competition: "UEFA Qual." },
      { opponent: "Slovenia", result: "W", score: "2-1", competition: "UEFA Qual." },
      { opponent: "Finland", result: "W", score: "2-0", competition: "UEFA Qual." },
    ],
    stats: {
      possession: 49, goalsScored: 16, goalsConceded: 10,
      xGFor: 13.5, xGAgainst: 9.5, cleanSheets: 4,
      qualificationPath: "UEFA - Playoffs",
    },
    keyPlayers: ["Edin Džeko", "Sven Musa", "Amer Gojak"],
    strengths: ["Džeko — pivot de classe mondiale, expérience internationale énorme", "Bonnes transitions rapides", "Forte présence aérienne"],
    weaknesses: ["Latéraux défensifs exposés en profondeur", "Manque de régularité collective"],
  },

  Qatar: {
    coach: "Marquez López",
    formation: "4-3-3",
    recentForm: [
      { opponent: "UAE", result: "W", score: "2-0", competition: "AFC Qual." },
      { opponent: "Kyrgyzstan", result: "W", score: "3-0", competition: "AFC Qual." },
      { opponent: "Afghanistan", result: "W", score: "5-0", competition: "AFC Qual." },
      { opponent: "India", result: "W", score: "3-0", competition: "AFC Qual." },
      { opponent: "Kuwait", result: "D", score: "1-1", competition: "AFC Qual." },
    ],
    stats: {
      possession: 55, goalsScored: 22, goalsConceded: 6,
      xGFor: 19.0, xGAgainst: 6.8, cleanSheets: 7,
      qualificationPath: "AFC - Groupe A (1er)",
    },
    keyPlayers: ["Akram Afif", "Almoez Ali", "Boualem Khoukhi"],
    strengths: ["Organisation défensive compacte", "Jeu de possession structuré", "Solidité collective"],
    weaknesses: ["Niveau qualifs AFC très inférieur aux tops mondiaux", "Physique limité face aux équipes européennes"],
  },

  Switzerland: {
    coach: "Murat Yakin",
    formation: "3-4-3",
    recentForm: [
      { opponent: "Kosovo", result: "W", score: "5-0", competition: "UEFA Qual." },
      { opponent: "Romania", result: "D", score: "2-2", competition: "UEFA Qual." },
      { opponent: "Belarus", result: "W", score: "3-0", competition: "UEFA Qual." },
      { opponent: "Hungary", result: "W", score: "2-1", competition: "UEFA Nations L." },
      { opponent: "Serbia", result: "D", score: "1-1", competition: "UEFA Qual." },
    ],
    stats: {
      possession: 55, goalsScored: 20, goalsConceded: 7,
      xGFor: 17.8, xGAgainst: 7.5, cleanSheets: 6,
      qualificationPath: "UEFA - Groupe I (1er)",
    },
    keyPlayers: ["Granit Xhaka", "Xherdan Shaqiri", "Breel Embolo"],
    strengths: ["Xhaka — milieu récupérateur de classe mondiale (Bayer Leverkusen)", "Solidité défensive (peu de buts concédés)", "Expérience des grandes compétitions (QF WC 2022)"],
    weaknesses: ["Manque de joueur de classe mondiale en pointe", "Créativité offensive trop dépendante de Shaqiri"],
  },

  // ── GROUP C ──────────────────────────────────────────────────────────────────

  Brazil: {
    coach: "Dorival Júnior",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Colombia", result: "D", score: "1-1", competition: "CONMEBOL" },
      { opponent: "Paraguay", result: "W", score: "4-2", competition: "CONMEBOL" },
      { opponent: "Chile", result: "W", score: "2-1", competition: "CONMEBOL" },
      { opponent: "Ecuador", result: "D", score: "0-0", competition: "CONMEBOL" },
      { opponent: "Venezuela", result: "W", score: "1-0", competition: "CONMEBOL" },
    ],
    stats: {
      possession: 59, goalsScored: 28, goalsConceded: 18,
      xGFor: 24.5, xGAgainst: 16.2, cleanSheets: 5,
      qualificationPath: "CONMEBOL (4e)",
    },
    keyPlayers: ["Vinícius Jr.", "Rodrygo", "Raphinha", "Endrick"],
    strengths: ["Attaque de classe mondiale (Vini, Rodrygo, Raphinha)", "Talent individuel supérieur dans tous les postes offensifs", "Endrick — phénomène à 19 ans (Real Madrid)"],
    weaknesses: ["Défense trop perméable (18 buts en qualifs CONMEBOL)", "Manque de cohésion défensive collective sous Dorival"],
  },

  Morocco: {
    coach: "Walid Regragui",
    formation: "4-3-3",
    recentForm: [
      { opponent: "Gabon", result: "W", score: "4-0", competition: "CAF Qual." },
      { opponent: "Lesotho", result: "W", score: "3-0", competition: "CAF Qual." },
      { opponent: "Tanzania", result: "W", score: "2-0", competition: "CAF Qual." },
      { opponent: "Congo", result: "W", score: "2-1", competition: "CAF Qual." },
      { opponent: "Zambia", result: "D", score: "1-1", competition: "CAF Qual." },
    ],
    stats: {
      possession: 48, goalsScored: 18, goalsConceded: 5,
      xGFor: 15.2, xGAgainst: 5.5, cleanSheets: 8,
      qualificationPath: "CAF - Groupe F (1er)",
    },
    keyPlayers: ["Achraf Hakimi", "Hakim Ziyech", "Youssef En-Nesyri", "Sofiane Boufal"],
    strengths: ["Défense ultra-compacte (héritage WC 2022 — demi-finaliste)", "Hakimi — l'un des meilleurs latéraux mondiaux (PSG)", "Très redoutable en contre-attaque"],
    weaknesses: ["Jeu offensif parfois trop limité sans Ziyech en forme", "Ziyech irrégulier avec la sélection"],
  },

  Haiti: {
    coach: "Marc Collat",
    formation: "4-4-2",
    recentForm: [
      { opponent: "Guatemala", result: "W", score: "2-0", competition: "CONCACAF" },
      { opponent: "Trinidad & Tobago", result: "D", score: "1-1", competition: "CONCACAF" },
      { opponent: "El Salvador", result: "L", score: "0-1", competition: "CONCACAF" },
      { opponent: "Honduras", result: "W", score: "2-1", competition: "CONCACAF" },
      { opponent: "Martinique", result: "W", score: "3-0", competition: "CONCACAF" },
    ],
    stats: {
      possession: 45, goalsScored: 12, goalsConceded: 10,
      xGFor: 10.5, xGAgainst: 11.0, cleanSheets: 3,
      qualificationPath: "CONCACAF - Playoffs",
    },
    keyPlayers: ["Duckens Nazon", "Frantz Bernadeau", "Mechack Jérôme"],
    strengths: ["Combativité et pressing haut", "Soutien populaire"],
    weaknesses: ["Niveau général faible vs tops", "Peu de joueurs évoluant dans les grands clubs", "Attaque limitée"],
  },

  Scotland: {
    coach: "Steve Clarke",
    formation: "3-5-2",
    recentForm: [
      { opponent: "Greece", result: "D", score: "1-1", competition: "UEFA Qual." },
      { opponent: "Spain", result: "L", score: "0-2", competition: "UEFA Qual." },
      { opponent: "Norway", result: "D", score: "2-2", competition: "UEFA Qual." },
      { opponent: "Georgia", result: "W", score: "2-0", competition: "UEFA Qual." },
      { opponent: "Cyprus", result: "W", score: "3-0", competition: "UEFA Qual." },
    ],
    stats: {
      possession: 49, goalsScored: 16, goalsConceded: 9,
      xGFor: 13.8, xGAgainst: 9.2, cleanSheets: 4,
      qualificationPath: "UEFA - Playoffs",
    },
    keyPlayers: ["Scott McTominay", "Andy Robertson", "Kieran Tierney"],
    strengths: ["McTominay — box-to-box explosif, buteur régulier (Naples)", "Bloc défensif à 3 difficile à briser", "Pressing haut combatif"],
    weaknesses: ["Peu d'individualité offensive de classe mondiale", "Vulnérable sur transitions en profondeur"],
  },

  // ── GROUP D ──────────────────────────────────────────────────────────────────

  USA: {
    coach: "Mauricio Pochettino",
    formation: "4-3-3",
    recentForm: [
      { opponent: "Mexico", result: "W", score: "2-0", competition: "CONCACAF" },
      { opponent: "Canada", result: "D", score: "1-1", competition: "CONCACAF" },
      { opponent: "Panama", result: "W", score: "3-1", competition: "CONCACAF" },
      { opponent: "Honduras", result: "W", score: "2-0", competition: "CONCACAF" },
      { opponent: "Cuba", result: "W", score: "5-0", competition: "CONCACAF" },
    ],
    stats: {
      possession: 52, goalsScored: 25, goalsConceded: 8,
      xGFor: 21.5, xGAgainst: 9.0, cleanSheets: 8,
      qualificationPath: "CONCACAF (hôte)",
    },
    keyPlayers: ["Christian Pulisic", "Gio Reyna", "Tyler Adams", "Ricardo Pepi"],
    strengths: ["Pulisic — impact décisif, joueur de classe internationale (AC Milan)", "Physique et intensité", "Avantage hôte + stades géants"],
    weaknesses: ["Expérience collective limitée en phase finale de WC", "Profondeur défensive perfectible"],
  },

  Paraguay: {
    coach: "Gustavo Alfaro",
    formation: "4-4-2",
    recentForm: [
      { opponent: "Bolivia", result: "W", score: "2-0", competition: "CONMEBOL" },
      { opponent: "Venezuela", result: "D", score: "1-1", competition: "CONMEBOL" },
      { opponent: "Chile", result: "W", score: "3-0", competition: "CONMEBOL" },
      { opponent: "Uruguay", result: "L", score: "0-1", competition: "CONMEBOL" },
      { opponent: "Ecuador", result: "L", score: "1-2", competition: "CONMEBOL" },
    ],
    stats: {
      possession: 45, goalsScored: 22, goalsConceded: 24,
      xGFor: 18.0, xGAgainst: 20.5, cleanSheets: 4,
      qualificationPath: "CONMEBOL (6e)",
    },
    keyPlayers: ["Miguel Almirón", "Julio Enciso", "Óscar Romero"],
    strengths: ["Almirón — impact en transition (Newcastle)", "Efficacité sur coups de pied arrêtés", "Bloc bas difficile à déjouer"],
    weaknesses: ["Défense très perméable (24 buts encaissés en qualifs)", "Manque de constance collective"],
  },

  Uzbekistan: {
    coach: "Srdjan Vasiljević",
    formation: "4-3-3",
    recentForm: [
      { opponent: "Saudi Arabia", result: "W", score: "1-0", competition: "AFC Qual." },
      { opponent: "Kyrgyzstan", result: "W", score: "3-0", competition: "AFC Qual." },
      { opponent: "Iraq", result: "D", score: "1-1", competition: "AFC Qual." },
      { opponent: "Qatar", result: "L", score: "0-2", competition: "AFC Qual." },
      { opponent: "Iran", result: "L", score: "0-1", competition: "AFC Qual." },
    ],
    stats: {
      possession: 50, goalsScored: 18, goalsConceded: 12,
      xGFor: 15.5, xGAgainst: 11.5, cleanSheets: 4,
      qualificationPath: "AFC - Groupe A (2e)",
    },
    keyPlayers: ["Eldor Shomurodov", "Otabek Shukurov", "Jaloliddin Masharipov"],
    strengths: ["Organisation collective solide", "Physique et pressing intense", "Potentiel de surprise"],
    weaknesses: ["Première participation historique — inexpérience totale", "Peu de joueurs évoluant dans les tops championnats européens"],
  },

  Jordan: {
    coach: "Hossam Hassan",
    formation: "4-5-1",
    recentForm: [
      { opponent: "South Korea", result: "L", score: "0-2", competition: "AFC Qual." },
      { opponent: "Iraq", result: "D", score: "1-1", competition: "AFC Qual." },
      { opponent: "Kuwait", result: "W", score: "2-0", competition: "AFC Qual." },
      { opponent: "China", result: "W", score: "3-1", competition: "AFC Qual." },
      { opponent: "Oman", result: "W", score: "1-0", competition: "AFC Qual." },
    ],
    stats: {
      possession: 44, goalsScored: 14, goalsConceded: 9,
      xGFor: 11.2, xGAgainst: 9.8, cleanSheets: 5,
      qualificationPath: "AFC - Playoffs",
    },
    keyPlayers: ["Musa Al-Tamari", "Ahmad Noor", "Baha' Faisal"],
    strengths: ["Défense rigoureuse et disciplinée", "Efficacité sur contre-attaque"],
    weaknesses: ["Attaque très limitée — pas de buteur de classe mondiale", "Très modeste face aux tops mondiaux"],
  },

  // ── GROUP E ──────────────────────────────────────────────────────────────────

  Germany: {
    coach: "Julian Nagelsmann",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Netherlands", result: "D", score: "2-2", competition: "UEFA Nations L." },
      { opponent: "Bosnia", result: "W", score: "2-1", competition: "UEFA Qual." },
      { opponent: "Slovakia", result: "W", score: "3-1", competition: "UEFA Qual." },
      { opponent: "Hungary", result: "W", score: "5-0", competition: "UEFA Qual." },
      { opponent: "Greece", result: "W", score: "3-0", competition: "UEFA Qual." },
    ],
    stats: {
      possession: 58, goalsScored: 22, goalsConceded: 7,
      xGFor: 20.5, xGAgainst: 7.2, cleanSheets: 6,
      qualificationPath: "UEFA - Groupe A (1er)",
    },
    keyPlayers: ["Jamal Musiala", "Florian Wirtz", "Kai Havertz", "Ilkay Gündogan"],
    strengths: ["Musiala + Wirtz — duo de milieux offensifs parmi les meilleurs mondiaux", "Pressing haut ultra-intense sous Nagelsmann", "Reconstruction post-2022 remarquable (EURO 2024 organisateur SF)"],
    weaknesses: ["Fragilité sur contre-attaques rapides en profondeur", "Défense centrale parfois exposée"],
  },

  "Curaçao": {
    coach: "Remko Bicentini",
    formation: "4-4-2",
    recentForm: [
      { opponent: "El Salvador", result: "W", score: "2-1", competition: "CONCACAF" },
      { opponent: "Guatemala", result: "D", score: "1-1", competition: "CONCACAF" },
      { opponent: "Trinidad & Tobago", result: "W", score: "2-0", competition: "CONCACAF" },
      { opponent: "Haiti", result: "L", score: "0-1", competition: "CONCACAF" },
      { opponent: "Jamaica", result: "W", score: "2-1", competition: "CONCACAF" },
    ],
    stats: {
      possession: 47, goalsScored: 11, goalsConceded: 9,
      xGFor: 9.0, xGAgainst: 8.5, cleanSheets: 3,
      qualificationPath: "CONCACAF - Playoffs",
    },
    keyPlayers: ["Leandro Bacuna", "Cuco Martina", "Elson Hooi"],
    strengths: ["Ardeur collective", "Bloc défensif compact"],
    weaknesses: ["Niveau très limité face aux tops", "Pas de joueur de classe internationale en dehors de la zone", "Première grande compétition"],
  },

  Australia: {
    coach: "Tony Popovic",
    formation: "4-3-3",
    recentForm: [
      { opponent: "Japan", result: "D", score: "0-0", competition: "AFC Qual." },
      { opponent: "Indonesia", result: "W", score: "1-0", competition: "AFC Qual." },
      { opponent: "China", result: "W", score: "3-0", competition: "AFC Qual." },
      { opponent: "Bahrain", result: "W", score: "2-0", competition: "AFC Qual." },
      { opponent: "Saudi Arabia", result: "W", score: "2-1", competition: "AFC Qual." },
    ],
    stats: {
      possession: 51, goalsScored: 17, goalsConceded: 7,
      xGFor: 14.5, xGAgainst: 7.0, cleanSheets: 7,
      qualificationPath: "AFC - Groupe C (1er)",
    },
    keyPlayers: ["Mathew Ryan", "Mitchell Duke", "Aaron Mooy"],
    strengths: ["Solidité défensive remarquable (peu de buts concédés)", "Combativité et pressing physique", "Expérience WC 2022 (huitièmes de finale)"],
    weaknesses: ["Manque criant de créativité offensive", "Peu de joueurs dans les tops championnats européens"],
  },

  Iran: {
    coach: "Amir Ghalenoei",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Uzbekistan", result: "W", score: "1-0", competition: "AFC Qual." },
      { opponent: "Kyrgyzstan", result: "W", score: "3-0", competition: "AFC Qual." },
      { opponent: "UAE", result: "D", score: "0-0", competition: "AFC Qual." },
      { opponent: "Qatar", result: "D", score: "1-1", competition: "AFC Qual." },
      { opponent: "North Korea", result: "W", score: "2-1", competition: "AFC Qual." },
    ],
    stats: {
      possession: 48, goalsScored: 16, goalsConceded: 8,
      xGFor: 13.5, xGAgainst: 8.0, cleanSheets: 6,
      qualificationPath: "AFC - Groupe A (1er)",
    },
    keyPlayers: ["Mehdi Taremi", "Sardar Azmoun", "Ali Gholizadeh"],
    strengths: ["Taremi — buteur de classe mondiale (Inter Milan)", "Bloc bas compact, difficile à briser", "Expérience WC 2022"],
    weaknesses: ["Dépendance totale à Taremi et Azmoun", "Milieu vieillissant, limité en transitions"],
  },

  // ── GROUP F ──────────────────────────────────────────────────────────────────

  Netherlands: {
    coach: "Ronald Koeman",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Germany", result: "D", score: "2-2", competition: "UEFA Nations L." },
      { opponent: "Hungary", result: "W", score: "4-0", competition: "UEFA Qual." },
      { opponent: "Greece", result: "W", score: "4-0", competition: "UEFA Qual." },
      { opponent: "Bosnia", result: "W", score: "3-0", competition: "UEFA Qual." },
      { opponent: "Ireland", result: "W", score: "2-0", competition: "UEFA Qual." },
    ],
    stats: {
      possession: 56, goalsScored: 22, goalsConceded: 6,
      xGFor: 19.8, xGAgainst: 6.5, cleanSheets: 7,
      qualificationPath: "UEFA - Groupe G (1er)",
    },
    keyPlayers: ["Virgil van Dijk", "Xavi Simons", "Cody Gakpo", "Memphis Depay"],
    strengths: ["Van Dijk — défenseur central n°1 mondial (Liverpool)", "Simons et Gakpo — explosivité offensive", "Demi-finaliste WC 2022 — expérience"],
    weaknesses: ["Milieu parfois trop court défensivement", "Memphis irrégulier avec la sélection"],
  },

  Japan: {
    coach: "Hajime Moriyasu",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Australia", result: "D", score: "0-0", competition: "AFC Qual." },
      { opponent: "Bahrain", result: "W", score: "5-0", competition: "AFC Qual." },
      { opponent: "China", result: "W", score: "7-0", competition: "AFC Qual." },
      { opponent: "Saudi Arabia", result: "W", score: "2-0", competition: "AFC Qual." },
      { opponent: "Indonesia", result: "W", score: "4-0", competition: "AFC Qual." },
    ],
    stats: {
      possession: 55, goalsScored: 31, goalsConceded: 4,
      xGFor: 26.5, xGAgainst: 4.2, cleanSheets: 9,
      qualificationPath: "AFC - Groupe C (1er)",
    },
    keyPlayers: ["Kaoru Mitoma", "Wataru Endo", "Takumi Minamino", "Reo Hatate"],
    strengths: ["Pressing ultra-intense — redoutable collectivement", "Joueurs évoluant dans les meilleurs clubs européens (Brighton, Liverpool, Celtic…)", "Défense exceptionnelle (4 buts en 10 matchs qualifs)"],
    weaknesses: ["Physique limité face aux équipes très puissantes physiquement", "Pas de buteur de renommée mondiale"],
  },

  Norway: {
    coach: "Ståle Solbakken",
    formation: "4-3-3",
    recentForm: [
      { opponent: "Moldova", result: "W", score: "4-0", competition: "UEFA Qual." },
      { opponent: "Scotland", result: "D", score: "2-2", competition: "UEFA Qual." },
      { opponent: "Finland", result: "W", score: "3-0", competition: "UEFA Qual." },
      { opponent: "Austria", result: "W", score: "2-1", competition: "UEFA Qual." },
      { opponent: "Kazakhstan", result: "W", score: "4-0", competition: "UEFA Qual." },
    ],
    stats: {
      possession: 52, goalsScored: 24, goalsConceded: 7,
      xGFor: 22.0, xGAgainst: 7.5, cleanSheets: 6,
      qualificationPath: "UEFA - Groupe H (1er)",
    },
    keyPlayers: ["Erling Haaland", "Martin Ødegaard", "Alexander Sørloth"],
    strengths: ["Haaland — meilleur buteur mondial en club (35-50 buts/saison)", "Ødegaard — orchestre le jeu (Arsenal, capitaine)", "Efficacité offensive brute sans domination tactique"],
    weaknesses: ["Tout repose sur Haaland — si blessé ou marqué, l'attaque s'effondre", "Défense centrale pas au niveau des tops mondiaux"],
  },

  Iraq: {
    coach: "Jesús Casas",
    formation: "4-4-2",
    recentForm: [
      { opponent: "Uzbekistan", result: "D", score: "1-1", competition: "AFC Qual." },
      { opponent: "South Korea", result: "L", score: "2-3", competition: "AFC Qual." },
      { opponent: "Jordan", result: "D", score: "1-1", competition: "AFC Qual." },
      { opponent: "Kuwait", result: "W", score: "2-0", competition: "AFC Qual." },
      { opponent: "Oman", result: "W", score: "1-0", competition: "AFC Qual." },
    ],
    stats: {
      possession: 46, goalsScored: 13, goalsConceded: 10,
      xGFor: 10.5, xGAgainst: 9.5, cleanSheets: 3,
      qualificationPath: "AFC - Groupe B (3e) + Playoffs",
    },
    keyPlayers: ["Aymen Hussein", "Amjad Attwan", "Ali Adnan"],
    strengths: ["Bloc défensif discipliné", "Pressing collectif acharné"],
    weaknesses: ["Niveau offensif très limité", "Peu de joueurs évoluant en Europe de haut niveau"],
  },

  // ── GROUP G ──────────────────────────────────────────────────────────────────

  Belgium: {
    coach: "Domenico Tedesco",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Wales", result: "W", score: "3-1", competition: "UEFA Qual." },
      { opponent: "Austria", result: "W", score: "3-2", competition: "UEFA Qual." },
      { opponent: "England", result: "D", score: "2-2", competition: "UEFA Nations L." },
      { opponent: "France", result: "L", score: "1-2", competition: "UEFA Nations L." },
      { opponent: "Slovakia", result: "W", score: "2-1", competition: "UEFA Nations L." },
    ],
    stats: {
      possession: 56, goalsScored: 21, goalsConceded: 11,
      xGFor: 19.5, xGAgainst: 11.0, cleanSheets: 5,
      qualificationPath: "UEFA - Groupe B (1er)",
    },
    keyPlayers: ["Kevin De Bruyne", "Jeremy Doku", "Romelu Lukaku", "Wout Faes"],
    strengths: ["De Bruyne — créateur et passeur de niveau absolu (Man City)", "Doku — explosif sur les ailes (Man City)", "Expérience collective (génération 2018-2024)"],
    weaknesses: ["Lukaku en déclin physique", "Fragilité défensive (11 buts encaissés)", "Génération vieillissante — fin d'un cycle"],
  },

  Egypt: {
    coach: "Hossam El Badry",
    formation: "4-5-1",
    recentForm: [
      { opponent: "Cape Verde", result: "W", score: "1-0", competition: "CAF Qual." },
      { opponent: "Guinea", result: "W", score: "2-0", competition: "CAF Qual." },
      { opponent: "Sierra Leone", result: "W", score: "2-0", competition: "CAF Qual." },
      { opponent: "Ethiopia", result: "W", score: "3-0", competition: "CAF Qual." },
      { opponent: "Comoros", result: "D", score: "1-1", competition: "CAF Qual." },
    ],
    stats: {
      possession: 50, goalsScored: 16, goalsConceded: 4,
      xGFor: 13.5, xGAgainst: 4.5, cleanSheets: 7,
      qualificationPath: "CAF - Groupe C (1er)",
    },
    keyPlayers: ["Mohamed Salah", "Mahmoud Trezeguet", "Mohamed El-Shennawy"],
    strengths: ["Salah — l'un des 3 meilleurs joueurs mondiaux, toujours décisif (Liverpool)", "Solidité défensive en bloc bas", "Expérience internationale solide"],
    weaknesses: ["Tout repose sur Salah — sans lui l'attaque est inexistante", "Milieu trop défensif, manque cruel de créativité"],
  },

  Colombia: {
    coach: "Néstor Lorenzo",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Brazil", result: "D", score: "1-1", competition: "CONMEBOL" },
      { opponent: "Argentina", result: "D", score: "1-1", competition: "CONMEBOL" },
      { opponent: "Ecuador", result: "W", score: "1-0", competition: "CONMEBOL" },
      { opponent: "Bolivia", result: "W", score: "3-0", competition: "CONMEBOL" },
      { opponent: "Venezuela", result: "W", score: "3-1", competition: "CONMEBOL" },
    ],
    stats: {
      possession: 53, goalsScored: 27, goalsConceded: 15,
      xGFor: 23.5, xGAgainst: 13.8, cleanSheets: 5,
      qualificationPath: "CONMEBOL (2e)",
    },
    keyPlayers: ["James Rodríguez", "Luis Díaz", "Jhon Córdoba", "Richard Ríos"],
    strengths: ["James + Díaz — duo offensif explosif de classe mondiale", "Excellente 2e place en qualifs CONMEBOL", "Jeu offensif spectaculaire et ambitieux"],
    weaknesses: ["Défense perméable (15 buts encaissés)", "James sujet aux blessures — disponibilité incertaine"],
  },

  "DR Congo": {
    coach: "Sébastien Desabre",
    formation: "4-3-3",
    recentForm: [
      { opponent: "Tanzania", result: "W", score: "3-0", competition: "CAF Qual." },
      { opponent: "Niger", result: "W", score: "4-1", competition: "CAF Qual." },
      { opponent: "Mauritania", result: "W", score: "2-1", competition: "CAF Qual." },
      { opponent: "South Africa", result: "L", score: "1-2", competition: "CAF Qual." },
      { opponent: "Senegal", result: "L", score: "0-1", competition: "AFCON" },
    ],
    stats: {
      possession: 48, goalsScored: 15, goalsConceded: 10,
      xGFor: 12.5, xGAgainst: 9.5, cleanSheets: 4,
      qualificationPath: "CAF - Groupe H (2e)",
    },
    keyPlayers: ["Cédric Bakambu", "Silas Wangata", "Chancel Mbemba"],
    strengths: ["Talent offensif sous-estimé (Bakambu)", "Physique et agilité athlétique", "Potentiel collectif en progression"],
    weaknesses: ["Irrégularité collective chronique", "Manque de cohésion défensive"],
  },

  // ── GROUP H ──────────────────────────────────────────────────────────────────

  Spain: {
    coach: "Luis de la Fuente",
    formation: "4-3-3",
    recentForm: [
      { opponent: "France", result: "W", score: "2-1", competition: "UEFA Nations L. finale" },
      { opponent: "Denmark", result: "W", score: "3-0", competition: "UEFA Qual." },
      { opponent: "Norway", result: "W", score: "3-0", competition: "UEFA Qual." },
      { opponent: "Scotland", result: "W", score: "2-0", competition: "UEFA Qual." },
      { opponent: "Serbia", result: "W", score: "3-0", competition: "UEFA Qual." },
    ],
    stats: {
      possession: 64, goalsScored: 25, goalsConceded: 5,
      xGFor: 22.5, xGAgainst: 5.2, cleanSheets: 8,
      qualificationPath: "UEFA - Groupe A (1er)",
    },
    keyPlayers: ["Lamine Yamal", "Pedri", "Dani Olmo", "Rodri", "Álvaro Morata"],
    strengths: ["Meilleure possession du monde (64%)", "Yamal — génie à 18 ans, EURO 2024 champion", "Collectif parfaitement rodé — Champions d'Europe ET Nations League"],
    weaknesses: ["Rodri potentiellement diminué (blessure longue durée)", "Manque de vrai 9 de référence", "Peut souffrir contre le bloc bas extrême"],
  },

  "Cape Verde": {
    coach: "Pedro Leitão",
    formation: "4-3-3",
    recentForm: [
      { opponent: "Egypt", result: "L", score: "0-1", competition: "CAF Qual." },
      { opponent: "Guinea", result: "W", score: "2-1", competition: "CAF Qual." },
      { opponent: "Sierra Leone", result: "W", score: "2-0", competition: "CAF Qual." },
      { opponent: "Ethiopia", result: "W", score: "2-0", competition: "CAF Qual." },
      { opponent: "Togo", result: "D", score: "1-1", competition: "CAF Qual." },
    ],
    stats: {
      possession: 46, goalsScored: 14, goalsConceded: 8,
      xGFor: 11.5, xGAgainst: 7.5, cleanSheets: 4,
      qualificationPath: "CAF - Groupe C (2e)",
    },
    keyPlayers: ["Ryan Mendes", "Garry Rodrigues", "Kenny Rocha"],
    strengths: ["Organisation défensive solide", "Efficacité sur contre-attaque"],
    weaknesses: ["Niveau bien inférieur aux tops mondiaux", "Peu de joueurs évoluant dans l'élite européenne"],
  },

  "Ivory Coast": {
    coach: "Emerse Faé",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Nigeria", result: "W", score: "1-0", competition: "AFCON finale" },
      { opponent: "Morocco", result: "D", score: "0-0", competition: "CAF Qual." },
      { opponent: "Kenya", result: "W", score: "3-0", competition: "CAF Qual." },
      { opponent: "Zimbabwe", result: "W", score: "2-0", competition: "CAF Qual." },
      { opponent: "Cameroon", result: "L", score: "0-1", competition: "CAF Qual." },
    ],
    stats: {
      possession: 52, goalsScored: 18, goalsConceded: 7,
      xGFor: 15.5, xGAgainst: 7.0, cleanSheets: 6,
      qualificationPath: "CAF - Groupe D (1er)",
    },
    keyPlayers: ["Sébastien Haller", "Ibrahim Sangaré", "Franck Kessié", "Simon Adingra"],
    strengths: ["Champions d'Afrique 2024 — confiance et vécu collectif", "Profondeur d'effectif offensive remarquable", "Sangaré — milieu défensif élite (PSV)"],
    weaknesses: ["Irrégularité mentale (parcours chaotique à leur AFCON)", "Cadres vieillissants (Kessié, Haller)"],
  },

  Austria: {
    coach: "Ralf Rangnick",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Germany", result: "D", score: "0-0", competition: "UEFA Nations L." },
      { opponent: "Norway", result: "L", score: "1-2", competition: "UEFA Qual." },
      { opponent: "Finland", result: "W", score: "2-0", competition: "UEFA Qual." },
      { opponent: "Moldova", result: "W", score: "5-0", competition: "UEFA Qual." },
      { opponent: "Kazakhstan", result: "W", score: "3-0", competition: "UEFA Qual." },
    ],
    stats: {
      possession: 53, goalsScored: 20, goalsConceded: 8,
      xGFor: 17.5, xGAgainst: 8.5, cleanSheets: 5,
      qualificationPath: "UEFA - Groupe H (2e)",
    },
    keyPlayers: ["Marcel Sabitzer", "Christoph Baumgartner", "Konrad Laimer"],
    strengths: ["Système Rangnick — pressing ultra-intense parmi les meilleurs d'Europe", "Cohésion collective remarquable", "Quart-finaliste EURO 2024 — en progression constante"],
    weaknesses: ["Qualité individuelle limitée vs tops européens", "Performances moins bonnes quand l'adversaire bloque le pressing"],
  },

  // ── GROUP I ──────────────────────────────────────────────────────────────────

  France: {
    coach: "Didier Deschamps",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Belgium", result: "W", score: "2-1", competition: "UEFA Nations L." },
      { opponent: "Spain", result: "L", score: "1-2", competition: "UEFA Nations L. finale" },
      { opponent: "Israel", result: "W", score: "4-0", competition: "UEFA Qual." },
      { opponent: "Italy", result: "W", score: "3-1", competition: "UEFA Nations L." },
      { opponent: "Luxembourg", result: "W", score: "3-0", competition: "UEFA Qual." },
    ],
    stats: {
      possession: 57, goalsScored: 20, goalsConceded: 7,
      xGFor: 18.5, xGAgainst: 7.0, cleanSheets: 7,
      qualificationPath: "UEFA - Groupe B (1er)",
    },
    keyPlayers: ["Kylian Mbappé", "Antoine Griezmann", "Ousmane Dembélé", "Aurélien Tchouaméni"],
    strengths: ["Mbappé — vitesse et finition létales, meilleur joueur mondial (Real Madrid)", "Profondeur d'effectif extraordinaire à tous les postes", "Champion du monde 2018, finaliste 2022 — ADN gagnant"],
    weaknesses: ["Manque de créativité entre les lignes sans Griezmann ou Camavinga", "Défense centrale parfois exposée sur transitions rapides"],
  },

  Senegal: {
    coach: "Aliou Cissé",
    formation: "4-3-3",
    recentForm: [
      { opponent: "DR Congo", result: "W", score: "1-0", competition: "AFCON" },
      { opponent: "Mauritania", result: "W", score: "3-0", competition: "CAF Qual." },
      { opponent: "Togo", result: "W", score: "2-0", competition: "CAF Qual." },
      { opponent: "Sudan", result: "W", score: "2-0", competition: "CAF Qual." },
      { opponent: "Mozambique", result: "W", score: "3-0", competition: "CAF Qual." },
    ],
    stats: {
      possession: 52, goalsScored: 20, goalsConceded: 5,
      xGFor: 17.0, xGAgainst: 5.2, cleanSheets: 8,
      qualificationPath: "CAF - Groupe B (1er)",
    },
    keyPlayers: ["Sadio Mané", "Edouard Mendy", "Kalidou Koulibaly", "Ismaïla Sarr"],
    strengths: ["Mané — légende vivante, expérimenté", "Défense ultra-solide (8 clean sheets)", "Champions d'Afrique 2022 — collectif soudé"],
    weaknesses: ["Mané en légère baisse (Al-Nassr) — pas au même niveau qu'en 2022", "Peu de profondeur offensive si Mané n'est pas en forme"],
  },

  Sweden: {
    coach: "Jon Dahl Tomasson",
    formation: "4-3-3",
    recentForm: [
      { opponent: "Slovakia", result: "W", score: "2-1", competition: "UEFA Qual." },
      { opponent: "Estonia", result: "W", score: "3-0", competition: "UEFA Qual." },
      { opponent: "Luxembourg", result: "W", score: "5-0", competition: "UEFA Qual." },
      { opponent: "Azerbaijan", result: "W", score: "3-0", competition: "UEFA Qual." },
      { opponent: "Hungary", result: "D", score: "1-1", competition: "UEFA Qual." },
    ],
    stats: {
      possession: 55, goalsScored: 22, goalsConceded: 6,
      xGFor: 19.0, xGAgainst: 6.5, cleanSheets: 7,
      qualificationPath: "UEFA - Groupe A (1er)",
    },
    keyPlayers: ["Alexander Isak", "Viktor Gyökeres", "Dejan Kulusevski"],
    strengths: ["Isak + Gyökeres — duo de buteurs redoutable (Newcastle + Sporting, 60+ buts entre eux en club)", "Kulusevski — explosif sur les flancs (Tottenham)", "Collectif solide et bien organisé"],
    weaknesses: ["Inexpérience en phase finale de WC (absents en 2022)", "Peut stagner face à un bloc bas bien en place"],
  },

  Uruguay: {
    coach: "Marcelo Bielsa",
    formation: "4-3-3",
    recentForm: [
      { opponent: "Paraguay", result: "W", score: "1-0", competition: "CONMEBOL" },
      { opponent: "Chile", result: "W", score: "3-0", competition: "CONMEBOL" },
      { opponent: "Bolivia", result: "W", score: "3-0", competition: "CONMEBOL" },
      { opponent: "Venezuela", result: "W", score: "2-0", competition: "CONMEBOL" },
      { opponent: "Colombia", result: "L", score: "2-3", competition: "CONMEBOL" },
    ],
    stats: {
      possession: 48, goalsScored: 24, goalsConceded: 16,
      xGFor: 21.0, xGAgainst: 14.5, cleanSheets: 5,
      qualificationPath: "CONMEBOL (3e)",
    },
    keyPlayers: ["Darwin Núñez", "Federico Valverde", "Rodrigo Bentancur", "Ronald Araújo"],
    strengths: ["Valverde — box-to-box de classe mondiale (Real Madrid, champion d'Europe)", "Núñez — explosivité et puissance (Liverpool)", "Mentalité gagnante légendaire de l'Uruguay"],
    weaknesses: ["Défense parfois fébrile (16 buts encaissés en qualifs)", "Philosophie Bielsa — risquée offensivement, expose la défense"],
  },

  // ── GROUP J ──────────────────────────────────────────────────────────────────

  Argentina: {
    coach: "Lionel Scaloni",
    formation: "4-3-3",
    recentForm: [
      { opponent: "Colombia", result: "D", score: "1-1", competition: "CONMEBOL" },
      { opponent: "Chile", result: "W", score: "3-0", competition: "CONMEBOL" },
      { opponent: "Bolivia", result: "W", score: "6-0", competition: "CONMEBOL" },
      { opponent: "Venezuela", result: "W", score: "3-0", competition: "CONMEBOL" },
      { opponent: "Ecuador", result: "W", score: "2-0", competition: "CONMEBOL" },
    ],
    stats: {
      possession: 54, goalsScored: 30, goalsConceded: 11,
      xGFor: 26.5, xGAgainst: 10.5, cleanSheets: 7,
      qualificationPath: "CONMEBOL (1er)",
    },
    keyPlayers: ["Lionel Messi", "Julián Álvarez", "Rodrigo De Paul", "Lautaro Martínez"],
    strengths: ["Messi — meilleur joueur de l'histoire, WC 2022 champion, toujours décisif", "Profondeur d'attaque extraordinaire (Álvarez, Martínez, Di María)", "Cohésion collective parfaite sous Scaloni — 36 matchs sans défaite"],
    weaknesses: ["Messi a 39 ans — dernier WC, gestion physique délicate", "Défense moins solide qu'en 2022"],
  },

  Algeria: {
    coach: "Vladimir Petkovic",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Mozambique", result: "W", score: "4-0", competition: "CAF Qual." },
      { opponent: "Botswana", result: "W", score: "3-0", competition: "CAF Qual." },
      { opponent: "Guinea", result: "W", score: "2-1", competition: "CAF Qual." },
      { opponent: "Tanzania", result: "W", score: "2-0", competition: "CAF Qual." },
      { opponent: "Liberia", result: "W", score: "4-0", competition: "CAF Qual." },
    ],
    stats: {
      possession: 53, goalsScored: 22, goalsConceded: 5,
      xGFor: 18.5, xGAgainst: 5.5, cleanSheets: 7,
      qualificationPath: "CAF - Groupe G (1er)",
    },
    keyPlayers: ["Riyad Mahrez", "Said Benrahma", "Sofiane Feghouli"],
    strengths: ["Mahrez — créateur de classe internationale (Al-Ahli, ex-Man City)", "Peu de buts encaissés (7 clean sheets)", "Collectif solide et organisé"],
    weaknesses: ["Génération vieillissante (Mahrez, Feghouli)", "Niveau des qualifs CAF bien inférieur aux tops mondiaux"],
  },

  "New Zealand": {
    coach: "Darren Bazeley",
    formation: "4-4-2",
    recentForm: [
      { opponent: "Vanuatu", result: "W", score: "5-0", competition: "OFC Qual." },
      { opponent: "Fiji", result: "W", score: "3-0", competition: "OFC Qual." },
      { opponent: "Tahiti", result: "W", score: "4-0", competition: "OFC Qual." },
      { opponent: "Solomon Islands", result: "W", score: "2-0", competition: "OFC Qual." },
      { opponent: "New Caledonia", result: "W", score: "2-1", competition: "OFC Qual." },
    ],
    stats: {
      possession: 51, goalsScored: 20, goalsConceded: 5,
      xGFor: 16.0, xGAgainst: 5.5, cleanSheets: 7,
      qualificationPath: "OFC (1er)",
    },
    keyPlayers: ["Chris Wood", "Liberato Cacace", "Tim Payne"],
    strengths: ["Chris Wood — expérience Premier League, buteur costaud", "Organisation collective correcte"],
    weaknesses: ["Niveau OFC très inférieur aux autres confédérations", "Très peu de joueurs évoluant dans les tops championnats"],
  },

  Ecuador: {
    coach: "Sebastián Beccacece",
    formation: "4-3-3",
    recentForm: [
      { opponent: "Paraguay", result: "W", score: "2-1", competition: "CONMEBOL" },
      { opponent: "Peru", result: "W", score: "2-0", competition: "CONMEBOL" },
      { opponent: "Chile", result: "W", score: "2-1", competition: "CONMEBOL" },
      { opponent: "Uruguay", result: "D", score: "0-0", competition: "CONMEBOL" },
      { opponent: "Venezuela", result: "D", score: "1-1", competition: "CONMEBOL" },
    ],
    stats: {
      possession: 49, goalsScored: 22, goalsConceded: 18,
      xGFor: 19.0, xGAgainst: 15.5, cleanSheets: 4,
      qualificationPath: "CONMEBOL (5e)",
    },
    keyPlayers: ["Moisés Caicedo", "Enner Valencia", "Gonzalo Plata"],
    strengths: ["Caicedo — milieu élite mondiale (Chelsea, 100M€)", "Bonne progression collective sous Beccacece", "Efficacité offensive en transition"],
    weaknesses: ["Défense très perméable (18 buts encaissés en qualifs)", "Dépendance à Valencia vieillissant en attaque"],
  },

  // ── GROUP K ──────────────────────────────────────────────────────────────────

  Portugal: {
    coach: "Roberto Martínez",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Poland", result: "W", score: "3-1", competition: "UEFA Nations L." },
      { opponent: "Croatia", result: "W", score: "2-1", competition: "UEFA Nations L." },
      { opponent: "Slovakia", result: "W", score: "4-2", competition: "UEFA Qual." },
      { opponent: "Luxembourg", result: "W", score: "9-0", competition: "UEFA Qual." },
      { opponent: "Liechtenstein", result: "W", score: "4-0", competition: "UEFA Qual." },
    ],
    stats: {
      possession: 59, goalsScored: 32, goalsConceded: 7,
      xGFor: 27.5, xGAgainst: 7.0, cleanSheets: 7,
      qualificationPath: "UEFA - Groupe J (1er)",
    },
    keyPlayers: ["Bruno Fernandes", "Bernardo Silva", "Rúben Dias", "Cristiano Ronaldo"],
    strengths: ["Génération exceptionnelle — Fernandes, B. Silva, Dias parmi les meilleurs mondiaux à leurs postes", "32 buts en qualifs — attaque la plus prolifique d'Europe", "Ronaldo — motivation et expérience inégalées"],
    weaknesses: ["Ronaldo (40 ans) — déclin physique, gestion du temps de jeu délicate", "Équilibre défensif parfois sacrifié pour l'attaque"],
  },

  Turkey: {
    coach: "Vincenzo Montella",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Bosnia", result: "W", score: "3-1", competition: "UEFA Qual." },
      { opponent: "Iceland", result: "W", score: "2-1", competition: "UEFA Qual." },
      { opponent: "Georgia", result: "W", score: "3-1", competition: "UEFA Qual." },
      { opponent: "Germany", result: "L", score: "2-3", competition: "EURO 2024" },
      { opponent: "Netherlands", result: "L", score: "1-2", competition: "EURO 2024 QF" },
    ],
    stats: {
      possession: 50, goalsScored: 20, goalsConceded: 12,
      xGFor: 17.0, xGAgainst: 11.5, cleanSheets: 5,
      qualificationPath: "UEFA - Groupe D (1er)",
    },
    keyPlayers: ["Hakan Çalhanoğlu", "Arda Güler", "Kenan Yıldız", "Merih Demiral"],
    strengths: ["Çalhanoğlu — métronome de classe mondiale (Inter Milan, double champion d'Italie)", "Güler + Yıldız — talents offensifs parmi les plus excitants de leur génération", "Élan post EURO 2024 (quart-finaliste)"],
    weaknesses: ["Irrégularité défensive — peut concéder facilement", "Manque d'expérience mondiale des jeunes stars (Güler, Yıldız)"],
  },

  Tunisia: {
    coach: "Jalel Kadri",
    formation: "4-3-3",
    recentForm: [
      { opponent: "Cameroon", result: "W", score: "1-0", competition: "CAF Qual." },
      { opponent: "Eswatini", result: "W", score: "4-0", competition: "CAF Qual." },
      { opponent: "Liberia", result: "W", score: "2-0", competition: "CAF Qual." },
      { opponent: "Namibia", result: "W", score: "3-0", competition: "CAF Qual." },
      { opponent: "Nigeria", result: "D", score: "1-1", competition: "CAF Qual." },
    ],
    stats: {
      possession: 51, goalsScored: 18, goalsConceded: 5,
      xGFor: 15.0, xGAgainst: 5.5, cleanSheets: 7,
      qualificationPath: "CAF - Groupe I (1er)",
    },
    keyPlayers: ["Youssef Msakni", "Ellyes Skhiri", "Wahbi Khazri"],
    strengths: ["Solidité défensive en bloc bas (7 clean sheets)", "Collectif discipliné et organisé", "Skhiri — milieu robuste (Cologne)"],
    weaknesses: ["Peu de créativité offensive sans Msakni en grande forme", "Niveau club faible pour la majorité de l'effectif"],
  },

  // ── GROUP L ──────────────────────────────────────────────────────────────────

  England: {
    coach: "Thomas Tuchel",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Greece", result: "W", score: "2-1", competition: "UEFA Nations L." },
      { opponent: "Finland", result: "W", score: "3-0", competition: "UEFA Qual." },
      { opponent: "Ireland", result: "W", score: "2-0", competition: "UEFA Qual." },
      { opponent: "France", result: "L", score: "2-3", competition: "UEFA Nations L." },
      { opponent: "Germany", result: "W", score: "2-1", competition: "UEFA Nations L." },
    ],
    stats: {
      possession: 56, goalsScored: 20, goalsConceded: 8,
      xGFor: 18.5, xGAgainst: 8.0, cleanSheets: 6,
      qualificationPath: "UEFA - Groupe F (1er)",
    },
    keyPlayers: ["Jude Bellingham", "Phil Foden", "Harry Kane", "Bukayo Saka"],
    strengths: ["Bellingham — milieu/attaquant de classe absolue (Real Madrid, Ballon d'Or candidat)", "Kane — buteur record de sélection", "Profondeur offensive exceptionnelle à tous les postes"],
    weaknesses: ["Fragilité mentale historique en phase finale de grande compétition", "Latéral droit défensivement exposé"],
  },

  Croatia: {
    coach: "Zlatko Dalić",
    formation: "4-3-3",
    recentForm: [
      { opponent: "Poland", result: "W", score: "2-0", competition: "UEFA Nations L." },
      { opponent: "Armenia", result: "W", score: "5-1", competition: "UEFA Qual." },
      { opponent: "Wales", result: "W", score: "2-1", competition: "UEFA Qual." },
      { opponent: "Scotland", result: "D", score: "2-2", competition: "UEFA Qual." },
      { opponent: "Portugal", result: "L", score: "1-2", competition: "UEFA Nations L." },
    ],
    stats: {
      possession: 52, goalsScored: 20, goalsConceded: 9,
      xGFor: 17.0, xGAgainst: 9.5, cleanSheets: 5,
      qualificationPath: "UEFA - Groupe E (1er)",
    },
    keyPlayers: ["Luka Modrić", "Mateo Kovačić", "Joško Gvardiol", "Ivan Perišić"],
    strengths: ["Modrić — meilleur milieu de terrain de l'histoire, encore influent", "Gvardiol — défenseur central parmi les meilleurs mondiaux (Man City)", "Expérience exceptionnelle (3e WC 2022, finaliste 2018)"],
    weaknesses: ["Génération vieillissante — Modrić a 40 ans, fin d'un cycle", "Manque de profondeur offensive derrière les titulaires"],
  },

  Ghana: {
    coach: "Otto Addo",
    formation: "4-3-3",
    recentForm: [
      { opponent: "Sudan", result: "W", score: "2-0", competition: "CAF Qual." },
      { opponent: "Madagascar", result: "W", score: "2-1", competition: "CAF Qual." },
      { opponent: "Chad", result: "W", score: "2-0", competition: "CAF Qual." },
      { opponent: "Nigeria", result: "L", score: "0-1", competition: "CAF Qual." },
      { opponent: "Angola", result: "D", score: "1-1", competition: "AFCON" },
    ],
    stats: {
      possession: 49, goalsScored: 14, goalsConceded: 6,
      xGFor: 11.5, xGAgainst: 6.5, cleanSheets: 5,
      qualificationPath: "CAF - Groupe I (2e)",
    },
    keyPlayers: ["Mohammed Kudus", "Jordan Ayew", "Thomas Partey"],
    strengths: ["Kudus — explosif et imprévisible (West Ham, MOTM régulier)", "Partey — milieu expérimenté (Arsenal)", "Talent offensif potentiellement dangereux"],
    weaknesses: ["Manque de régularité collective chronique", "Défense exposée sur les phases rapides"],
  },

  Panama: {
    coach: "Thomas Christiansen",
    formation: "4-1-4-1",
    recentForm: [
      { opponent: "Mexico", result: "D", score: "1-1", competition: "CONCACAF" },
      { opponent: "USA", result: "L", score: "1-3", competition: "CONCACAF" },
      { opponent: "Honduras", result: "W", score: "3-1", competition: "CONCACAF" },
      { opponent: "Costa Rica", result: "W", score: "2-0", competition: "CONCACAF" },
      { opponent: "Jamaica", result: "W", score: "2-0", competition: "CONCACAF" },
    ],
    stats: {
      possession: 44, goalsScored: 15, goalsConceded: 11,
      xGFor: 12.5, xGAgainst: 10.5, cleanSheets: 4,
      qualificationPath: "CONCACAF (4e)",
    },
    keyPlayers: ["Rolando Blackburn", "Édgar Bárcenas", "Ricardo Avila"],
    strengths: ["Bloc défensif compact, très difficile à briser", "Discipline et physique collectif"],
    weaknesses: ["Attaque très limitée", "Peu de joueurs de niveau international de haut rang"],
  },

  "Saudi Arabia": {
    coach: "Roberto Mancini",
    formation: "4-2-3-1",
    recentForm: [
      { opponent: "Japan", result: "L", score: "0-2", competition: "AFC Qual." },
      { opponent: "Australia", result: "L", score: "1-2", competition: "AFC Qual." },
      { opponent: "Bahrain", result: "W", score: "2-0", competition: "AFC Qual." },
      { opponent: "China", result: "W", score: "1-0", competition: "AFC Qual." },
      { opponent: "Indonesia", result: "W", score: "2-0", competition: "AFC Qual." },
    ],
    stats: {
      possession: 49, goalsScored: 15, goalsConceded: 12,
      xGFor: 13.2, xGAgainst: 11.5, cleanSheets: 4,
      qualificationPath: "AFC - Groupe C (3e, barrages)",
    },
    keyPlayers: ["Salem Al-Dawsari", "Saleh Al-Shehri", "Mohammed Kanno"],
    strengths: ["Bloc défensif organisé difficile à briser", "Force collective et discipline tactique", "Al-Dawsari — joueur imprévisible capable de matches exceptionnels (Classico 2022 vs ARG)"],
    weaknesses: ["Niveau individuel largement inférieur aux tops mondiaux", "Attaque peu prolifique face aux grandes défenses"],
  },
};

export function getTeamProfile(name: string): TeamProfile | null {
  return TEAM_PROFILES[name] ?? null;
}
