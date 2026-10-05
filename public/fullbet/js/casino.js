// FULLBET.COM — Mini-Games: Full Fly Crash & 777 Slots
let crashMultiplier = 1.00;
let crashRunning = false;
let crashInterval = null;
let crashTarget = 2.50;

function launchCrashGame() {
  const canvas = document.getElementById('crashCanvas');
  const multText = document.getElementById('crashMultDisplay');
  const launchBtn = document.getElementById('crashLaunchBtn');
  const cashoutBtn = document.getElementById('crashCashoutBtn');
  if (!canvas || !multText) return;

  const ctx = canvas.getContext('2d');
  crashMultiplier = 1.00;
  crashRunning = true;
  crashTarget = Math.max(1.10, +(1 / (1 - Math.random() * 0.92)).toFixed(2));

  launchBtn.style.display = 'none';
  cashoutBtn.style.display = 'inline-block';
  cashoutBtn.innerText = `CASH OUT (x1.00)`;

  let startTime = Date.now();

  if (crashInterval) clearInterval(crashInterval);

  crashInterval = setInterval(() => {
    let elapsed = (Date.now() - startTime) / 1000;
    crashMultiplier = +(1.00 + Math.pow(elapsed * 0.65, 1.8)).toFixed(2);

    multText.innerText = `x${crashMultiplier.toFixed(2)}`;
    cashoutBtn.innerText = `CASH OUT (x${crashMultiplier.toFixed(2)})`;

    // Draw Rocket Curve
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 30);
    let endX = Math.min(canvas.width - 40, 30 + elapsed * 60);
    let endY = Math.max(30, (canvas.height - 30) - Math.pow(elapsed * 12, 1.4));
    ctx.quadraticCurveTo(canvas.width / 2, canvas.height - 30, endX, endY);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Rocket Icon
    ctx.font = '22px sans-serif';
    ctx.fillText('🚀', endX - 10, endY - 6);

    if (crashMultiplier >= crashTarget) {
      // Crashed!
      clearInterval(crashInterval);
      crashRunning = false;
      multText.innerText = `💥 CRASH @ x${crashTarget.toFixed(2)}`;
      multText.style.color = '#ef4444';
      launchBtn.style.display = 'inline-block';
      cashoutBtn.style.display = 'none';
      setTimeout(() => { multText.style.color = '#00e5ff'; }, 2000);
    }
  }, 60);
}

function cashoutCrash() {
  if (!crashRunning) return;
  clearInterval(crashInterval);
  crashRunning = false;
  const multText = document.getElementById('crashMultDisplay');
  const launchBtn = document.getElementById('crashLaunchBtn');
  const cashoutBtn = document.getElementById('crashCashoutBtn');

  const stake = 100;
  const win = Math.round(stake * crashMultiplier);
  window.updateBalance(win);

  multText.innerText = `🎉 GAGNÉ x${crashMultiplier.toFixed(2)} (+${win} HTG)`;
  multText.style.color = '#10b981';
  launchBtn.style.display = 'inline-block';
  cashoutBtn.style.display = 'none';

  setTimeout(() => { multText.style.color = '#00e5ff'; }, 3000);
}

window.launchCrashGame = launchCrashGame;
window.cashoutCrash = cashoutCrash;
