// FULLBET.COM — Sportsbook Engine & Odds Simulation
const MATCHES_DATA = [
  {
    id: 'm1',
    league: 'UEFA Ligue des Champions',
    country: 'Europe',
    home: 'Real Madrid',
    away: 'Manchester City',
    isLive: true,
    minute: "68'",
    homeScore: 2,
    awayScore: 2,
    odds: { home: 2.85, draw: 3.20, away: 2.45 }
  },
  {
    id: 'm2',
    league: 'Premier League',
    country: 'Angleterre',
    home: 'Arsenal FC',
    away: 'Liverpool FC',
    isLive: true,
    minute: "34'",
    homeScore: 1,
    awayScore: 0,
    odds: { home: 1.95, draw: 3.60, away: 3.80 }
  },
  {
    id: 'm3',
    league: 'La Liga',
    country: 'Espagne',
    home: 'FC Barcelone',
    away: 'Atlético Madrid',
    isLive: false,
    time: '21:00 Ce soir',
    odds: { home: 1.78, draw: 3.50, away: 4.60 }
  },
  {
    id: 'm4',
    league: 'NBA Basketball',
    country: 'USA',
    home: 'Boston Celtics',
    away: 'LA Lakers',
    isLive: false,
    time: '01:30 Demain',
    odds: { home: 1.55, draw: 15.0, away: 2.50 }
  },
  {
    id: 'm5',
    league: 'Ligue 1 McDonald\'s',
    country: 'France',
    home: 'Paris Saint-Germain',
    away: 'Olympique de Marseille',
    isLive: false,
    time: '20:45 Dimanche',
    odds: { home: 1.42, draw: 4.80, away: 7.20 }
  },
  {
    id: 'm6',
    league: 'UFC 308',
    country: 'MMA',
    home: 'Ilia Topuria',
    away: 'Max Holloway',
    isLive: false,
    time: '23:00 Samedi',
    odds: { home: 1.82, draw: 35.0, away: 2.05 }
  }
];

function renderMatches(filter = 'all', sport = 'all') {
  const container = document.getElementById('matchesList');
  if (!container) return;

  container.innerHTML = '';

  const filtered = MATCHES_DATA.filter(m => {
    if (filter === 'live' && !m.isLive) return false;
    if (filter === 'upcoming' && m.isLive) return false;
    return true;
  });

  filtered.forEach(m => {
    const isHomeSel = window.isBetSelected(m.id, '1');
    const isDrawSel = window.isBetSelected(m.id, 'N');
    const isAwaySel = window.isBetSelected(m.id, '2');

    const card = document.createElement('div');
    card.className = 'match-card';
    card.id = `match-${m.id}`;
    card.innerHTML = `
      <div class="match-header">
        <span class="league-name">🏆 ${m.league} (${m.country})</span>
        ${m.isLive ? `
          <div class="live-badge">
            <span class="live-dot"></span>
            <span>LIVE ${m.minute}</span>
          </div>
        ` : `
          <span style="font-size: 11px; color: #94a3b8;">🕒 ${m.time}</span>
        `}
      </div>

      <div class="match-teams-row">
        <div class="teams-list">
          <div class="team-item">
            <span class="team-name">${m.home}</span>
            ${m.isLive ? `<span class="team-score">${m.homeScore}</span>` : ''}
          </div>
          <div class="team-item">
            <span class="team-name">${m.away}</span>
            ${m.isLive ? `<span class="team-score">${m.awayScore}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="odds-grid-3">
        <button class="odd-box ${isHomeSel ? 'selected' : ''}" onclick="window.toggleBet('${m.id}', '${m.home} vs ${m.away}', '1', ${m.odds.home})">
          <span class="odd-lbl">1 (${m.home.slice(0, 3).toUpperCase()})</span>
          <span class="odd-val">${m.odds.home.toFixed(2)}</span>
        </button>
        <button class="odd-box ${isDrawSel ? 'selected' : ''}" onclick="window.toggleBet('${m.id}', '${m.home} vs ${m.away}', 'N', ${m.odds.draw})">
          <span class="odd-lbl">NUL</span>
          <span class="odd-val">${m.odds.draw.toFixed(2)}</span>
        </button>
        <button class="odd-box ${isAwaySel ? 'selected' : ''}" onclick="window.toggleBet('${m.id}', '${m.home} vs ${m.away}', '2', ${m.odds.away})">
          <span class="odd-lbl">2 (${m.away.slice(0, 3).toUpperCase()})</span>
          <span class="odd-val">${m.odds.away.toFixed(2)}</span>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Fluctuate odds slightly every 5 seconds to simulate real-time live trading
setInterval(() => {
  MATCHES_DATA.forEach(m => {
    if (m.isLive) {
      const delta = (Math.random() - 0.5) * 0.08;
      m.odds.home = Math.max(1.10, +(m.odds.home + delta).toFixed(2));
      m.odds.away = Math.max(1.10, +(m.odds.away - delta).toFixed(2));
    }
  });
  renderMatches(window.currentFilter || 'all');
}, 5000);

window.renderMatches = renderMatches;
