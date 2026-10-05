export interface FunBetItem {
  id: string;
  category_id: 'all_fun' | 'insolite' | 'player_props' | 'combos';
  category_label: string;
  match: {
    id: string;
    sport: string;
    league: string;
    home_team: string;
    away_team: string;
    start_time: string;
    status: 'upcoming' | 'live' | 'finished';
  };
  title: string;
  description: string;
  badge: {
    text: string;
    color_bg: string;
    color_text: string;
  };
  odds: {
    current: number;
    previous: number;
    is_boosted: boolean;
  };
  market: {
    market_id: string;
    selection_id: string;
    selection_name: string;
    min_stake: number;
    max_stake: number;
    currency: string;
  };
  popularity_score: number;
}

export interface FunBetsSubCategory {
  id: string;
  label: string;
  count: number;
}

export const FUN_BETS_SUB_CATEGORIES: FunBetsSubCategory[] = [
  { id: "all_fun", label: "Tout Fun Bets", count: 18 },
  { id: "insolite", label: "Evènman Ensolit", count: 6 },
  { id: "player_props", label: "Pèfòmans Jwè Espesyal", count: 7 },
  { id: "combos", label: "Konbine Tematik", count: 5 }
];

export const FUN_BETS_ITEMS: FunBetItem[] = [
  {
    id: "fb-201",
    category_id: "insolite",
    category_label: "Evènman Ensolit",
    match: {
      id: "match-8841",
      sport: "Football",
      league: "Ligue 1",
      home_team: "Paris SG",
      away_team: "Marseille",
      start_time: "2026-10-04T20:45:00Z",
      status: "upcoming"
    },
    title: "Selebrasyon Espesyal",
    description: "Nenpòt jwè retire mayo li oswa fè yon sèlfi ak sipòtè yo pandan selebrasyon yon gòl.",
    badge: {
      text: "BOOSTÉ 🔥",
      color_bg: "rgba(239, 68, 68, 0.2)",
      color_text: "#F87171"
    },
    odds: {
      current: 8.50,
      previous: 6.00,
      is_boosted: true
    },
    market: {
      market_id: "mkt-fun-001",
      selection_id: "sel-1",
      selection_name: "Wi",
      min_stake: 1.0,
      max_stake: 100.0,
      currency: "EUR"
    },
    popularity_score: 98
  },
  {
    id: "fb-202",
    category_id: "insolite",
    category_label: "Evènman Ensolit",
    match: {
      id: "match-8842",
      sport: "Football",
      league: "La Liga",
      home_team: "Real Madrid",
      away_team: "FC Barcelone",
      start_time: "2026-10-18T19:00:00Z",
      status: "upcoming"
    },
    title: "Chans / Move Chans",
    description: "Omwen 2 tir ki frape poto oubyen bwa transvèsal nan tout match la.",
    badge: {
      text: "HOT 🎲",
      color_bg: "rgba(245, 158, 11, 0.2)",
      color_text: "#FBBF24"
    },
    odds: {
      current: 5.75,
      previous: 5.75,
      is_boosted: false
    },
    market: {
      market_id: "mkt-fun-002",
      selection_id: "sel-1",
      selection_name: "Plis pase 1.5 poto/transvèsal",
      min_stake: 1.0,
      max_stake: 250.0,
      currency: "EUR"
    },
    popularity_score: 94
  },
  {
    id: "fb-203",
    category_id: "player_props",
    category_label: "Pèfòmans Jwè Espesyal",
    match: {
      id: "match-8843",
      sport: "Football",
      league: "Premier League",
      home_team: "Manchester City",
      away_team: "Liverpool",
      start_time: "2026-10-25T16:30:00Z",
      status: "upcoming"
    },
    title: "Super Ranplasan",
    description: "Yon jwè ki antre sou ban an make yon gòl nan mwens pase 5 minit apre antre li.",
    badge: {
      text: "MEGA ODD ⚡",
      color_bg: "rgba(168, 85, 247, 0.2)",
      color_text: "#C084FC"
    },
    odds: {
      current: 12.00,
      previous: 9.50,
      is_boosted: true
    },
    market: {
      market_id: "mkt-fun-003",
      selection_id: "sel-1",
      selection_name: "Wi",
      min_stake: 1.0,
      max_stake: 50.0,
      currency: "EUR"
    },
    popularity_score: 89
  },
  {
    id: "fb-204",
    category_id: "combos",
    category_label: "Konbine Tematik",
    match: {
      id: "match-8844",
      sport: "Basketball",
      league: "NBA",
      home_team: "Golden State Warriors",
      away_team: "LA Lakers",
      start_time: "2026-10-29T02:00:00Z",
      status: "upcoming"
    },
    title: "Fou Lanmou Pou 3 Pwen",
    description: "Tou de ekip yo mete omwen 15 tir 3 pwen chak, epi gen plis pase 225 pwen total.",
    badge: {
      text: "COMBO 🎯",
      color_bg: "rgba(59, 130, 246, 0.2)",
      color_text: "#60A5FA"
    },
    odds: {
      current: 4.20,
      previous: 4.20,
      is_boosted: false
    },
    market: {
      market_id: "mkt-fun-004",
      selection_id: "sel-1",
      selection_name: "Wi",
      min_stake: 1.0,
      max_stake: 300.0,
      currency: "EUR"
    },
    popularity_score: 91
  }
];

export const NAVIGATION_BAR_CONFIG = {
  theme: {
    mode: "dark",
    background_color: "#0D111A",
    border_color: "#1E2638"
  },
  tabs: [
    {
      id: "all",
      label: "Tous",
      is_special: false,
      badge: null,
      count: 142,
      endpoint: "/api/v1/bets?filter=all"
    },
    {
      id: "live",
      label: "En Direct",
      is_special: false,
      badge: "LIVE",
      count: 14,
      endpoint: "/api/v1/bets?filter=live"
    },
    {
      id: "upcoming",
      label: "À Venir",
      is_special: false,
      badge: null,
      count: 48,
      endpoint: "/api/v1/bets?filter=upcoming"
    },
    {
      id: "fun-bets",
      label: "Fun Bets",
      is_special: true,
      badge: "NEW",
      count: 18,
      style: {
        gradient_start: "#7E22CE",
        gradient_end: "#4F46E5",
        text_color: "#F3E8FF",
        border_color: "rgba(168, 85, 247, 0.4)",
        glow_shadow: "0 4px 14px rgba(126, 34, 206, 0.35)"
      },
      endpoint: "/api/v1/bets?filter=fun-bets"
    }
  ]
};
