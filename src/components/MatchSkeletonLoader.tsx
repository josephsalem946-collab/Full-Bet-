import React from 'react';

interface MatchSkeletonCardProps {
  index?: number;
}

export const MatchSkeletonCard: React.FC<MatchSkeletonCardProps> = ({ index = 0 }) => {
  const team1Widths = ['w-36 sm:w-44', 'w-40 sm:w-48', 'w-32 sm:w-40', 'w-44 sm:w-52'];
  const team2Widths = ['w-32 sm:w-40', 'w-36 sm:w-44', 'w-40 sm:w-48', 'w-28 sm:w-36'];
  const leagueWidths = ['w-24', 'w-32', 'w-28', 'w-36'];

  const t1Width = team1Widths[index % team1Widths.length];
  const t2Width = team2Widths[index % team2Widths.length];
  const lWidth = leagueWidths[index % leagueWidths.length];

  return (
    <article
      className="match-card relative overflow-hidden animate-pulse"
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-200/60 to-transparent animate-[shimmer_1.8s_infinite]" />

      <div className="match-header">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`h-3 ${lWidth} bg-slate-200 rounded`} />
          <div className="h-3 w-14 bg-slate-100 rounded" />
        </div>
        <div className="h-5 w-14 bg-slate-200 rounded-full ml-2 shrink-0" />
      </div>

      <div className="teams-container">
        <div className="flex items-center justify-between gap-3">
          <div className={`h-4 ${t1Width} bg-slate-200 rounded`} />
          <div className="h-6 w-8 bg-slate-100 rounded-lg shrink-0" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className={`h-4 ${t2Width} bg-slate-200 rounded`} />
          <div className="h-6 w-8 bg-slate-100 rounded-lg shrink-0" />
        </div>
      </div>

      <div className="mt-2 pt-2">
        <div className="h-2.5 w-28 bg-slate-200 rounded mb-2" />
        <div className="odds-grid">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-12 bg-slate-100 border border-slate-200 rounded-xl p-2 flex flex-col items-center justify-center gap-1"
            >
              <div className="h-2.5 w-8 bg-slate-200 rounded" />
              <div className="h-3.5 w-10 bg-slate-300 rounded" />
            </div>
          ))}
        </div>
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
  message = 'Chajman match ak kòt an dirèk...'
}) => {
  return (
    <div
      className="space-y-3"
      role="status"
      aria-label={message}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <MatchSkeletonCard key={`match-skeleton-${idx}`} index={idx} />
      ))}
    </div>
  );
};
