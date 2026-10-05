import React, { useState, useRef } from 'react';
import {
  Ticket,
  Calendar,
  Sparkles,
  Printer,
  History,
  CheckCircle2,
  Trash2,
  Plus,
  Coins,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BorletteTicket, BorletteDrawResult, UserProfile, BorletteTicketItem } from '../types';
import { playClickSound, playBetPlacedSound, playWinSound } from '../utils/audio';
import { serverPlaceBorletteBet } from '../utils/api';
import { ScrollToTopButton } from './ScrollToTopButton';
import { useFeatures } from '../context/FeaturesContext';
import { formaterEtMasquer } from '../utils/securityMasking';

interface BorletteScreenProps {
  user: UserProfile;
  results: BorletteDrawResult[];
  tickets: BorletteTicket[];
  onPlaceBorletteTicket: (ticket: BorletteTicket) => void;
  onOpenWallet: () => void;
}

export const BorletteScreen: React.FC<BorletteScreenProps> = ({
  user,
  results,
  tickets,
  onPlaceBorletteTicket,
  onOpenWallet
}) => {
  const { ticketIssuerDefault, isGameActive, getGameMaintenanceMessage } = useFeatures();
  const [activeTab, setActiveTab] = useState<'play' | 'results' | 'myTickets'>('play');
  const [selectedDraw, setSelectedDraw] = useState<'ny-eve' | 'fl-eve' | 'ny-mid' | 'fl-mid'>('ny-eve');
  const [gameMode, setGameMode] = useState<'borlette' | 'mariage' | 'lotto3' | 'lotto4'>('borlette');
  
  // Inputs
  const [inputNum1, setInputNum1] = useState('');
  const [inputNum2, setInputNum2] = useState('');
  const [stakePerItem, setStakePerItem] = useState<number>(50);
  const [basketItems, setBasketItems] = useState<BorletteTicketItem[]>([]);
  const [printedTicket, setPrintedTicket] = useState<BorletteTicket | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const drawTitles = {
    'ny-eve': 'New York Soir (20:30)',
    'fl-eve': 'Florida Soir (21:45)',
    'ny-mid': 'New York Midi (14:30)',
    'fl-mid': 'Florida Midi (13:30)'
  };

  const handleAddNumberToBasket = () => {
    if (gameMode === 'borlette') {
      if (!inputNum1 || inputNum1.length < 2) {
        alert("Veuillez saisir un numéro à 2 chiffres (00 à 99).");
        return;
      }
      playClickSound();
      setBasketItems(prev => [
        ...prev,
        {
          type: 'borlette',
          numbers: [inputNum1.padStart(2, '0')],
          stake: stakePerItem,
          potentialWin: stakePerItem * 50 // Lot 1
        }
      ]);
      setInputNum1('');
    } else if (gameMode === 'mariage') {
      if (!inputNum1 || !inputNum2 || inputNum1.length < 2 || inputNum2.length < 2) {
        alert("Veuillez saisir deux numéros à 2 chiffres pour le Mariage.");
        return;
      }
      playClickSound();
      setBasketItems(prev => [
        ...prev,
        {
          type: 'mariage',
          numbers: [inputNum1.padStart(2, '0'), inputNum2.padStart(2, '0')],
          stake: stakePerItem,
          potentialWin: stakePerItem * 1000
        }
      ]);
      setInputNum1('');
      setInputNum2('');
    } else if (gameMode === 'lotto3') {
      if (!inputNum1 || inputNum1.length < 3) {
        alert("Veuillez saisir un numéro à 3 chiffres (ex: 412).");
        return;
      }
      playClickSound();
      setBasketItems(prev => [
        ...prev,
        {
          type: 'lotto3',
          numbers: [inputNum1.padStart(3, '0')],
          stake: stakePerItem,
          potentialWin: stakePerItem * 500
        }
      ]);
      setInputNum1('');
    } else if (gameMode === 'lotto4') {
      if (!inputNum1 || inputNum1.length < 4) {
        alert("Veuillez saisir un numéro à 4 chiffres (ex: 4128).");
        return;
      }
      playClickSound();
      setBasketItems(prev => [
        ...prev,
        {
          type: 'lotto4',
          numbers: [inputNum1.padStart(4, '0')],
          stake: stakePerItem,
          potentialWin: stakePerItem * 5000
        }
      ]);
      setInputNum1('');
    }
  };

  const handleQuickAdd = (numStr: string) => {
    playClickSound();
    if (gameMode === 'borlette') {
      setInputNum1(numStr);
    } else if (gameMode === 'mariage') {
      if (!inputNum1) setInputNum1(numStr);
      else setInputNum2(numStr);
    }
  };

  const totalBasketStake = basketItems.reduce((acc, it) => acc + it.stake, 0);

  const handleValidateTicket = () => {
    if (basketItems.length === 0) return;
    if (user.balanceHTG < totalBasketStake) {
      alert("Solde insuffisant pour valider cette fiche de Borlette.");
      onOpenWallet();
      return;
    }

    playBetPlacedSound();
    confetti({ particleCount: 50, spread: 60 });

    const newTicket: BorletteTicket = {
      id: `BOR-${Date.now().toString().slice(-6)}`,
      drawId: selectedDraw,
      drawName: drawTitles[selectedDraw],
      date: new Date().toLocaleDateString('fr-FR'),
      items: [...basketItems],
      totalStake: totalBasketStake,
      status: 'pending',
      placedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    try {
      // Validation & sanitization côté serveur
      basketItems.forEach(item => {
        serverPlaceBorletteBet({
          drawId: selectedDraw,
          drawName: drawTitles[selectedDraw],
          gameType: item.type,
          numbers: item.numbers,
          stake: item.stake,
          multiplier: item.type === 'mariage' ? 1000 : 50,
          potentialWin: item.potentialWin
        }).catch(err => console.warn('[Server Borlette Bet Sync]', err));
      });
    } catch (e) {
      console.warn(e);
    }

    onPlaceBorletteTicket(newTicket);
    setBasketItems([]);
    setActiveTab('myTickets');
  };

  return (
    <div ref={containerRef} className="relative min-h-[calc(100vh-3.5rem)] pb-28 pt-2">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-4">
        
        {/* Banner Borlette Showcase */}
        <div className="rounded-2xl bg-gradient-to-r from-[#0c2419] via-[#0f3322] to-[#0c2419] p-4 sm:p-5 border border-emerald-500/20 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>BORLETTE OFFICIELLE HAÏTI • TIRAGES NY & FL</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display mt-1">
                Fiches Borlette, Mariage & Lotto
              </h2>
              <p className="text-xs text-slate-300">
                Tirages officiels garantis • Mariage 1000x • Lot 1 50x • Paiement instantané
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('results');
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 text-xs font-bold border border-emerald-700/50 flex items-center gap-1.5"
              >
                <History className="w-4 h-4" />
                <span>Résultats Récents</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center justify-between bg-[#0e1627] p-1.5 rounded-2xl">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                playClickSound();
                setActiveTab('play');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'play'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Jouer une Fiche
            </button>
            <button
              onClick={() => {
                playClickSound();
                setActiveTab('myTickets');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'myTickets'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mes Fiches ({tickets.length})
            </button>
            <button
              onClick={() => {
                playClickSound();
                setActiveTab('results');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'results'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Derniers Tirages
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden sm:block pr-2">
            Solde : <strong className="text-emerald-400">{user.balanceHTG.toLocaleString()} HTG</strong>
          </div>
        </div>

        {/* TAB 1: PLAY BORLETTE */}
        {activeTab === 'play' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Left: Configuration Form */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* 1. Choose Draw */}
              <div className="bg-[#0e1627] p-4 rounded-2xl space-y-2.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  1. Sélectionner le Tirage Officiel
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(drawTitles) as (keyof typeof drawTitles)[]).map(key => (
                    <button
                      key={key}
                      onClick={() => {
                        playClickSound();
                        setSelectedDraw(key);
                      }}
                      className={`p-3 rounded-xl text-left transition-all ${
                        selectedDraw === key
                          ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400'
                          : 'bg-[#141f36] text-slate-300 hover:bg-[#1b2a4a]'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-emerald-200 block">
                        {key.startsWith('ny') ? 'New York' : 'Florida'}
                      </span>
                      <span className="text-xs font-bold block">
                        {key.endsWith('eve') ? 'Soir' : 'Midi'}
                      </span>
                      <span className="text-[10px] text-slate-300 block mt-0.5 font-mono">
                        {key === 'ny-eve' ? '20:30' : key === 'fl-eve' ? '21:45' : key === 'ny-mid' ? '14:30' : '13:30'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Choose Game Type */}
              <div className="bg-[#0e1627] p-4 rounded-2xl space-y-2.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  2. Type de Pari Borlette
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'borlette', label: 'Borlette (00-99)', mult: '50x' },
                    { id: 'mariage', label: 'Mariage (xx × yy)', mult: '1000x' },
                    { id: 'lotto3', label: 'Lotto 3 chiffres', mult: '500x' },
                    { id: 'lotto4', label: 'Lotto 4 chiffres', mult: '5000x' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        playClickSound();
                        setGameMode(m.id as any);
                        setInputNum1('');
                        setInputNum2('');
                      }}
                      className={`p-3 rounded-xl text-left transition-all ${
                        gameMode === m.id
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-[#141f36] text-slate-300 hover:bg-[#1b2a4a]'
                      }`}
                    >
                      <span className="text-xs font-bold block">{m.label}</span>
                      <span className="text-[11px] font-mono-num text-emerald-200 font-bold block">
                        Paiement {m.mult}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Number Input Fields */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {gameMode === 'borlette' && (
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          Numéro (00 - 99)
                        </label>
                        <input
                          type="text"
                          maxLength={2}
                          placeholder="Ex: 42"
                          value={inputNum1}
                          onChange={(e) => setInputNum1(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-[#16213c] text-white font-mono-num font-black text-xl text-center py-2 rounded-xl border border-slate-700 focus:border-emerald-500 outline-hidden"
                        />
                      </div>
                    )}

                    {gameMode === 'mariage' && (
                      <>
                        <div className="flex-1 min-w-[100px]">
                          <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                            1er Numéro
                          </label>
                          <input
                            type="text"
                            maxLength={2}
                            placeholder="Ex: 24"
                            value={inputNum1}
                            onChange={(e) => setInputNum1(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-[#16213c] text-white font-mono-num font-black text-xl text-center py-2 rounded-xl border border-slate-700"
                          />
                        </div>
                        <span className="text-xl font-bold text-slate-500 pt-5">×</span>
                        <div className="flex-1 min-w-[100px]">
                          <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                            2ème Numéro
                          </label>
                          <input
                            type="text"
                            maxLength={2}
                            placeholder="Ex: 58"
                            value={inputNum2}
                            onChange={(e) => setInputNum2(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-[#16213c] text-white font-mono-num font-black text-xl text-center py-2 rounded-xl border border-slate-700"
                          />
                        </div>
                      </>
                    )}

                    {(gameMode === 'lotto3' || gameMode === 'lotto4') && (
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          Numéro Lotto ({gameMode === 'lotto3' ? '3 chiffres' : '4 chiffres'})
                        </label>
                        <input
                          type="text"
                          maxLength={gameMode === 'lotto3' ? 3 : 4}
                          placeholder={gameMode === 'lotto3' ? 'Ex: 412' : 'Ex: 8942'}
                          value={inputNum1}
                          onChange={(e) => setInputNum1(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-[#16213c] text-white font-mono-num font-black text-xl text-center py-2 rounded-xl border border-slate-700 focus:border-emerald-500 outline-hidden"
                        />
                      </div>
                    )}

                    {/* Stake per combination */}
                    <div className="w-32">
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                        Mise (HTG)
                      </label>
                      <input
                        type="number"
                        min="10"
                        step="10"
                        value={stakePerItem}
                        onChange={(e) => setStakePerItem(Math.max(10, Number(e.target.value)))}
                        className="w-full bg-[#16213c] text-emerald-400 font-mono-num font-bold text-base text-center py-2 rounded-xl border border-slate-700"
                      />
                    </div>

                    <div className="pt-5">
                      <button
                        onClick={handleAddNumberToBasket}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Ajouter</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Pick Buttons (Popular Haitian Numbers) */}
                  <div className="pt-2">
                    <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                      Numéros Populaires :
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['07', '18', '24', '33', '42', '55', '68', '77', '89', '99'].map(num => (
                        <button
                          key={num}
                          onClick={() => handleQuickAdd(num)}
                          className="w-9 h-9 rounded-lg bg-[#182442] hover:bg-[#233560] text-cyan-300 font-mono-num font-bold text-xs flex items-center justify-center transition-colors"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right: Basket / Fiche Preview */}
            <div className="bg-[#0e1627] p-4 rounded-2xl flex flex-col justify-between shadow-xl space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">Fiche en Cours</h3>
                  </div>
                  {basketItems.length > 0 && (
                    <button
                      onClick={() => setBasketItems([])}
                      className="text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Vider</span>
                    </button>
                  )}
                </div>

                <div className="py-2 text-xs text-slate-400">
                  Tirage : <strong className="text-white">{drawTitles[selectedDraw]}</strong>
                </div>

                {/* Items in Basket */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {basketItems.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      Aucun numéro ajouté. Saisissez vos numéros à gauche pour composer votre fiche.
                    </div>
                  ) : (
                    basketItems.map((item, index) => (
                      <div
                        key={index}
                        className="p-2.5 rounded-xl bg-[#141f36] flex items-center justify-between text-xs odd-active-underline"
                      >
                        <div>
                          <span className="font-bold text-emerald-400 font-mono-num text-sm mr-2">
                            {item.numbers.join(' × ')}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            ({item.type})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-num font-bold text-slate-200">
                            {item.stake} HTG
                          </span>
                          <button
                            onClick={() => setBasketItems(prev => prev.filter((_, i) => i !== index))}
                            className="text-slate-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Basket Footer & Checkout */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Total Combinations</span>
                  <span className="font-bold">{basketItems.length}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white">
                  <span>Mise Totale</span>
                  <span className="font-mono-num text-emerald-400 font-black">
                    {totalBasketStake.toLocaleString()} HTG
                  </span>
                </div>

                <button
                  onClick={handleValidateTicket}
                  disabled={basketItems.length === 0}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 transition-all active:scale-98 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valider la Fiche ({totalBasketStake} HTG)</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: MY BORLETTE TICKETS */}
        {activeTab === 'myTickets' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Historique de Mes Fiches de Borlette
            </div>

            {tickets.length === 0 ? (
              <div className="p-8 text-center bg-[#0e1627] rounded-2xl text-slate-400 text-xs">
                Vous n'avez pas encore joué de fiche de Borlette.
              </div>
            ) : (
              tickets.map(ticket => (
                <div
                  key={ticket.id}
                  className="p-4 bg-[#0e1627] rounded-2xl shadow-md space-y-3 odd-active-underline"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-num font-bold text-emerald-400">{ticket.id}</span>
                      <span className="text-slate-400">• {ticket.drawName}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-950 text-cyan-400 border border-blue-800">
                      En attente du tirage
                    </span>
                  </div>

                  {/* Ticket items */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ticket.items.map((it, idx) => (
                      <div key={idx} className="p-2 bg-[#131d33] rounded-lg text-xs">
                        <div className="font-bold text-white font-mono-num">
                          {it.numbers.join(' × ')}
                        </div>
                        <div className="text-[10px] text-slate-400 flex justify-between mt-1">
                          <span>{it.type}</span>
                          <span className="text-emerald-300">{it.stake} HTG</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Mise : <strong className="text-white">{ticket.totalStake} HTG</strong>
                    </span>
                    <button
                      onClick={() => setPrintedTicket(ticket)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Reçu Officiel</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: PAST RESULTS */}
        {activeTab === 'results' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Derniers Résultats Officiels des Tirages
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map(res => (
                <div
                  key={res.id}
                  className="bg-[#0e1627] rounded-2xl p-4 shadow-lg space-y-3 border-0"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{res.drawName}</span>
                      {res.isLatest && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 animate-pulse">
                          Dernier Tirage
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {res.date} • {res.time}
                    </span>
                  </div>

                  {/* 3 Winning Lots */}
                  <div className="grid grid-cols-3 gap-2 py-2">
                    <div className="p-3 rounded-xl bg-gradient-to-b from-amber-950/40 to-slate-900 border border-amber-500/40 text-center">
                      <span className="text-[10px] uppercase font-bold text-amber-400 block">
                        1er Lot
                      </span>
                      <span className="text-2xl font-black font-mono-num text-white">
                        {res.lot1}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        2ème Lot
                      </span>
                      <span className="text-2xl font-black font-mono-num text-slate-200">
                        {res.lot2}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        3ème Lot
                      </span>
                      <span className="text-2xl font-black font-mono-num text-slate-200">
                        {res.lot3}
                      </span>
                    </div>
                  </div>

                  {/* Mariages gagnants */}
                  {res.mariageWin && res.mariageWin.length > 0 && (
                    <div className="text-xs text-slate-300">
                      <span className="text-slate-500 mr-2">Mariages Gagnants :</span>
                      <span className="font-mono-num font-bold text-emerald-400">
                        {res.mariageWin.join(' • ')}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Printable Voucher Modal */}
        {printedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
            <div className="bg-[#0f172a] rounded-2xl p-5 max-w-sm w-full border border-slate-700 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <span className="font-display font-black text-cyan-400 tracking-wider text-base">
                  {ticketIssuerDefault?.displayIssuerName || 'GAIN CASH • FICHE OFFICIELLE'}
                </span>
                <button
                  onClick={() => setPrintedTicket(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-black/60 rounded-xl font-mono text-xs text-slate-300 space-y-1.5 border border-slate-800">
                <div className="text-center font-bold text-amber-400 border-b border-slate-800 pb-1">
                  {ticketIssuerDefault?.headerMessage || '★ REÇU OFFICIEL DE JEU BORLETTE ★'}
                </div>
                <div>Réf Fiche : <strong>{printedTicket.id}</strong></div>
                <div>Émetteur : {ticketIssuerDefault?.displayIssuerName || 'Banque Centrale Express'}</div>
                <div>Tél Succursale : {formaterEtMasquer(ticketIssuerDefault?.phoneContact || '+509 3215 3281', 'telephone')}</div>
                <div>Tirage : {printedTicket.drawName}</div>
                <div>Date & Heure : {printedTicket.placedAt}</div>
                <div className="pt-2 border-t border-slate-800">
                  <div className="font-bold text-white mb-1">Combinaisons :</div>
                  {printedTicket.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-emerald-300">
                      <span>{it.numbers.join(' × ')} ({it.type})</span>
                      <span>{it.stake} HTG</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white">
                  <span>TOTAL PAYÉ :</span>
                  <span>{printedTicket.totalStake} HTG</span>
                </div>
                <div className="text-[10px] text-slate-400 text-center pt-2 italic">
                  {ticketIssuerDefault?.footerMessage || 'Validation immédiate • Fiche certifiée Full Bet (fullbet.com)'}
                </div>
              </div>

              <button
                onClick={() => {
                  window.print();
                  setPrintedTicket(null);
                }}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer la Fiche de Caisse</span>
              </button>
            </div>
          </div>
        )}

      </div>

      <ScrollToTopButton targetRef={containerRef} />
    </div>
  );
};
