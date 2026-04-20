import React, { useMemo, useState } from 'react';
import { getTyreStints, resolveSeasonYear, resolveRound, getRaceResults } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { ErrorCard, SectionHeader } from './LoadingCard';

// Official F1 tyre compound colors
const COMPOUND_COLORS = {
  SOFT:        { bg: '#E8002D', text: '#fff', label: 'S' },
  MEDIUM:      { bg: '#FFF200', text: '#000', label: 'M' },
  HARD:        { bg: '#FFFFFF', text: '#000', label: 'H' },
  INTERMEDIATE:{ bg: '#39B54A', text: '#fff', label: 'I' },
  WET:         { bg: '#0067FF', text: '#fff', label: 'W' },
  UNKNOWN:     { bg: '#888888', text: '#fff', label: '?' },
};

function CompoundBadge({ compound, size = 'sm' }) {
  const c = COMPOUND_COLORS[compound] ?? COMPOUND_COLORS.UNKNOWN;
  const sz = size === 'lg' ? 'w-7 h-7 text-sm font-black' : 'w-5 h-5 text-[10px] font-bold';
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center shrink-0 border border-black/20`}
      style={{ background: c.bg, color: c.text }}
      title={compound}
    >
      {c.label}
    </div>
  );
}

function TyreBar({ stint, totalLaps, width }) {
  const c = COMPOUND_COLORS[stint.compound] ?? COMPOUND_COLORS.UNKNOWN;
  const lapWidth = ((stint.lapEnd - stint.lapStart + 1) / totalLaps) * 100;
  const leftOffset = ((stint.lapStart - 1) / totalLaps) * 100;

  return (
    <div
      className="absolute top-0 h-full rounded-sm border border-black/30 flex items-center justify-center overflow-hidden group cursor-default transition-all hover:opacity-90"
      style={{
        left: `${leftOffset}%`,
        width: `${lapWidth}%`,
        background: c.bg,
        minWidth: 2,
      }}
      title={`${stint.compound} · Laps ${stint.lapStart}–${stint.lapEnd} (${stint.lapEnd - stint.lapStart + 1} laps)`}
    >
      {lapWidth > 8 && (
        <span className="text-[10px] font-bold font-mono" style={{ color: c.text }}>
          {c.label} · {stint.lapEnd - stint.lapStart + 1}L
        </span>
      )}
      {/* Tooltip on hover */}
      <div className="hidden group-hover:flex absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-f1card border border-f1border rounded px-2 py-1 text-[10px] font-mono text-white whitespace-nowrap z-10 shadow-xl">
        {stint.compound} · L{stint.lapStart}–{stint.lapEnd} · {stint.lapEnd - stint.lapStart + 1} laps
        {stint.tyreAgeAtStart > 0 ? ` · +${stint.tyreAgeAtStart} aged` : ''}
      </div>
    </div>
  );
}

export default function TyreStrategy() {
  const { season, selectedRound } = useApp();
  const [selectedDriverCode, setSelectedDriverCode] = useState('ALL');

  const { data, loading, error } = useF1Data(async () => {
    const year = await resolveSeasonYear(season);
    const round = await resolveRound(season, selectedRound);
    const [stints, raceData] = await Promise.all([
      getTyreStints(year, round),
      getRaceResults(season, selectedRound === 'last' ? 'last' : selectedRound),
    ]);
    return { stints, raceData, year, round };
  }, [season, selectedRound], 120_000);

  const { stints, raceData } = data ?? {};

  // Build ordered driver list from race results (so they're sorted by finish position)
  const orderedDrivers = useMemo(() => {
    if (!raceData?.Results || !stints?.driverMap) return [];
    return raceData.Results
      .map(r => {
        // Match by driver code or number
        const entry = Object.entries(stints.driverMap).find(([, d]) =>
          d.code === r.Driver?.code || d.code === r.Driver?.familyName?.slice(0, 3).toUpperCase()
        );
        return {
          pos: parseInt(r.position),
          code: r.Driver?.code || r.Driver?.familyName?.slice(0, 3).toUpperCase(),
          fullName: `${r.Driver?.givenName} ${r.Driver?.familyName}`,
          team: r.Constructor?.name,
          driverNumber: entry?.[0],
          teamColor: entry?.[1]?.teamColor || '#888',
        };
      })
      .filter(d => d.driverNumber && stints.byDriver[d.driverNumber]);
  }, [raceData, stints]);

  // Legend compounds actually used
  const usedCompounds = useMemo(() => {
    if (!stints?.byDriver) return [];
    const compounds = new Set();
    Object.values(stints.byDriver).forEach(driverStints =>
      driverStints.forEach(s => compounds.add(s.compound))
    );
    return Array.from(compounds).filter(c => COMPOUND_COLORS[c]);
  }, [stints]);

  const displayDrivers = selectedDriverCode === 'ALL'
    ? orderedDrivers
    : orderedDrivers.filter(d => d.code === selectedDriverCode);

  if (loading) return (
    <div className="f1-card p-4">
      <SectionHeader title="Tyre Strategy" accent />
      <div className="space-y-2 mt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-10 h-5 shimmer rounded shrink-0" />
            <div className="flex-1 h-7 shimmer rounded" />
          </div>
        ))}
      </div>
    </div>
  );

  if (!stints) return (
    <div className="f1-card p-4">
      <SectionHeader
        title="Tyre Strategy"
        subtitle={raceData?.raceName ?? ''}
        accent
      />
      <div className="mt-4 p-4 text-center border border-f1border/50 rounded bg-f1border/10">
        <p className="text-2xl mb-2">🏎️</p>
        <p className="text-f1muted font-mono text-sm">Tyre data not available for this race</p>
        <p className="text-f1muted/60 font-mono text-xs mt-1">OpenF1 tyre data is available for 2023 onwards</p>
      </div>
    </div>
  );

  if (error) return <ErrorCard message={error} />;
  if (!orderedDrivers.length) return <ErrorCard message="No tyre data matched to drivers" />;

  const totalLaps = stints.totalLaps;

  return (
    <div className="f1-card p-4 animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <SectionHeader
          title="Tyre Strategy"
          subtitle={`${raceData?.raceName ?? ''} · ${totalLaps} laps`}
          accent
        />

        {/* Driver filter dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-f1muted font-mono text-xs">Driver</span>
          <select
            value={selectedDriverCode}
            onChange={e => setSelectedDriverCode(e.target.value)}
            className="bg-black border border-f1border text-white text-xs font-mono px-2 py-1.5 rounded focus:outline-none focus:border-f1red cursor-pointer"
          >
            <option value="ALL">All Drivers</option>
            {orderedDrivers.map(d => (
              <option key={d.code} value={d.code}>
                P{d.pos} — {d.code} ({d.team?.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compound legend */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-f1muted font-mono text-xs">Compounds:</span>
        {usedCompounds.map(c => (
          <div key={c} className="flex items-center gap-1.5">
            <CompoundBadge compound={c} />
            <span className="text-f1muted font-mono text-xs">{c}</span>
          </div>
        ))}
      </div>

      {/* Lap number ruler */}
      <div className="flex items-center mb-1 ml-24">
        <div className="relative flex-1 h-3">
          {[0, 25, 50, 75, 100].map(pct => {
            const lap = Math.round((pct / 100) * totalLaps);
            return (
              <span
                key={pct}
                className="absolute text-[9px] font-mono text-f1muted/60 -translate-x-1/2"
                style={{ left: `${pct}%` }}
              >
                {lap > 0 ? lap : ''}
              </span>
            );
          })}
        </div>
      </div>

      {/* Strategy bars */}
      <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: selectedDriverCode === 'ALL' ? '520px' : 'auto' }}>
        {displayDrivers.map(driver => {
          const driverStints = stints.byDriver[driver.driverNumber] ?? [];
          return (
            <div key={driver.code} className="flex items-center gap-2 group">
              {/* Driver label */}
              <div className="w-22 shrink-0 flex items-center gap-1.5" style={{ width: 88 }}>
                <div className="w-0.5 h-5 rounded-full shrink-0" style={{ background: driver.teamColor }} />
                <div>
                  <p className="text-white font-mono text-xs font-semibold leading-none">{driver.code}</p>
                  <p className="text-f1muted font-mono text-[9px] leading-none">P{driver.pos}</p>
                </div>
              </div>

              {/* Bar track */}
              <div className="relative flex-1 h-7 bg-f1border/30 rounded-sm overflow-visible">
                {driverStints.map((stint, i) => (
                  <TyreBar key={i} stint={stint} totalLaps={totalLaps} />
                ))}
              </div>

              {/* Stint summary badges */}
              <div className="flex gap-1 shrink-0 w-16 justify-end">
                {driverStints.map((stint, i) => (
                  <CompoundBadge key={i} compound={stint.compound} size="sm" />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Single driver detail view */}
      {selectedDriverCode !== 'ALL' && displayDrivers[0] && (
        <div className="mt-4 pt-4 border-t border-f1border">
          <p className="text-f1muted font-mono text-xs uppercase tracking-widest mb-3">Stint Breakdown</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(stints.byDriver[displayDrivers[0].driverNumber] ?? []).map((stint, i) => (
              <div key={i} className="f1-card p-3 flex items-start gap-2">
                <CompoundBadge compound={stint.compound} size="lg" />
                <div>
                  <p className="text-white font-mono text-xs font-bold">{stint.compound}</p>
                  <p className="text-f1muted font-mono text-[10px]">Laps {stint.lapStart}–{stint.lapEnd}</p>
                  <p className="text-f1muted font-mono text-[10px]">{stint.lapEnd - stint.lapStart + 1} laps</p>
                  {stint.tyreAgeAtStart > 0 && (
                    <p className="text-orange-400 font-mono text-[10px]">+{stint.tyreAgeAtStart} aged</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
