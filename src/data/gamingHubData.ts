// =========================================================================
// FULL BET (Module: GamingHub Haïti) - Configuration & Dataset Oficial
// Basé sur le nouveau schéma JSON fourni par l'utilisateur
// =========================================================================

export interface PlatformConfig {
  name: string;
  slug: string;
  module: string;
  country_code: string;
  currency: {
    code: string;
    symbol: string;
    name: string;
  };
  theme: {
    mode: string;
    background_primary: string;
    background_secondary: string;
    accent_color: string;
  };
}

export interface UserAccountConfig {
  user_id: string;
  username: string;
  balance: {
    amount: number;
    formatted: string;
    masked_value: string;
    currency: string;
    is_privacy_enabled: boolean;
  };
  quick_actions: {
    id: string;
    label: string;
    short_label: string;
    type: string;
    action_url: string;
    is_primary: boolean;
  }[];
}

export interface CategorySummaryItem {
  id: string;
  name: string;
  active_items_count: number;
  badge_color: 'cyan' | 'emerald' | 'purple' | string;
  available_draws?: string[];
  popular_sports?: string[];
  quick_access_games?: string[];
  action_url: string;
}

export interface ActiveTicketItem {
  ticket_id: string;
  category_id: 'bolet_loto' | 'paryaj_espotif' | 'kazino_jwèt' | string;
  category_label: string;
  lottery_name?: string;
  game_type?: string;
  sport?: string;
  bet_type?: string;
  selections_count?: number;
  bet_details: {
    combination?: string;
    primary_number?: string;
    secondary_number?: string;
    digits?: string[];
    description?: string;
    matches?: {
      match: string;
      selection: string;
      odds: number;
    }[];
  };
  financials: {
    stake_amount: number;
    stake_formatted: string;
    potential_win: number;
    potential_win_formatted: string;
    multiplier?: number;
    total_odds?: number;
  };
  status: 'valide' | 'active' | 'won' | 'lost';
  timestamp: string;
}

export interface BottomNavigationItem {
  id: string;
  label: string;
  french_label: string;
  icon: string;
  badge_color: string;
  action_url: string;
}

export interface FullBetGamingHubData {
  $schema: string;
  platform: PlatformConfig;
  user_account: UserAccountConfig;
  dashboard_summary: {
    active_tickets_indicator: {
      badge_text: string;
      count: number;
      icon_type: string;
      status: string;
      pulse_animation: boolean;
    };
    categories_summary: {
      title: string;
      categories: CategorySummaryItem[];
    };
  };
  active_tickets_section: {
    title: string;
    total_active: number;
    tickets: ActiveTicketItem[];
  };
  bottom_navigation: BottomNavigationItem[];
}

// -------------------------------------------------------------------------
// DONNÉES OFFICIELLES DU NOUVEAU SCHÉMA "FULL BET"
// -------------------------------------------------------------------------
export const FULLBET_GAMINGHUB_CONFIG: FullBetGamingHubData = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  platform: {
    name: "FULL BET",
    slug: "fullbet-ht",
    module: "GamingHub Haïti",
    country_code: "HT",
    currency: {
      code: "HTG",
      symbol: "HTG",
      name: "Goud Ayisyen"
    },
    theme: {
      mode: "dark",
      background_primary: "#0D131F",
      background_secondary: "#121927",
      accent_color: "#10B981"
    }
  },
  user_account: {
    user_id: "USR-HT-89241",
    username: "Player_509",
    balance: {
      amount: 12480.00,
      formatted: "12 480,00 HTG",
      masked_value: "•••••••• HTG",
      currency: "HTG",
      is_privacy_enabled: false
    },
    quick_actions: [
      {
        id: "depot",
        label: "Dépôt",
        short_label: "+ De...",
        type: "deposit",
        action_url: "/wallet/deposit",
        is_primary: true
      }
    ]
  },
  dashboard_summary: {
    active_tickets_indicator: {
      badge_text: "3 FICH AKTIF",
      count: 3,
      icon_type: "flash",
      status: "live",
      pulse_animation: true
    },
    categories_summary: {
      title: "Rezime 3 Kategori Jwèt Yo",
      categories: [
        {
          id: "bolet_loto",
          name: "Bòlèt & Loto",
          active_items_count: 2,
          badge_color: "cyan",
          available_draws: ["New York", "Florida", "Georgia"],
          action_url: "/bolet"
        },
        {
          id: "paryaj_espotif",
          name: "Paryaj Espòtif",
          active_items_count: 1,
          badge_color: "emerald",
          popular_sports: ["Foutbòl", "Basket", "Tenis"],
          action_url: "/sports"
        },
        {
          id: "kazino_jwèt",
          name: "Kazino & Aviator",
          active_items_count: 0,
          badge_color: "purple",
          quick_access_games: ["Aviator", "Roulette", "Blackjack", "Spaceman"],
          action_url: "/casino"
        }
      ]
    }
  },
  active_tickets_section: {
    title: "Tikè Ki Valide Kounye A",
    total_active: 3,
    tickets: [
      {
        ticket_id: "TCK-NY-2025-0981",
        category_id: "bolet_loto",
        category_label: "Bòlèt & Loto",
        lottery_name: "New York Midi",
        game_type: "Maryaj",
        bet_details: {
          combination: "21 x 78",
          primary_number: "21",
          secondary_number: "78"
        },
        financials: {
          stake_amount: 150.00,
          stake_formatted: "150 HTG",
          potential_win: 15000.00,
          potential_win_formatted: "15 000 HTG",
          multiplier: 100.0
        },
        status: "valide",
        timestamp: "2025-05-18T12:05:00-04:00"
      },
      {
        ticket_id: "TCK-FL-2025-0442",
        category_id: "bolet_loto",
        category_label: "Bòlèt & Loto",
        lottery_name: "Florida Aswè",
        game_type: "Loto 3 Chif",
        bet_details: {
          combination: "452",
          digits: ["4", "5", "2"]
        },
        financials: {
          stake_amount: 100.00,
          stake_formatted: "100 HTG",
          potential_win: 50000.00,
          potential_win_formatted: "50 000 HTG",
          multiplier: 500.0
        },
        status: "valide",
        timestamp: "2025-05-18T19:30:00-04:00"
      },
      {
        ticket_id: "TCK-SPT-2025-8819",
        category_id: "paryaj_espotif",
        category_label: "Paryaj Espòtif",
        sport: "Foutbòl",
        bet_type: "Kòmbine (Miltip)",
        selections_count: 3,
        bet_details: {
          description: "3 Matchs seleksyone",
          matches: [
            {
              match: "Real Madrid vs Valencia",
              selection: "Real Madrid Gayan",
              odds: 1.45
            },
            {
              match: "PSG vs Marseille",
              selection: "PSG Gayan",
              odds: 1.60
            },
            {
              match: "Man City vs Chelsea",
              selection: "Man City Gayan",
              odds: 2.09
            }
          ]
        },
        financials: {
          stake_amount: 500.00,
          stake_formatted: "500 HTG",
          total_odds: 4.85,
          potential_win: 2425.00,
          potential_win_formatted: "2 425 HTG"
        },
        status: "valide",
        timestamp: "2025-05-18T14:15:00-04:00"
      }
    ]
  },
  bottom_navigation: [
    {
      id: "retre",
      label: "Retrè",
      french_label: "Retrait",
      icon: "arrow-down-circle",
      badge_color: "rose",
      action_url: "/wallet/withdraw"
    },
    {
      id: "istorik",
      label: "Istorik",
      french_label: "Historique",
      icon: "clock-history",
      badge_color: "amber",
      action_url: "/tickets/history"
    },
    {
      id: "verifye",
      label: "Verifye",
      french_label: "Vérification / Scanner",
      icon: "qr-code-scan",
      badge_color: "cyan",
      action_url: "/tickets/verify"
    }
  ]
};

// -------------------------------------------------------------------------
// BACKWARD-COMPATIBILITY EXPORTS & PRINTING SUPPORT
// -------------------------------------------------------------------------
export interface GamingHubTicket {
  ticket_id: string;
  category: 'bolet_loto' | 'paryaj_espotif' | 'kazino_jwèt' | string;
  category_id?: string;
  category_name?: string;
  category_label: string;
  draw_name?: string;
  status: 'active' | 'in_play' | 'validated' | 'VALID' | 'valide' | 'won' | 'lost';
  created_at: string;
  draw_time?: string;
  game_title: string;
  play_type?: string;
  amount_staked?: number;
  potential_win?: number;
  matches?: {
    match: string;
    selection: string;
    odds: number;
    match_time?: string;
  }[];
  draw_details?: {
    lottery_city: string;
    draw_session: string;
    draw_date: string;
    draw_time?: string;
  };
  plays?: {
    play_type: string;
    numbers: string[];
    stake_htg: number;
    potential_gain_htg: number;
  }[];
  stake_htg: number;
  total_odds?: number;
  multiplier_target?: number;
  potential_gain_htg: number;
  security_code: string;
  barcode_data: string;
  allow_quick_print: boolean;
}

export const AGENCY_INFO = {
  name: "FULL BET - GamingHub Haïti",
  pos_id: "POS-PORT-AU-PRINCE-04",
  address: "Delmas, Pòtoprens, Ayiti",
  support_phone: "+509 •••• ••••",
  ticket_validity_days: 60
};

export const SUPPORTED_PRINT_FORMATS = [
  {
    format_id: "pos_thermal_80mm",
    format_name: "Enprimant Tèmik POS 80mm",
    roll_width_mm: 80,
    printable_area_mm: 72,
    font_family: "monospace",
    recommended_for: "Boutik, Kès, Ajan bòlèt ak POS mobil"
  },
  {
    format_id: "pos_thermal_58mm",
    format_name: "Enprimant Tèmik Pòtab 58mm",
    roll_width_mm: 58,
    printable_area_mm: 48,
    font_family: "monospace",
    recommended_for: "Machin tèmik Bluetooth / POS ti modèl"
  },
  {
    format_id: "standard_paper",
    format_name: "Papye Estanda (A4 / Reçu biwo)",
    roll_width_mm: 210,
    printable_area_mm: 190,
    font_family: "sans-serif",
    recommended_for: "Enprimant biwo oswa rapò PDF"
  }
];

export const GAMINGHUB_APP_METADATA = {
  platform_name: FULLBET_GAMINGHUB_CONFIG.platform.name,
  slug: FULLBET_GAMINGHUB_CONFIG.platform.slug,
  module: FULLBET_GAMINGHUB_CONFIG.platform.module,
  country_code: FULLBET_GAMINGHUB_CONFIG.platform.country_code,
  currency: FULLBET_GAMINGHUB_CONFIG.platform.currency.code,
  currency_name: FULLBET_GAMINGHUB_CONFIG.platform.currency.name,
  theme: FULLBET_GAMINGHUB_CONFIG.platform.theme
};

export const GAMING_CATEGORIES_SUMMARY = {
  title: FULLBET_GAMINGHUB_CONFIG.dashboard_summary.categories_summary.title,
  total_active_tickets: FULLBET_GAMINGHUB_CONFIG.dashboard_summary.active_tickets_indicator.count,
  categories: FULLBET_GAMINGHUB_CONFIG.dashboard_summary.categories_summary.categories.map(c => {
    let icon_symbol = "🎲";
    let icon = "Dices";
    let desc = "";

    if (c.id === 'bolet_loto') {
      icon_symbol = "🎲";
      icon = "Dices";
      desc = c.available_draws?.join(', ') || "New York, Florida, Georgia";
    } else if (c.id === 'paryaj_espotif') {
      icon_symbol = "⚽";
      icon = "Trophy";
      desc = c.popular_sports?.join(', ') || "Foutbòl, Basket, Tenis";
    } else {
      icon_symbol = "🎰";
      icon = "Flame";
      desc = c.quick_access_games?.join(', ') || "Aviator, Roulette, Blackjack";
    }

    return {
      id: c.id,
      name: c.name,
      slug: c.action_url.replace('/', ''),
      icon,
      icon_symbol,
      active_ticket_count: c.active_items_count,
      badge_color: c.badge_color,
      badge_style: {
        color: c.badge_color,
        tailwind_classes: c.badge_color === 'cyan'
          ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30'
          : c.badge_color === 'emerald'
          ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
          : 'text-purple-400 bg-purple-400/10 border-purple-400/30'
      },
      description: desc,
      action_url: c.action_url
    };
  })
};

// Map the new tickets for printing and list display
export const INITIAL_GAMINGHUB_TICKETS: GamingHubTicket[] = [
  {
    ticket_id: "TCK-NY-2025-0981",
    category: "bolet_loto",
    category_id: "bolet_loto",
    category_name: "Bòlèt & Loto",
    category_label: "Bòlèt & Loto",
    draw_name: "New York Midi",
    play_type: "Maryaj (21 x 78)",
    amount_staked: 150.00,
    potential_win: 15000.00,
    status: "valide",
    created_at: "2025-05-18T12:05:00-04:00",
    draw_time: "2025-05-18T12:05:00-04:00",
    game_title: "New York Midi - Maryaj (21 x 78)",
    stake_htg: 150.00,
    multiplier_target: 100.0,
    potential_gain_htg: 15000.00,
    security_code: "NY09-SEC-2178",
    barcode_data: "*TCK-NY-2025-0981*",
    allow_quick_print: true,
    draw_details: {
      lottery_city: "New York",
      draw_session: "Midi",
      draw_date: "2025-05-18",
      draw_time: "12:05:00"
    },
    plays: [
      {
        play_type: "Maryaj",
        numbers: ["21", "78"],
        stake_htg: 150.00,
        potential_gain_htg: 15000.00
      }
    ]
  },
  {
    ticket_id: "TCK-FL-2025-0442",
    category: "bolet_loto",
    category_id: "bolet_loto",
    category_name: "Bòlèt & Loto",
    category_label: "Bòlèt & Loto",
    draw_name: "Florida Aswè",
    play_type: "Loto 3 Chif (452)",
    amount_staked: 100.00,
    potential_win: 50000.00,
    status: "valide",
    created_at: "2025-05-18T19:30:00-04:00",
    draw_time: "2025-05-18T19:30:00-04:00",
    game_title: "Florida Aswè - Loto 3 Chif (452)",
    stake_htg: 100.00,
    multiplier_target: 500.0,
    potential_gain_htg: 50000.00,
    security_code: "FL04-SEC-0452",
    barcode_data: "*TCK-FL-2025-0442*",
    allow_quick_print: true,
    draw_details: {
      lottery_city: "Florida",
      draw_session: "Aswè",
      draw_date: "2025-05-18",
      draw_time: "19:30:00"
    },
    plays: [
      {
        play_type: "Loto 3 Chif",
        numbers: ["4", "5", "2"],
        stake_htg: 100.00,
        potential_gain_htg: 50000.00
      }
    ]
  },
  {
    ticket_id: "TCK-SPT-2025-8819",
    category: "paryaj_espotif",
    category_id: "paryaj_espotif",
    category_name: "Paryaj Espòtif",
    category_label: "Paryaj Espòtif",
    draw_name: "Foutbòl - Kòmbine (Miltip)",
    play_type: "3 Matchs seleksyone",
    amount_staked: 500.00,
    potential_win: 2425.00,
    status: "valide",
    created_at: "2025-05-18T14:15:00-04:00",
    draw_time: "2025-05-18T14:15:00-04:00",
    game_title: "Paryaj Espòtif - Kòmbine (3 Matchs)",
    stake_htg: 500.00,
    total_odds: 4.85,
    potential_gain_htg: 2425.00,
    security_code: "SPT8-SEC-8819",
    barcode_data: "*TCK-SPT-2025-8819*",
    allow_quick_print: true,
    matches: [
      {
        match: "Real Madrid vs Valencia",
        selection: "Real Madrid Gayan",
        odds: 1.45,
        match_time: "14:15"
      },
      {
        match: "PSG vs Marseille",
        selection: "PSG Gayan",
        odds: 1.60,
        match_time: "14:15"
      },
      {
        match: "Man City vs Chelsea",
        selection: "Man City Gayan",
        odds: 2.09,
        match_time: "14:15"
      }
    ]
  }
];

export const GAMINGHUB_BOTTOM_NAV = FULLBET_GAMINGHUB_CONFIG.bottom_navigation;
