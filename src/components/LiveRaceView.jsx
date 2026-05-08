import React, { useState, useEffect, useCallback } from 'react';
import {
  getLivePositions, getLiveIntervals, getLiveDrivers,
  getLiveLaps, getLiveRaceControl, getLivePitStops, getLiveTyres,
} from '../utils/openf1';
import { formatLapTime } from '../utils/api';
import { SectionHeader } from './LoadingCard';

// ── Tyre badge ─────────────────────────────────────────────
const COMPOUND_STYLE = {
  SOFT:         { bg: '#E8002D', text: '#fff', label: 'S' },
  MEDIUM:       { bg: '#FFF200', text: '#000', label: 'M' },
  HARD:         { bg: '#EFEFEF', text: '#000', label: 'H' },
  INTERMEDIATE: { bg: '#39B54A', text: '#fff', label: 'I' },
  WET:          { bg: '#0067FF', text: '#fff', label: 'W' },
  UNKNOWN:      { bg: '#444',    text: '#fff', label: '?' },
};

function TyreBadge({ compound }) {
  const c = COMPOUND_STYLE[compound ?? 'UNKNOWN'] ?? COMPOUND_STYLE.UNKNOWN;
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0"
      style={{ background: c.bg, color: c.text }}
      title={compound}
    >
      {c.label}
    </span>
  );
}

// ── Flag status banner ─────────────────────────────────────
const FLAG_CONFIG = {
  GREEN:            { bg: 'bg-green-900/40 border-green-500/40', text: 'text-green-400', label: '🟢 Green Flag — Racing' },
  YELLOW:           { bg: 'bg-yellow-900/40 border-yellow-500/40', text: 'text-yellow-400', label: '🟡 Yellow Flag' },
  DOUBLE_YELLOW:    { bg: 'bg-yellow-900/60 border-yellow-400/60', text: 'text-yellow-300', label: '🟡🟡 Double Yellow' },
  RED:              { bg: 'bg-red-900/60 border-red-500/60', text: 'text-red-400', label: '🔴 Red Flag — Race Stopped' },
  SAFETY_CAR:       { bg: 'bg-yellow-900/50 border-yellow-500/50', text: 'text-yellow-300', label: '🚗 Safety Car Deployed' },
  VIRTUAL_SAFETY_CAR: { bg: 'bg-yellow-900/30 border-yellow-600/30', text: 'text-yellow-500', label: '🚗 Virtual Safety Car' },
  CHEQUERED:        { bg: 'bg-white/10 border-white/20', text: 'text-white', label: '🏁 Chequered Flag — Race Over' },
  CLEAR:            { bg: 'bg-green-900/20 border-green-700/20', text: 'text-green-500', label: '🟢 Track Clear' },
};

function getCurrentFlag(raceControl) {
  if (!raceControl?.length) return null;
  // Walk backwards to find the most recent meaningful flag/SC message
  for (const msg of raceControl) {
    const cat = msg.category?.toUpperCase();
    const flag = msg.flag?.toUpperCase();
    const text = msg.message?.toUpperCase() ?? '';

    if (flag === 'CHEQUERED') return 'CHEQUERED';
    if (cat === 'SAFETYCAR') {
      if (text.includes('DEPLOYED')) return 'SAFETY_CAR';
      if (text.includes('IN THIS LAP') || text.includes('ENDING')) continue; // SC ending, keep looking
      if (text.includes('VIRTUAL') && text.includes('DEPLOYED')) return 'VIRTUAL_SAFETY_CAR';
    }
    if (flag === 'RED') return 'RED';
    if (flag === 'DOUBLE YELLOW') return 'DOUBLE_YELLOW';
    if (flag === 'YELLOW') return 'YELLOW';
    if (flag === 'GREEN' || flag === 'CLEAR') return 'GREEN';
  }
  return 'GREEN';
}

function FlagBanner({ raceControl }) {
  const flagKey = getCurrentFlag(raceControl);
  if (!flagKey) return null;
  const cfg = FLAG_CONFIG[flagKey] ?? FLAG_CONFIG.GREEN;
  return (
    <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded border ${cfg.bg} animate-fade-in`}>
      <span className={`font-display font-bold text-sm tracking-wide ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
}

// ── Interval formatter ─────────────────────────────────────
function fmtGap(val) {
  if (val == null) return '—';
  if (val === 0) return 'Leader';
  if (typeof val === 'string') return val; // e.g. "+1 LAP"
  return `+${val.toFixed(3)}`;
}

// ── Recent race events ─────────────────────────────────────
function RaceEvents({ events }) {
  const notable = events.filter(e =>
    e.category === 'Flag' ||
    e.category === 'SafetyCar' ||
    e.category === 'Drs' ||
    e.message?.toLowerCase().includes('pit')
  ).slice(0, 6);

  if (!notable.length) return null;

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title="Race Events" subtitle="Latest messages from race control" accent />
      <div className="space-y-1.5">
        {notable.map((e, i) => (
          <div key={i} className="flex items-start gap-3 py-1.5 border-b border-f1border/30 last:border-0">
            <span className="number-font text-f1muted text-xs shrink-0 w-12">
              {e.lap_number ? `Lap ${e.lap_number}` : '—'}
            </span>
            <span className="text-white text-xs font-display font-semibold">
              {e.flag && `[${e.flag}] `}{e.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export default function LiveRaceView({ session, totalLaps }) {
  const sessionKey = session?.session_key;

  const [positions, setPositions] = useState([]);
  const [intervals, setIntervals] = useState({});
  const [drivers, setDrivers] = useState({});
  const [lapData, setLapData] = useState({ latestPerDriver: {}, currentLap: 0 });
  const [raceControl, setRaceControl] = useState([]);
  const [pitStops, setPitStops] = useState({});
  const [tyres, setTyres] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!sessionKey) return;
    try {
      // Fetch positions + intervals + race control every poll (most time-critical)
      const [pos, intv, rc] = await Promise.all([
        getLivePositions(sessionKey),
        getLiveIntervals(sessionKey),
        getLiveRaceControl(sessionKey),
      ]);
      setPositions(pos);
      setIntervals(intv);
      setRaceControl(rc);
      setLastUpdated(new Date());
    } catch (e) {
      console.warn('LiveRaceView fast poll failed:', e.message);
    }
  }, [sessionKey]);

  const refreshSlow = useCallback(async () => {
    if (!sessionKey) return;
    try {
      // Lap times, tyres, pit stops — slightly less urgent
      const [laps, pits, tyr, drv] = await Promise.all([
        getLiveLaps(sessionKey),
        getLivePitStops(sessionKey),
        getLiveTyres(sessionKey),
        getLiveDrivers(sessionKey),
      ]);
      setLapData(laps);
      setPitStops(pits);
      setTyres(tyr);
      setDrivers(drv);
    } catch (e) {
      console.warn('LiveRaceView slow poll failed:', e.message);
    } finally {
      setLoading(false);
    }
  }, [sessionKey]);

  useEffect(() => {
    if (!sessionKey) return;
    // Initial load — both fast and slow
    refresh();
    refreshSlow();

    // Poll positions every 15s, lap data every 30s
    const fastTimer = setInterval(refresh, 15_000);
    const slowTimer = setInterval(refreshSlow, 30_000);
    return () => { clearInterval(fastTimer); clearInterval(slowTimer); };
  }, [sessionKey, refresh, refreshSlow]);

  const currentLap = lapData.currentLap;
  const lapsDisplay = totalLaps
    ? `Lap ${currentLap} / ${totalLaps}`
    : currentLap ? `Lap ${currentLap}` : 'Formation / Pre-race';

  if (loading && !positions.length) {
    return (
      <div className="f1-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-f1red live-dot" />
          <span className="text-f1red font-mono text-xs uppercase tracking-widest font-bold">Loading live data…</span>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="h-8 shimmer rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-slide-up">
      {/* Header */}
      <div className="f1-card p-4 border-f1red/30">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-f1red/10 border border-f1red/30 rounded px-2 py-1">
              <span className="w-2 h-2 rounded-full bg-f1red live-dot" />
              <span className="text-f1red font-mono text-xs uppercase tracking-widest font-bold">Live Race</span>
            </div>
            <div>
              <p className="text-white font-display font-bold text-base">{session?.meeting_name ?? 'Grand Prix'}</p>
              <p className="text-f1muted font-mono text-xs">{session?.circuit_short_name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="number-font text-white font-bold text-lg">{lapsDisplay}</p>
            {lastUpdated && (
              <p className="text-f1muted font-mono text-[10px]">
                Updated {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            )}
          </div>
        </div>
        <FlagBanner raceControl={raceControl} />
      </div>

      {/* Live leaderboard */}
      <div className="f1-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-f1border">
                <th className="text-left text-f1muted font-mono text-xs uppercase px-3 py-2">Pos</th>
                <th className="text-left text-f1muted font-mono text-xs uppercase px-3 py-2">Driver</th>
                <th className="text-right text-f1muted font-mono text-xs uppercase px-3 py-2">Gap</th>
                <th className="text-right text-f1muted font-mono text-xs uppercase px-3 py-2 hidden sm:table-cell">Interval</th>
                <th className="text-right text-f1muted font-mono text-xs uppercase px-3 py-2 hidden md:table-cell">Last Lap</th>
                <th className="text-center text-f1muted font-mono text-xs uppercase px-3 py-2">Tyre</th>
                <th className="text-center text-f1muted font-mono text-xs uppercase px-3 py-2 hidden sm:table-cell">Stops</th>
                <th className="text-center text-f1muted font-mono text-xs uppercase px-3 py-2 hidden lg:table-cell">Lap</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => {
                const driverNum = p.driver_number;
                const driver = drivers[driverNum];
                const intv = intervals[driverNum];
                const lastLap = lapData.latestPerDriver[driverNum];
                const tyre = tyres[driverNum];
                const stops = pitStops[driverNum] ?? 0;

                const teamColor = driver?.team_colour ? `#${driver.team_colour}` : '#888';
                const code = driver?.name_acronym ?? `#${driverNum}`;
                const fullName = driver?.full_name ?? `Driver ${driverNum}`;

                // Highlight fastest lap in purple
                const allLapTimes = Object.values(lapData.latestPerDriver)
                  .map(l => l?.lap_duration).filter(Boolean);
                const fastestLapTime = allLapTimes.length ? Math.min(...allLapTimes) : null;
                const isFastest = lastLap?.lap_duration && lastLap.lap_duration === fastestLapTime;

                // Position delta styling
                const pos = p.position;
                const posStyle = pos === 1 ? 'text-f1gold font-black' : pos <= 3 ? 'text-white font-bold' : 'text-f1muted';

                return (
                  <tr key={driverNum}
                    className="border-b border-f1border/40 hover:bg-f1border/20 transition-colors">
                    <td className="px-3 py-2.5">
                      <span className={`number-font text-sm ${posStyle}`}>P{pos}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-0.5 h-7 rounded-full shrink-0" style={{ background: teamColor }} />
                        <div>
                          <p className="font-display font-semibold text-white text-sm leading-tight">{fullName}</p>
                          <p className="text-f1muted font-mono text-[10px]">{driver?.team_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="number-font text-white text-xs">
                        {pos === 1 ? '—' : fmtGap(intv?.gap_to_leader)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right hidden sm:table-cell">
                      <span className="number-font text-f1muted text-xs">
                        {pos === 1 ? '—' : fmtGap(intv?.interval)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right hidden md:table-cell">
                      <span className={`number-font text-xs font-bold ${isFastest ? 'text-purple-400' : 'text-white'}`}>
                        {lastLap?.lap_duration
                          ? formatLapTime(lastLap.lap_duration)
                          : '—'}
                        {isFastest && ' ⚡'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <TyreBadge compound={tyre?.compound} />
                    </td>
                    <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                      <span className="number-font text-f1muted text-xs">{stops}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center hidden lg:table-cell">
                      <span className="number-font text-f1muted text-xs">
                        {lastLap?.lap_number ?? '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!positions.length && (
          <div className="p-8 text-center">
            <p className="text-f1muted font-mono text-sm">Waiting for position data…</p>
            <p className="text-f1muted/50 font-mono text-xs mt-1">Refreshing every 15 seconds</p>
          </div>
        )}
      </div>

      {/* Race control events */}
      <RaceEvents events={raceControl} />
    </div>
  );
}
