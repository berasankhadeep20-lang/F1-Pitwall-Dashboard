import React from 'react';
import { getDriverStandings, getLastRaceResults, getFastestLaps } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useMultiF1Data } from '../hooks/useF1Data';

function StatBox({ label, value, sub, color }) {
  return (
    <div className="f1-card p-4 flex-1 min-w-0 f1-card-hover">
      <p className="text-f1muted font-mono text-xs uppercase tracking-widest mb-1">{label}</p>
      <p className="font-display font-black text-2xl text-white leading-tight truncate" style={color ? { color } : {}}>
        {value ?? '—'}
      </p>
      {sub && <p className="text-f1muted font-mono text-xs mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

export default function StatsBar() {
  const { season } = useApp();
  const { data, loading } = useMultiF1Data({
    standings: () => getDriverStandings(season),
    race: () => getLastRaceResults(season),
    fastest: () => getFastestLaps(season, 'last'),
  }, [season], 30_000);

  if (loading) return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="f1-card p-4 flex-1 min-w-32 h-20 shimmer" />
      ))}
    </div>
  );

  const leader = data.standings?.[0];
  const p2 = data.standings?.[1];
  const gap = leader && p2 ? parseInt(leader.points) - parseInt(p2.points) : null;
  const lastRace = data.race;
  const winner = lastRace?.Results?.[0];
  const fastLap = data.fastest?.[0];

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 animate-slide-up">
      <StatBox
        label="WDC Leader"
        value={leader?.Driver?.code || leader?.Driver?.familyName || '—'}
        sub={`${leader?.points ?? 0} pts · Gap: ${gap !== null ? `${gap}pts` : '—'}`}
        color="#E10600"
      />
      <StatBox
        label="Last Race Winner"
        value={winner?.Driver?.code || winner?.Driver?.familyName || '—'}
        sub={lastRace?.raceName ?? '—'}
      />
      <StatBox
        label="Last Race"
        value={lastRace ? `R${lastRace.round}` : '—'}
        sub={lastRace?.Circuit?.Location?.country ?? '—'}
      />
      <StatBox
        label="Fastest Lap"
        value={fastLap?.FastestLap?.Time?.time ?? '—'}
        sub={`${fastLap?.Driver?.code ?? '—'} · Lap ${fastLap?.FastestLap?.lap ?? '—'}`}
        color="#a855f7"
      />
    </div>
  );
}
