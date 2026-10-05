export interface SportsBetProConfig {
  app: {
    name: string;
    version: string;
    default_currency: string;
    currency_symbol: string;
    locale: string;
    active_theme: string;
  };
  theme: {
    name: string;
    type: string;
    colors: {
      brand: {
        primary: string;
        primary_bright: string;
        primary_dark: string;
        primary_glow: string;
        on_primary: string;
      };
      background: {
        main: string;
        surface: string;
        card: string;
        coupon: string;
        input: string;
        overlay: string;
      };
      text: {
        primary: string;
        secondary: string;
        muted: string;
        inverse: string;
      };
      borders: {
        subtle: string;
        active: string;
        divider: string;
      };
      status: {
        success: string;
        danger: string;
        warning: string;
        info: string;
        odds_up: string;
        odds_down: string;
      };
    };
    components: {
      bet_slip: {
        badge_color: string;
        badge_text_color: string;
        selection_border_color: string;
        selection_glow: string;
        submit_button: {
          background: string;
          hover_background: string;
          text_color: string;
        };
      };
      odds_button: {
        bg_inactive: string;
        bg_active: string;
        text_inactive: string;
        text_active: string;
        border_inactive: string;
        border_active: string;
      };
    };
  };
  user: {
    id: string;
    username: string;
    email: string;
    wallet: {
      real_balance: number;
      bonus_balance: number;
      currency: string;
      currency_symbol: string;
    };
    settings: {
      odds_format: string;
      quick_bet: boolean;
      default_stake: number;
      accept_odds_fluctuation: boolean;
    };
  };
  sports: {
    id: string;
    name: string;
    icon: string;
    live_events_count: number;
  }[];
  events: {
    id: string;
    sport_id: string;
    league: {
      id: string;
      name: string;
      country: string;
    };
    status: 'LIVE' | 'UPCOMING' | 'FINISHED';
    match_time?: string;
    start_time?: string;
    home_team: {
      id: string;
      name: string;
      score: number;
    };
    away_team: {
      id: string;
      name: string;
      score: number;
    };
    markets: {
      id: string;
      name: string;
      odds: {
        id: string;
        label: string;
        value: number;
        trend?: 'up' | 'down' | 'stable';
        is_selected?: boolean;
        is_active?: boolean;
      }[];
    }[];
  }[];
  bet_slip: {
    is_open: boolean;
    status: string;
    badge: {
      count: number;
      color: string;
      is_visible: boolean;
    };
    bet_type: string;
    selections: {
      selection_id: string;
      event_id: string;
      match_title: string;
      market_name: string;
      chosen_label: string;
      odd_value: number;
      is_live: boolean;
      is_valid: boolean;
    }[];
    calculations: {
      total_odds: number;
      stake: number;
      potential_payout: number;
      potential_net_profit: number;
      bonus_percentage: number;
      bonus_amount: number;
    };
    cta_action: {
      label: string;
      formatted_total: string;
      background_color: string;
      text_color: string;
      is_enabled: boolean;
    };
  };
  bets_history: {
    ticket_id: string;
    date: string;
    status: string;
    stake: number;
    total_odds: number;
    payout: number;
    badge_color: string;
  }[];
}

export const SPORTSBET_PRO_DATA: SportsBetProConfig = {
  app: {
    name: "SportsBet Pro",
    version: "2.4.0",
    default_currency: "EUR",
    currency_symbol: "€",
    locale: "fr-FR",
    active_theme: "dark"
  },
  theme: {
    name: "Dark Emerald Sports",
    type: "dark",
    colors: {
      brand: {
        primary: "#10B981",
        primary_bright: "#00E676",
        primary_dark: "#059669",
        primary_glow: "rgba(16, 185, 129, 0.15)",
        on_primary: "#0F172A"
      },
      background: {
        main: "#0F172A",
        surface: "#1E293B",
        card: "#1E232B",
        coupon: "#18202F",
        input: "#131B28",
        overlay: "rgba(0, 0, 0, 0.8)"
      },
      text: {
        primary: "#FFFFFF",
        secondary: "#94A3B8",
        muted: "#64748B",
        inverse: "#0F172A"
      },
      borders: {
        subtle: "#334155",
        active: "#10B981",
        divider: "#1E293B"
      },
      status: {
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
        info: "#3B82F6",
        odds_up: "#00E676",
        odds_down: "#EF4444"
      }
    },
    components: {
      bet_slip: {
        badge_color: "#10B981",
        badge_text_color: "#0F172A",
        selection_border_color: "#10B981",
        selection_glow: "rgba(16, 185, 129, 0.12)",
        submit_button: {
          background: "#10B981",
          hover_background: "#059669",
          text_color: "#0F172A"
        }
      },
      odds_button: {
        bg_inactive: "#1E293B",
        bg_active: "#10B981",
        text_inactive: "#FFFFFF",
        text_active: "#0F172A",
        border_inactive: "#334155",
        border_active: "#10B981"
      }
    }
  },
  user: {
    id: "usr_78910",
    username: "PariMèt",
    email: "user@example.com",
    wallet: {
      real_balance: 150.00,
      bonus_balance: 25.00,
      currency: "EUR",
      currency_symbol: "€"
    },
    settings: {
      odds_format: "decimal",
      quick_bet: false,
      default_stake: 10.00,
      accept_odds_fluctuation: true
    }
  },
  sports: [
    {
      id: "football",
      name: "Football",
      icon: "soccer",
      live_events_count: 14
    },
    {
      id: "basketball",
      name: "Basketball",
      icon: "basketball",
      live_events_count: 6
    },
    {
      id: "tennis",
      name: "Tennis",
      icon: "tennis-ball",
      live_events_count: 3
    }
  ],
  events: [
    {
      id: "evt_101",
      sport_id: "football",
      league: {
        id: "lg_ucl",
        name: "UEFA Champions League",
        country: "Europe"
      },
      status: "LIVE",
      match_time: "72'",
      home_team: {
        id: "tm_rm",
        name: "Real Madrid",
        score: 2
      },
      away_team: {
        id: "tm_mc",
        name: "Manchester City",
        score: 1
      },
      markets: [
        {
          id: "mkt_1x2",
          name: "Résultat du match (1X2)",
          odds: [
            {
              id: "odd_1",
              label: "1",
              value: 1.65,
              trend: "up",
              is_selected: true,
              is_active: true
            },
            {
              id: "odd_x",
              label: "X",
              value: 3.80,
              trend: "stable",
              is_selected: false,
              is_active: true
            },
            {
              id: "odd_2",
              label: "2",
              value: 4.75,
              trend: "down",
              is_selected: false,
              is_active: true
            }
          ]
        },
        {
          id: "mkt_total_goals",
          name: "Total Buts (Plus/Moins 3.5)",
          odds: [
            {
              id: "odd_over_35",
              label: "Plus de 3.5",
              value: 1.85,
              trend: "stable",
              is_selected: false,
              is_active: true
            },
            {
              id: "odd_under_35",
              label: "Moins de 3.5",
              value: 1.95,
              trend: "stable",
              is_selected: false,
              is_active: true
            }
          ]
        }
      ]
    },
    {
      id: "evt_102",
      sport_id: "football",
      league: {
        id: "lg_liga",
        name: "La Liga",
        country: "Espagne"
      },
      status: "UPCOMING",
      start_time: "2026-09-30T20:00:00Z",
      home_team: {
        id: "tm_fcb",
        name: "FC Barcelone",
        score: 0
      },
      away_team: {
        id: "tm_atm",
        name: "Atlético Madrid",
        score: 0
      },
      markets: [
        {
          id: "mkt_1x2_liga",
          name: "Résultat du match (1X2)",
          odds: [
            {
              id: "odd_fcb_1",
              label: "1",
              value: 1.95,
              trend: "stable",
              is_selected: true,
              is_active: true
            },
            {
              id: "odd_fcb_x",
              label: "X",
              value: 3.40,
              trend: "stable",
              is_selected: false,
              is_active: true
            },
            {
              id: "odd_fcb_2",
              label: "2",
              value: 3.90,
              trend: "stable",
              is_selected: false,
              is_active: true
            }
          ]
        }
      ]
    }
  ],
  bet_slip: {
    is_open: true,
    status: "ACTIVE",
    badge: {
      count: 2,
      color: "#10B981",
      is_visible: true
    },
    bet_type: "COMBINED",
    selections: [
      {
        selection_id: "sel_001",
        event_id: "evt_101",
        match_title: "Real Madrid vs Manchester City",
        market_name: "Résultat du match (1X2)",
        chosen_label: "Real Madrid",
        odd_value: 1.65,
        is_live: true,
        is_valid: true
      },
      {
        selection_id: "sel_002",
        event_id: "evt_102",
        match_title: "FC Barcelone vs Atlético Madrid",
        market_name: "Résultat du match (1X2)",
        chosen_label: "FC Barcelone",
        odd_value: 1.95,
        is_live: false,
        is_valid: true
      }
    ],
    calculations: {
      total_odds: 3.22,
      stake: 20.00,
      potential_payout: 64.40,
      potential_net_profit: 44.40,
      bonus_percentage: 5,
      bonus_amount: 3.22
    },
    cta_action: {
      label: "Valider le coupon",
      formatted_total: "20,00 €",
      background_color: "#10B981",
      text_color: "#0F172A",
      is_enabled: true
    }
  },
  bets_history: [
    {
      ticket_id: "tkt_50412",
      date: "2026-09-28T21:40:00Z",
      status: "WON",
      stake: 10.00,
      total_odds: 2.50,
      payout: 25.00,
      badge_color: "#10B981"
    }
  ]
};
