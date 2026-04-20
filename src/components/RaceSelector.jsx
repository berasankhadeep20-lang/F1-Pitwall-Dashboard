import React, { useEffect, useState } from 'react';
import { getRaceSchedule } from '../utils/api';
import { useApp } from '../context/AppContext';

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

export default function RaceSelector() {
  const { season, selectedRound, setSelectedRound } = useApp();
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getRaceSchedule(season)
      .then(r => {
        setRaces(r);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [season]);

  // Completed races only for selection
  const completed = races.filter(r => new Date(r.date) <= new Date());
  const upcoming = races.filter(r => new Date(r.date) > new Date());

  const selectedRace = selectedRound === 'last'
    ? completed[completed.length - 1]
    : races.find(r => r.round === String(selectedRound));

  return (
    <div className="f1-card p-3 flex flex-wrap items-center gap-3 border-l-2 border-l-f1red">
      {/* Label */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-f1red" />
        <span className="text-f1muted font-mono text-xs uppercase tracking-widest">Viewing Race</span>
      </div>

      {/* Race dropdown */}
      <div className="flex-1 min-w-48">
        <select
          value={selectedRound}
          onChange={e => setSelectedRound(e.target.value === 'last' ? 'last' : parseInt(e.target.value))}
          disabled={loading}
          className="w-full bg-black border border-f1border text-white text-sm font-display px-3 py-1.5 rounded focus:outline-none focus:border-f1red cursor-pointer disabled:opacity-50 transition-colors"
        >
          <option value="last">
            {loading ? 'Loading...' : `Latest Race${completed.length ? ` — R${completed[completed.length - 1]?.round} ${completed[completed.length - 1]?.raceName?.replace(' Grand Prix', ' GP')}` : ''}`}
          </option>

          {/* Completed races group */}
          {completed.length > 0 && (
            <optgroup label="── Completed ──────────────">
              {[...completed].reverse().map(race => (
                <option key={race.round} value={race.round}>
                  {getFlag(race.Circuit?.Location?.country)} R{race.round} — {race.raceName.replace(' Grand Prix', ' GP')} ({race.date})
                </option>
              ))}
            </optgroup>
          )}

          {/* Upcoming races group (disabled) */}
          {upcoming.length > 0 && (
            <optgroup label="── Upcoming ───────────────">
              {upcoming.map(race => (
                <option key={race.round} value={race.round} disabled>
                  {getFlag(race.Circuit?.Location?.country)} R{race.round} — {race.raceName.replace(' Grand Prix', ' GP')} ({race.date})
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Selected race info pill */}
      {selectedRace && (
        <div className="hidden md:flex items-center gap-2 shrink-0 bg-f1border/50 rounded px-3 py-1.5">
          <span className="text-lg">{getFlag(selectedRace.Circuit?.Location?.country)}</span>
          <div>
            <p className="text-white font-display font-semibold text-xs leading-tight">
              {selectedRace.Circuit?.circuitName}
            </p>
            <p className="text-f1muted font-mono text-[10px]">
              {selectedRace.Circuit?.Location?.locality}, {selectedRace.Circuit?.Location?.country}
            </p>
          </div>
        </div>
      )}

      {/* Sprint badge */}
      {selectedRace?.Sprint && (
        <span className="shrink-0 text-[10px] font-mono text-orange-400 border border-orange-400/30 px-2 py-1 rounded">
          🏃 Sprint Weekend
        </span>
      )}
    </div>
  );
}
