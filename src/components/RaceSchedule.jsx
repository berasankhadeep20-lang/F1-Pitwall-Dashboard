import React, { useMemo } from 'react';
import { getRaceSchedule } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

const FLAG_MAP = {
  'Bahrain': '🇧🇭', 'Saudi Arabia': '🇸🇦', 'Australia': '🇦🇺', 'Japan': '🇯🇵',
  'China': '🇨🇳', 'Miami': '🇺🇸', 'Emilia': '🇮🇹', 'Monaco': '🇲🇨',
  'Canada': '🇨🇦', 'Spain': '🇪🇸', 'Austria': '🇦🇹', 'Great Britain': '🇬🇧',
  'Hungary': '🇭🇺', 'Belgium': '🇧🇪', 'Netherlands': '🇳🇱', 'Italy': '🇮🇹',
  'Azerbaijan': '🇦🇿', 'Singapore': '🇸🇬', 'United States': '🇺🇸', 'Mexico': '🇲🇽',
  'São Paulo': '🇧🇷', 'Las Vegas': '🇺🇸', 'Qatar': '🇶🇦', 'Abu Dhabi': '🇦🇪',
};

function getFlag(country) {
  const key = Object.keys(FLAG_MAP).find(k => country?.includes(k));
  return FLAG_MAP[key] || '🏁';
}

function RaceStatusBadge({ date, hasSprint }) {
  const raceDate = new Date(date);
  const now = new Date();
  const diff = raceDate - now;
  const daysDiff = Math.ceil(diff / 86400000);

  if (daysDiff < -1) return (
    <span className="text-f1muted font-mono text-xs px-2 py-0.5 bg-f1border rounded">Done</span>
  );
  if (daysDiff <= 7 && daysDiff >= -1) return (
    <span className="text-green-400 font-mono text-xs px-2 py-0.5 bg-green-900/20 border border-green-800/30 rounded animate-pulse">
      {daysDiff <= 0 ? 'This Weekend!' : `In ${daysDiff}d`}
    </span>
  );
  return (
    <span className="text-f1muted font-mono text-xs px-2 py-0.5 bg-f1border rounded">
      In {daysDiff}d
    </span>
  );
}

export default function RaceSchedule() {
  const { season } = useApp();
  const { data, loading, error } = useF1Data(
    () => getRaceSchedule(season),
    [season],
    300_000
  );

  const now = new Date();

  if (loading) return <LoadingCard rows={8} />;
  if (error) return <ErrorCard message={error} />;
  if (!data?.length) return <ErrorCard message="No schedule available" />;

  const nextRaceIdx = data.findIndex(r => new Date(r.date) >= now);

  return (
    <div className="f1-card overflow-hidden animate-slide-up">
      <div className="p-4 border-b border-f1border">
        <SectionHeader title="Race Calendar" subtitle={`${data.length} races`} accent />
      </div>

      <div className="divide-y divide-f1border/50">
        {data.map((race, i) => {
          const isPast = new Date(race.date) < now;
          const isNext = i === nextRaceIdx;
          const hasSprint = !!race.Sprint;

          return (
            <div
              key={race.round}
              className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-f1border/20 ${
                isNext ? 'bg-f1red/5 border-l-2 border-l-f1red' : ''
              } ${isPast ? 'opacity-50' : ''}`}
            >
              {/* Round number */}
              <div className="text-f1muted font-mono text-xs w-6 text-center shrink-0">
                {race.round}
              </div>

              {/* Flag */}
              <span className="text-xl shrink-0">{getFlag(race.Circuit?.Location?.country)}</span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-white text-sm truncate">
                    {race.raceName.replace(' Grand Prix', ' GP')}
                  </span>
                  {hasSprint && (
                    <span className="shrink-0 text-[10px] font-mono text-orange-400 border border-orange-400/30 px-1 rounded">
                      Sprint
                    </span>
                  )}
                </div>
                <div className="text-f1muted font-mono text-xs">
                  {race.Circuit?.circuitName} · {race.date}
                </div>
              </div>

              {/* Status */}
              <div className="shrink-0">
                <RaceStatusBadge date={race.date} hasSprint={hasSprint} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
