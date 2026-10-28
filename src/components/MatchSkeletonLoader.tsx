import React from 'react';

interface MatchSkeletonCardProps {
  index?: number;
}

export const MatchSkeletonCard: React.FC<MatchSkeletonCardProps> = ({ index = 0 }) => {
  // Vary team name and league widths slightly for a realistic placeholder feel
  const team1Widths = ['w-36 sm:w-48', 'w-40 sm:w-52', 'w-32 sm:w-44', 'w-44 sm:w-56'];
  const team2Widths = ['w-32 sm:w-44', 'w-36 sm:w-48', 'w-40 sm:w-52', 'w-28 sm:w-40'];
  const leagueWidths = ['w-24', 'w-32', 'w-28', 'w-36'];

  const t1Width = team1Widths[index % team1Widths.length];
  const t2Width = team2Widths[index % team2Widths.length];
  const lWidth = leagueWidths[index % leagueWidths.length];

  return (
    <article
      className="match-card relative overflow-hidden bg-gradient-to-br from-[#0e1628] to-[#141f38] border border-slate-700/60 shadow-[0_10px_25px_rgba(0,0,0,0.3)] animate-pulse"
      aria-hidden="true"
    >
      {/* Shimmer sweep effect */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-[shimmer_1.8s_infinite]" />

      {/* 1. Header (League, Country, Time / Live badge) */}
      <div className="match-header flex items-center justify-between pb-2 mb-2 border-b border-slate-700/40">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* League Icon & Name */}
          <div className="w-5 h-5 rounded-full bg-slate-700/80 shrink-0" />
          <div className={`h-3.5 ${lWidth} bg-slate-700/90 rounded-md`} />
          <span className="text-slate-600">•</span>
          <div className="h-3 w-14 bg-slate-800/90 rounded-md" />
        </div>

        {/* Live or Time badge skeleton */}
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          <div className="w-2 h-2 rounded-full bg-slate-700" />
          <div className="h-4 w-12 bg-slate-700/80 rounded-md" />
        </div>
      </div>

      {/* 2. Teams Container */}
      <div className="teams-container my-3 space-y-2.5">
        {/* Home Team */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-4 h-4 rounded-full bg-slate-700/70 shrink-0" />
            <div className={`h-4.5 ${t1Width} bg-slate-600/80 rounded-md`} />
          </div>
          <div className="h-5 w-6 bg-slate-800 rounded-md shrink-0 border border-slate-700/60" />
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-4 h-4 rounded-full bg-slate-700/70 shrink-0" />
            <div className={`h-4.5 ${t2Width} bg-slate-600/80 rounded-md`} />
          </div>
          <div className="h-5 w-6 bg-slate-800 rounded-md shrink-0 border border-slate-700/60" />
        </div>
      </div>

      {/* 3. Odds Grid & Market Header */}
      <div className="mt-3 pt-2.5 border-t border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="h-2.5 w-28 bg-slate-700/70 rounded" />
          <div className="h-2.5 w-16 bg-slate-800 rounded" />
        </div>

        {/* 1 X 2 Odds Boxes */}
        <div className="odds-grid grid grid-cols-3 gap-2">
          {/* 1 */}
          <div className="h-13 bg-[#17223b] border border-slate-700/70 rounded-xl p-2 flex flex-col items-center justify-center gap-1 shadow-inner">
            <div className="h-2.5 w-6 bg-slate-600/80 rounded" />
            <div className="h-4 w-11 bg-slate-500/80 rounded" />
            <div className="w-8 h-0.5 bg-amber-500/30 rounded-full mt-0.5" />
          </div>

          {/* X */}
          <div className="h-13 bg-[#17223b] border border-slate-700/70 rounded-xl p-2 flex flex-col items-center justify-center gap-1 shadow-inner">
            <div className="h-2.5 w-6 bg-slate-600/80 rounded" />
            <div className="h-4 w-11 bg-slate-500/80 rounded" />
            <div className="w-8 h-0.5 bg-slate-600/40 rounded-full mt-0.5" />
          </div>

          {/* 2 */}
          <div className="h-13 bg-[#17223b] border border-slate-700/70 rounded-xl p-2 flex flex-col items-center justify-center gap-1 shadow-inner">
            <div className="h-2.5 w-6 bg-slate-600/80 rounded" />
            <div className="h-4 w-11 bg-slate-500/80 rounded" />
            <div className="w-8 h-0.5 bg-emerald-500/30 rounded-full mt-0.5" />
          </div>
        </div>
      </div>

      {/* 4. Sub-markets toggle bar preview */}
      <div className="mt-3 pt-2 flex items-center justify-between text-slate-600">
        <div className="h-3 w-32 bg-slate-800 rounded" />
        <div className="w-4 h-4 rounded bg-slate-800" />
      </div>
    </article>
  );
};

interface MatchesListSkeletonProps {
  count?: number;
  message?: string;
}

export const MatchesListSkeleton: React.FC<MatchesListSkeletonProps> = ({
  count = 4,
  message = 'Chajman done ak cotes an dirèk...'
}) => {
  return (
    <div
      className="matches-list-skeleton flex-1 space-y-3"
      role="status"
      aria-label="Chargement des matchs en cours"
    >
      {/* Micro-indicateur d'activité */}
      <div className="flex items-center justify-center gap-2 py-2 px-3 mx-4 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 font-medium">
        <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
        <span>{message}</span>
      </div>

      {/* Liste des cartes squelettes */}
      {Array.from({ length: count }).map((_, idx) => (
        <MatchSkeletonCard key={`match-skeleton-${idx}`} index={idx} />
      ))}
    </div>
  );
};
