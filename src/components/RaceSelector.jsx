import React, { useEffect, useState } from 'react';
import { getRaceSchedule } from '../utils/api';
import { getSessionsForMeeting, normaliseSessionName, openf1Supported } from '../utils/openf1';
import { useApp, SESSION_LABELS } from '../context/AppContext';

const FLAG_MAP = {
  'Bahrain':'🇧🇭','Saudi Arabia':'🇸🇦','Australia':'🇦🇺','Japan':'🇯🇵',
  'China':'🇨🇳','Miami':'🇺🇸','Emilia':'🇮🇹','Monaco':'🇲🇨',
  'Canada':'🇨🇦','Spain':'🇪🇸','Austria':'🇦🇹','Great Britain':'🇬🇧',
  'Hungary':'🇭🇺','Belgium':'🇧🇪','Netherlands':'🇳🇱','Italy':'🇮🇹',
  'Azerbaijan':'🇦🇿','Singapore':'🇸🇬','United States':'🇺🇸','Mexico':'🇲🇽',
  'São Paulo':'🇧🇷','Las Vegas':'🇺🇸','Qatar':'🇶🇦','Abu Dhabi':'🇦🇪',
};
function flag(country) {
  const k = Object.keys(FLAG_MAP).find(k => country?.includes(k));
  return FLAG_MAP[k] || '🏁';
}

// Session tab order (most recent first, like F1 website)
const SESSION_ORDER = ['race', 'qualifying', 'sprint', 'sq', 'fp3', 'fp2', 'fp1'];

export default function RaceSelector() {
  const {
    season, selectedRound, setSelectedRound,
    selectedSession, setSelectedSession,
    weekendSessions, setWeekendSessions,
  } = useApp();

  const [races, setRaces]           = useState([]);
  const [loadingRaces, setLoadingRaces]   = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Load race schedule
  useEffect(() => {
    setLoadingRaces(true);
    getRaceSchedule(season)
      .then(r => { setRaces(r); setLoadingRaces(false); })
      .catch(() => setLoadingRaces(false));
  }, [season]);

  // When round changes, fetch real sessions from OpenF1
  useEffect(() => {
    if (!races.length) return;
    const race = selectedRound === 'last'
      ? races.filter(r => new Date(r.date) <= new Date()).at(-1)
      : races.find(r => r.round === String(selectedRound));
    if (!race) return;

    const year = season === 'current' ? new Date().getFullYear() : parseInt(season);
    const circuitId = race.Circuit?.circuitId ?? '';

    setLoadingSessions(true);
    setWeekendSessions(null);

    (openf1Supported(year) ? getSessionsForMeeting(year, circuitId) : Promise.resolve(null))
      .then(result => {
        if (!result?.sessions?.length) {
          // Fallback: basic sessions (no practice data)
          setWeekendSessions([
            { id: 'race', label: 'Race', available: true, sessionKey: null },
            { id: 'qualifying', label: 'Qualifying', available: true, sessionKey: null },
          ]);
          return;
        }
        // Map OpenF1 sessions to our tab format
        const mapped = result.sessions.map(s => ({
          id: normaliseSessionName(s.session_name),
          label: s.session_name,
          available: true,
          sessionKey: s.session_key,
          sessionType: s.session_type,
        })).filter(s => s.id !== 'unknown');

        // Sort by SESSION_ORDER
        mapped.sort((a, b) => SESSION_ORDER.indexOf(a.id) - SESSION_ORDER.indexOf(b.id));

        setWeekendSessions(mapped);
      })
      .catch(() => {
        setWeekendSessions([
          { id: 'race', label: 'Race', available: true, sessionKey: null },
          { id: 'qualifying', label: 'Qualifying', available: true, sessionKey: null },
        ]);
      })
      .finally(() => setLoadingSessions(false));
  }, [selectedRound, races, season]);

  const completed = races.filter(r => new Date(r.date) <= new Date());
  const upcoming  = races.filter(r => new Date(r.date) >  new Date());

  const selectedRace = selectedRound === 'last'
    ? completed.at(-1)
    : races.find(r => r.round === String(selectedRound));

  return (
    <div className="f1-card border-l-2 border-l-f1red overflow-hidden">
      {/* Row 1: Race dropdown */}
      <div className="flex flex-wrap items-center gap-3 p-3 border-b border-f1border">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-f1red" />
          <span className="text-f1muted font-mono text-xs uppercase tracking-widest">Race Weekend</span>
        </div>

        <select
          value={selectedRound}
          onChange={e => setSelectedRound(e.target.value === 'last' ? 'last' : parseInt(e.target.value))}
          disabled={loadingRaces}
          className="flex-1 min-w-48 bg-black border border-f1border text-white text-sm font-display px-3 py-1.5 rounded focus:outline-none focus:border-f1red cursor-pointer disabled:opacity-40"
        >
          <option value="last">
            {loadingRaces ? 'Loading...' : completed.length
              ? `Latest — R${completed.at(-1)?.round} ${completed.at(-1)?.raceName?.replace(' Grand Prix', ' GP')}`
              : 'No completed races yet'}
          </option>
          {completed.length > 0 && (
            <optgroup label="── Completed ──────────────">
              {[...completed].reverse().map(r => (
                <option key={r.round} value={r.round}>
                  {flag(r.Circuit?.Location?.country)} R{r.round} — {r.raceName.replace(' Grand Prix', ' GP')} · {r.date}
                </option>
              ))}
            </optgroup>
          )}
          {upcoming.length > 0 && (
            <optgroup label="── Upcoming ───────────────">
              {upcoming.map(r => (
                <option key={r.round} value={r.round} disabled>
                  {flag(r.Circuit?.Location?.country)} R{r.round} — {r.raceName.replace(' Grand Prix', ' GP')} · {r.date}
                </option>
              ))}
            </optgroup>
          )}
        </select>

        {selectedRace && (
          <div className="hidden lg:flex items-center gap-2 shrink-0 bg-f1border/40 rounded px-3 py-1.5">
            <span className="text-xl">{flag(selectedRace.Circuit?.Location?.country)}</span>
            <div>
              <p className="text-white font-display font-semibold text-xs leading-tight">{selectedRace.Circuit?.circuitName}</p>
              <p className="text-f1muted font-mono text-[10px]">{selectedRace.Circuit?.Location?.locality}, {selectedRace.Circuit?.Location?.country}</p>
            </div>
          </div>
        )}
      </div>

      {/* Row 2: Session tabs */}
      <div className="flex items-center gap-0 overflow-x-auto px-3 py-2 border-t border-f1border/30">
        <span className="text-f1muted font-mono text-xs mr-3 shrink-0">Session:</span>

        {loadingSessions ? (
          <div className="flex gap-2">
            {[1,2,3,4,5].map(i => <div key={i} className="w-16 h-6 shimmer rounded" />)}
          </div>
        ) : weekendSessions ? (
          weekendSessions.map(session => {
            const isActive = selectedSession === session.id;
            return (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session.id)}
                className={`
                  shrink-0 px-3 py-1.5 mr-0.5 text-xs font-display font-bold uppercase tracking-wide
                  border-b-2 transition-all
                  ${isActive
                    ? 'border-f1red text-white bg-f1red/10'
                    : 'border-transparent text-f1muted hover:text-white hover:border-f1muted'}
                `}
              >
                {session.label}
              </button>
            );
          })
        ) : (
          // Before OpenF1 data loads — show Race + Qualifying as defaults
          ['race', 'qualifying'].map(id => (
            <button
              key={id}
              onClick={() => setSelectedSession(id)}
              className={`shrink-0 px-3 py-1.5 mr-0.5 text-xs font-display font-bold uppercase tracking-wide border-b-2 transition-all ${selectedSession === id ? 'border-f1red text-white bg-f1red/10' : 'border-transparent text-f1muted hover:text-white'}`}
            >
              {SESSION_LABELS[id]}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
