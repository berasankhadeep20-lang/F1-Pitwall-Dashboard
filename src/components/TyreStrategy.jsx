import React, { useState } from 'react';
import { getRaceResults, getPitStops, getTeamColor } from '../utils/api';
import { getSessionsForMeeting, getRealTyreStints, normaliseSessionName } from '../utils/openf1';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { ErrorCard, SectionHeader } from './LoadingCard';

const COMPOUNDS = {
  SOFT:         { bg: '#E8002D', border: '#c00020', text: '#fff', label: 'S' },
  MEDIUM:       { bg: '#FFF200', border: '#ccbb00', text: '#000', label: 'M' },
  HARD:         { bg: '#EFEFEF', border: '#aaaaaa', text: '#000', label: 'H' },
  INTERMEDIATE: { bg: '#39B54A', border: '#2a8a38', text: '#fff', label: 'I' },
  WET:          { bg: '#0067FF', border: '#0050cc', text: '#fff', label: 'W' },
  UNKNOWN:      { bg: '#555555', border: '#333',    text: '#fff', label: '?' },
};

function Badge({ compound, size = 'sm' }) {
  const c = COMPOUNDS[compound] ?? COMPOUNDS.UNKNOWN;
  const sz = size === 'lg' ? 'w-9 h-9 text-sm font-black' : 'w-5 h-5 text-[10px] font-bold';
  return (
    <div className={`${sz} rounded-full flex items-center justify-center shrink-0`}
      style={{ background: c.bg, color: c.text, border: `1.5px solid ${c.border}` }}
      title={compound}>
      {c.label}
    </div>
  );
}

function StintBar({ stint, totalLaps }) {
  const c = COMPOUNDS[stint.compound] ?? COMPOUNDS.UNKNOWN;
  const lapEnd = stint.lapEnd ?? totalLaps;
  const widthPct = ((lapEnd - stint.lapStart + 1) / totalLaps) * 100;
  const leftPct  = ((stint.lapStart - 1) / totalLaps) * 100;
  const stintLaps = lapEnd - stint.lapStart + 1;

  return (
    <div className="absolute top-0.5 bottom-0.5 rounded flex items-center justify-center overflow-hidden group cursor-default hover:brightness-110 transition-all"
      style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 0.8)}%`, background: c.bg, border: `1px solid ${c.border}` }}
      title={`${stint.compound} · L${stint.lapStart}–${lapEnd} · ${stintLaps} laps`}
    >
      {widthPct > 7 && (
        <span className="text-[10px] font-bold font-mono select-none" style={{ color: c.text }}>
          {c.label}·{stintLaps}L
        </span>
      )}
      <div className="hidden group-hover:flex absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-f1card border border-f1border rounded px-2.5 py-1.5 z-20 shadow-2xl pointer-events-none whitespace-nowrap flex-col">
        <span className="text-white font-mono text-xs font-bold">{stint.compound}</span>
        <span className="text-f1muted font-mono text-[10px]">Laps {stint.lapStart} – {lapEnd}</span>
        <span className="text-f1muted font-mono text-[10px]">{stintLaps} laps</span>
        {stint.tyreAge > 0 && <span className="text-orange-400 font-mono text-[10px]">+{stint.tyreAge} laps aged</span>}
      </div>
    </div>
  );
}

// Fetch tyre data: try OpenF1 first (real compounds), fall back to pit stop reconstruction
async function fetchTyreData(season, round) {
  const raceData = await getRaceResults(season, round);
  if (!raceData?.Results?.length) return null;

  const results = raceData.Results;
  const totalLaps = parseInt(results.find(r => r.position === '1')?.laps ?? 70);
  const year = season === 'current' ? new Date().getFullYear() : parseInt(season);
  const circuitId = raceData.Circuit?.circuitId ?? '';

  // Try OpenF1 for real compound data (2023+)
  let openf1Stints = null;
  if (year >= 2023) {
    try {
      const meeting = await getSessionsForMeeting(year, circuitId);
      const raceSession = meeting?.sessions?.find(s =>
        normaliseSessionName(s.session_name) === 'race'
      );
      if (raceSession?.session_key) {
        openf1Stints = await getRealTyreStints(raceSession.session_key);
      }
    } catch (e) {
      console.warn('OpenF1 tyre fetch failed, using fallback:', e.message);
    }
  }

  // Build per-driver stint list
  const drivers = results.map(r => {
    const driverId = r.Driver?.driverId;
    const code = r.Driver?.code || r.Driver?.familyName?.slice(0, 3).toUpperCase();

    // Try matching OpenF1 data by driver code
    let stints = null;
    if (openf1Stints) {
      const match = Object.entries(openf1Stints.byDriver).find(([, s]) => {
        const info = openf1Stints.driverMap[Object.keys(openf1Stints.byDriver).find(k =>
          openf1Stints.byDriver[k] === s
        )];
        return info?.code === code;
      });
      // Simpler match: iterate driver numbers
      for (const [num, stintArr] of Object.entries(openf1Stints.byDriver)) {
        const info = openf1Stints.driverMap[num];
        if (info?.code === code) {
          stints = stintArr.map(s => ({
            ...s,
            lapEnd: s.lapEnd ?? totalLaps,
            laps: (s.lapEnd ?? totalLaps) - s.lapStart + 1,
          }));
          break;
        }
      }
    }

    // Fallback: reconstruct from pit stops
    if (!stints) {
      stints = []; // will be filled after
    }

    return {
      pos: parseInt(r.position),
      code,
      fullName: `${r.Driver?.givenName} ${r.Driver?.familyName}`,
      driverId,
      team: r.Constructor?.name,
      teamColor: getTeamColor(r.Constructor?.name),
      status: r.status,
      stints,
      usingRealData: !!stints.length && !!openf1Stints,
    };
  });

  // For drivers without OpenF1 data, reconstruct from pit stops
  const needsFallback = drivers.some(d => !d.stints.length);
  if (needsFallback) {
    const pitStops = await getPitStops(season, round);
    const pitsByDriver = {};
    pitStops.forEach(p => {
      if (!pitsByDriver[p.driverId]) pitsByDriver[p.driverId] = [];
      pitsByDriver[p.driverId].push(parseInt(p.lap));
    });

    drivers.forEach(d => {
      if (d.stints.length) return; // already have OpenF1 data
      const pits = (pitsByDriver[d.driverId] ?? []).sort((a, b) => a - b);
      const driverLaps = parseInt(results.find(r => r.Driver?.driverId === d.driverId)?.laps ?? totalLaps);
      const bounds = [1, ...pits.map(p => p + 1), driverLaps + 1];
      for (let i = 0; i < bounds.length - 1; i++) {
        const lapStart = bounds[i];
        const lapEnd = bounds[i + 1] - 1;
        if (lapEnd >= lapStart) {
          d.stints.push({
            stintNum: i + 1,
            lapStart,
            lapEnd,
            laps: lapEnd - lapStart + 1,
            compound: inferCompound(i, bounds.length - 1, lapEnd - lapStart + 1, totalLaps),
            tyreAge: 0,
          });
        }
      }
    });
  }

  const usingRealData = drivers.some(d => d.usingRealData);
  return { drivers, totalLaps, raceName: raceData.raceName, usingRealData };
}

function inferCompound(idx, total, laps, raceLaps) {
  const f = laps / raceLaps;
  if (idx === 0) return f > 0.35 ? 'MEDIUM' : 'SOFT';
  if (idx === total - 1) return f < 0.25 ? 'SOFT' : f > 0.45 ? 'HARD' : 'MEDIUM';
  return f > 0.40 ? 'HARD' : f > 0.22 ? 'MEDIUM' : 'SOFT';
}

export default function TyreStrategy() {
  const { season, selectedRound } = useApp();
  const round = selectedRound ?? 'last';
  const [driverFilter, setDriverFilter] = useState('ALL');

  const { data, loading, error } = useF1Data(
    () => fetchTyreData(season, round),
    [season, round],
    120_000
  );

  if (loading) return (
    <div className="f1-card p-4">
      <SectionHeader title="Tyre Strategy" accent />
      <div className="space-y-2 mt-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-20 h-5 shimmer rounded shrink-0" />
            <div className="flex-1 h-7 shimmer rounded" />
          </div>
        ))}
      </div>
    </div>
  );

  if (error) return <ErrorCard message={error} />;
  if (!data) return (
    <div className="f1-card p-4">
      <SectionHeader title="Tyre Strategy" accent />
      <div className="mt-4 p-6 text-center border border-f1border/50 rounded bg-f1border/10">
        <p className="text-2xl mb-2">🏎️</p>
        <p className="text-f1muted font-mono text-sm">No tyre data available for this race</p>
      </div>
    </div>
  );

  const { drivers, totalLaps, raceName, usingRealData } = data;
  const display = driverFilter === 'ALL' ? drivers : drivers.filter(d => d.code === driverFilter);

  return (
    <div className="f1-card p-4 animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <SectionHeader title="Tyre Strategy" subtitle={`${raceName} · ${totalLaps} laps`} accent />
          <div className="flex items-center gap-1.5 mt-1 ml-3">
            <div className={`w-1.5 h-1.5 rounded-full ${usingRealData ? 'bg-green-400' : 'bg-orange-400'}`} />
            <span className="text-[10px] font-mono text-f1muted">
              {usingRealData ? 'Real compound data (OpenF1)' : 'Compounds inferred from pit stop data'}
            </span>
          </div>
        </div>
        <select
          value={driverFilter}
          onChange={e => setDriverFilter(e.target.value)}
          className="bg-black border border-f1border text-white text-xs font-mono px-2 py-1.5 rounded focus:outline-none focus:border-f1red cursor-pointer shrink-0"
        >
          <option value="ALL">All Drivers</option>
          {drivers.map(d => (
            <option key={d.code} value={d.code}>P{d.pos} — {d.code} ({d.team?.split(' ')[0]})</option>
          ))}
        </select>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-f1muted font-mono text-xs shrink-0">Compounds:</span>
        {Object.entries(COMPOUNDS).filter(([k]) => k !== 'UNKNOWN').map(([name, c]) => (
          <div key={name} className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full" style={{ background: c.bg, border: `1.5px solid ${c.border}` }} />
            <span className="text-f1muted font-mono text-xs">{name.charAt(0) + name.slice(1).toLowerCase()}</span>
          </div>
        ))}
      </div>

      {/* Lap ruler */}
      <div className="relative h-4 mb-1" style={{ paddingLeft: 96 }}>
        {[0, 25, 50, 75, 100].map(pct => {
          const lap = Math.round((pct / 100) * totalLaps);
          return (
            <span key={pct} className="absolute text-[9px] font-mono text-f1muted/50 -translate-x-1/2"
              style={{ left: `calc(96px + (100% - 96px) * ${pct} / 100)` }}>
              {lap > 0 ? lap : ''}
            </span>
          );
        })}
      </div>

      {/* Bars */}
      <div className="space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: driverFilter === 'ALL' ? '560px' : 'none' }}>
        {display.map(driver => (
          <div key={driver.code} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 shrink-0" style={{ width: 88 }}>
              <div className="w-0.5 h-6 rounded-full shrink-0" style={{ background: driver.teamColor }} />
              <div>
                <p className="text-white font-mono text-xs font-bold leading-none">{driver.code}</p>
                <p className="text-f1muted font-mono text-[9px] leading-none">P{driver.pos} · {driver.stints.length - 1}pit</p>
              </div>
            </div>
            <div className="relative flex-1 h-7 bg-f1border/20 rounded border border-f1border/30">
              {driver.stints.map((s, i) => <StintBar key={i} stint={s} totalLaps={totalLaps} />)}
            </div>
            <div className="flex gap-0.5 shrink-0 justify-end" style={{ width: 72 }}>
              {driver.stints.map((s, i) => <Badge key={i} compound={s.compound} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Single driver breakdown */}
      {driverFilter !== 'ALL' && display[0] && (
        <div className="mt-5 pt-4 border-t border-f1border">
          <p className="text-f1muted font-mono text-xs uppercase tracking-widest mb-3">Stint Breakdown — {display[0].fullName}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {display[0].stints.map((s, i) => (
              <div key={i} className="f1-card p-3 flex items-start gap-2.5">
                <Badge compound={s.compound} size="lg" />
                <div>
                  <p className="text-white font-mono text-xs font-bold">{s.compound.charAt(0) + s.compound.slice(1).toLowerCase()}</p>
                  <p className="text-f1muted font-mono text-[10px]">Stint {s.stintNum}</p>
                  <p className="text-f1muted font-mono text-[10px]">L{s.lapStart} → L{s.lapEnd ?? totalLaps}</p>
                  <p className="text-white font-mono text-[10px] font-bold mt-0.5">{s.laps} laps</p>
                  {s.tyreAge > 0 && <p className="text-orange-400 font-mono text-[10px]">+{s.tyreAge} aged</p>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs font-mono flex-wrap">
            <span className="text-f1muted">Pit stops: <span className="text-white font-bold">{display[0].stints.length - 1}</span></span>
            <span className="text-f1muted">Status: <span className={display[0].status === 'Finished' ? 'text-green-400' : 'text-red-400'}>{display[0].status}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}
