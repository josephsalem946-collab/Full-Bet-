// FULLBET.COM — Core App Logic (Betslip, Wallet, Tickets)
let userBalance = 14250.00;
let selectedBets = [];
window.currentFilter = 'all';

function updateBalanceDisplay() {
  const el = document.getElementById('userBalance');
  if (el) el.innerText = `${userBalance.toLocaleString('fr-FR')} HTG`;
}

window.updateBalance = function(amount) {
  userBalance += amount;
  updateBalanceDisplay();
};

window.isBetSelected = function(matchId, selection) {
  return selectedBets.some(b => b.matchId === matchId && b.selection === selection);
};

window.toggleBet = function(matchId, matchTitle, selection, rate) {
  const index = selectedBets.findIndex(b => b.matchId === matchId && b.selection === selection);
  if (index !== -1) {
    selectedBets.splice(index, 1);
  } else {
    // Remove conflicting selections on the same match
    selectedBets = selectedBets.filter(b => b.matchId !== matchId);
    selectedBets.push({ matchId, matchTitle, selection, rate });
  }
  renderBetslip();
  window.renderMatches(window.currentFilter);
};

function renderBetslip() {
  const container = document.getElementById('betslipList');
  const countEl = document.getElementById('betslipCount');
  const totalOddsEl = document.getElementById('totalOdds');
  const potentialWinEl = document.getElementById('potentialWin');
  const stakeInput = document.getElementById('stakeInput');
  const stake = parseFloat(stakeInput ? stakeInput.value : 100) || 100;

  if (countEl) countEl.innerText = selectedBets.length;
  if (!container) return;

  container.innerHTML = '';
  if (selectedBets.length === 0) {
    container.innerHTML = '<div style="color: #64748b; font-size: 12px; text-align: center; padding: 20px;">Cliquez sur une cote pour ajouter un pari</div>';
    if (totalOddsEl) totalOddsEl.innerText = '1.00';
    if (potentialWinEl) potentialWinEl.innerText = '0 HTG';
    return;
  }

  let totalOdds = 1.0;
  selectedBets.forEach((b, i) => {
    totalOdds *= b.rate;
    const row = document.createElement('div');
    row.className = 'bet-item-row';
    row.innerHTML = `
      <div style="flex: 1; min-width: 0; padding-right: 8px;">
        <div style="font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${b.matchTitle}</div>
        <div style="font-size: 11px; color: #94a3b8;">Choix : <strong style="color: #00e5ff;">${b.selection}</strong></div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-family: monospace; font-weight: 900; color: #f59e0b;">${b.rate.toFixed(2)}</span>
        <button onclick="window.toggleBet('${b.matchId}', '', '${b.selection}', 0)" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px;">✕</button>
      </div>
    `;
    container.appendChild(row);
  });

  // Full Bet Combiné Bonus (+5% for 3+ selections)
  if (selectedBets.length >= 3) {
    totalOdds *= 1.05;
  }

  if (totalOddsEl) totalOddsEl.innerText = totalOdds.toFixed(2);
  if (potentialWinEl) potentialWinEl.innerText = `${Math.round(stake * totalOdds).toLocaleString()} HTG`;
}

window.placeBetSlip = function() {
  if (selectedBets.length === 0) {
    alert("Votre coupon est vide !");
    return;
  }
  const stakeInput = document.getElementById('stakeInput');
  const stake = parseFloat(stakeInput.value) || 100;

  if (userBalance < stake) {
    alert("Solde insuffisant pour valider ce pari.");
    openModal('walletModal');
    return;
  }

  userBalance -= stake;
  updateBalanceDisplay();

  const ticketId = 'FB-' + Math.floor(100000 + Math.random() * 900000);
  alert(`✅ Ticket Full Bet validé avec succès !\nRéf : ${ticketId}\nMise : ${stake} HTG`);
  selectedBets = [];
  renderBetslip();
  window.renderMatches(window.currentFilter);
};

window.openModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
};

document.addEventListener('DOMContentLoaded', () => {
  updateBalanceDisplay();
  if (window.renderMatches) window.renderMatches('all');
  renderBetslip();

  const stakeInput = document.getElementById('stakeInput');
  if (stakeInput) {
    stakeInput.addEventListener('input', renderBetslip);
  }
});
