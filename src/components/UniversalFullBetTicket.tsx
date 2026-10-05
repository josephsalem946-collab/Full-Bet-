import React from 'react';

export interface UniversalTicketProps {
  ticketNumber: string;
  dateTime: string;
  playerId: string;
  status: string;
  category: 'Paris sportifs combinés' | 'Paris sports' | 'Casino' | 'Borlette';
  selections: { label: string; details: string }[];
  coteOrMultiplier: string | number;
  totalStake: number;
  potentialWin: number;
  securityCode: string;
  formatType?: '80mm' | '58mm' | 'A4';
}

export const UniversalFullBetTicket: React.FC<UniversalTicketProps> = ({
  ticketNumber,
  dateTime,
  playerId,
  status,
  category,
  selections,
  coteOrMultiplier,
  totalStake,
  potentialWin,
  securityCode,
  formatType = '80mm',
}) => {
  // Ajustement de la largeur selon le format d'imprimante sélectionné
  const widthClass = formatType === '58mm' ? 'w-[58mm]' : formatType === '80mm' ? 'w-[80mm]' : 'w-full max-w-2xl';

  return (
    <div className={`bg-white text-black p-3 mx-auto font-mono text-xs border border-gray-300 shadow-md ${widthClass}`}>
      
      {/* 1. Informations Générales & Foto Logo nan tèt fich la */}
      <div className="text-center border-b-2 border-black pb-2 mb-2 flex flex-col items-center">
        <div className="mb-1.5 flex items-center justify-center">
          <img
            src="/logo1.png"
            alt="FULL BET Logo"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.indexOf('logo1.png') !== -1) {
                target.src = '/logo.png';
              }
            }}
            className="w-14 h-14 object-contain rounded-full border border-gray-400 shadow-xs"
          />
        </div>
        <h1 className="text-lg font-extrabold tracking-wider leading-none">FULL BET</h1>
        <p className="text-[10px] font-semibold text-gray-800 mt-0.5">Compte Gmail: fullbet509@gmail.com</p>
      </div>

      {/* 2. Détails du Ticket */}
      <div className="border-b border-dashed border-gray-500 pb-2 mb-2 space-y-0.5">
        <div className="flex justify-between"><span>Numéro de ticket (Tikè #):</span> <span className="font-bold">{ticketNumber}</span></div>
        <div className="flex justify-between"><span>Date et heure (Dat / Lè):</span> <span>{dateTime}</span></div>
        <div className="flex justify-between"><span>ID du joueur (ID Jouè):</span> <span>{playerId}</span></div>
        <div className="flex justify-between"><span>Statut (Estati):</span> <span className="font-bold">{status}</span></div>
        <div className="flex justify-between"><span>Catégorie:</span> <span className="font-semibold">{category}</span></div>
      </div>

      {/* 3. Sélections du Pari (Lòd kronolojik / pa seleksyon) */}
      <div className="border-b border-dashed border-gray-500 pb-2 mb-2">
        <p className="font-bold underline text-[11px] mb-1">Sélections du Pari :</p>
        <p className="text-[10px] text-gray-700 italic mb-1">Enfòmasyon ak detay sou tout sa kliyan an chwazi jwe.</p>
        <ul className="space-y-1.5">
          {selections.map((sel, idx) => (
            <li key={idx} className="border-b border-dotted border-gray-300 pb-1 text-[11px]">
              <div className="flex justify-between font-bold">
                <span>{idx + 1}. {sel.label}</span>
              </div>
              <div className="flex justify-between text-gray-800 text-[10px] pl-2">
                <span className="italic">Choix :</span>
                <span className="font-semibold text-black">{sel.details}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. Mise et Gains */}
      <div className="border-b border-dashed border-gray-500 pb-2 mb-2 space-y-0.5">
        <div className="flex justify-between"><span>Cote / Multiplicateur :</span> <span className="font-bold">{coteOrMultiplier}</span></div>
        <div className="flex justify-between"><span>Mise totale (Total Miz) :</span> <span className="font-bold">{totalStake} HTG</span></div>
        <div className="flex justify-between text-sm font-extrabold text-black"><span>Gain potentiel (Gain Potansyèl) :</span> <span>{potentialWin} HTG</span></div>
      </div>

      {/* 5. Sécurité et Validité */}
      <div className="text-[9px] text-gray-600 space-y-1 pt-1">
        <p className="flex justify-between"><span>Numéro de ticket :</span> <span className="font-bold text-black">{ticketNumber}</span></p>
        <p className="flex justify-between"><span>Code de sécurité :</span> <span className="font-bold text-black">{securityCode}</span></p>
        <p className="mt-1"><strong>Conditions :</strong> Le ticket est valable pendant 60 jours après le tirage. Aucun paiement ne sera effectué sans le ticket original.</p>
        <p className="text-center font-semibold pt-1">Support : fullbet509@gmail.com</p>
        <p className="text-center font-bold text-black pt-1">GAMINGHUB POS • JOUEZ RESPONSABLE (18+)</p>
      </div>

    </div>
  );
};

export default UniversalFullBetTicket;
