import React, { useMemo, useState } from 'react';
import { getTyreStints, resolveSeasonYear, resolveRound, getRaceResults } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { ErrorCard, SectionHeader } from './LoadingCard';

const COMPOUNDS = {
  SOFT:         { bg: '#E8002D', text: '#fff', label: 'S' },
  MEDIUM:       { bg: '#FFF200', text: '#000', label: 'M' },
  HARD:         { bg: '#FFFFFF', text: '#000', label: 'H' },
  INTERMEDIATE: { bg: '#39B54A', text: '#fff', label: 'I' },
  WET:          { bg: '#0067FF', text: '#fff', label: 'W' },
  UNKNOWN:      { bg: '#555555', text: '#fff', label: '?' },
};

function Badge({ compound, size='sm' }) {
  const c = COMPOUNDS[compound] ?? COMPOUNDS.UNKNOWN;
  const sz = size==='lg' ? 'w-8 h-8 text-sm font-black' : 'w-5 h-5 text-[10px] font-bold';
  return (
    <div className={`${sz} rounded-full flex items-center justify-center shrink-0 border border-black/20`}
      style={{background:c.bg,color:c.text}} title={compound}>{c.label}</div>
  );
}

export default function TyreStrategy() {
  const { season, selectedRound } = useApp();
  const round = selectedRound ?? 'last';
  const [driverFilter, setDriverFilter] = useState('ALL');

  const { data, loading, error } = useF1Data(async () => {
    const [year, resolvedRound] = await Promise.all([
      resolveSeasonYear(season),
      resolveRound(season, round),
    ]);
    const [stints, raceData] = await Promise.all([
      getTyreStints(year, resolvedRound),
      getRaceResults(season, round),
    ]);
    return { stints, raceData };
  }, [season, round], 120_000);

  const { stints, raceData } = data ?? {};

  const orderedDrivers = useMemo(() => {
    if (!raceData?.Results || !stints?.driverMap) return [];
    return raceData.Results.map(r => {
      const match = Object.entries(stints.driverMap).find(([,d]) =>
        d.code === r.Driver?.code ||
        d.code === r.Driver?.familyName?.slice(0,3).toUpperCase()
      );
      return {
        pos: parseInt(r.position),
        code: r.Driver?.code || r.Driver?.familyName?.slice(0,3).toUpperCase(),
        fullName: `${r.Driver?.givenName} ${r.Driver?.familyName}`,
        team: r.Constructor?.name,
        driverNumber: match?.[0],
        teamColor: match?.[1]?.teamColor || '#888',
      };
    }).filter(d => d.driverNumber && stints.byDriver[d.driverNumber]);
  }, [raceData, stints]);

  const usedCompounds = useMemo(() => {
    if (!stints?.byDriver) return [];
    const s = new Set();
    Object.values(stints.byDriver).forEach(arr => arr.forEach(x => s.add(x.compound)));
    return Array.from(s).filter(c => COMPOUNDS[c]);
  }, [stints]);

  const display = driverFilter === 'ALL' ? orderedDrivers : orderedDrivers.filter(d=>d.code===driverFilter);
  const totalLaps = stints?.totalLaps ?? 70;

  if (loading) return (
    <div className="f1-card p-4">
      <SectionHeader title="Tyre Strategy" accent/>
      <div className="space-y-2 mt-4">{Array.from({length:8}).map((_,i)=>(
        <div key={i} className="flex items-center gap-2">
          <div className="w-10 h-5 shimmer rounded shrink-0"/>
          <div className="flex-1 h-7 shimmer rounded"/>
        </div>
      ))}</div>
    </div>
  );

  if (!stints) return (
    <div className="f1-card p-4">
      <SectionHeader title="Tyre Strategy" subtitle={raceData?.raceName ?? ''} accent/>
      <div className="mt-4 p-6 text-center border border-f1border/50 rounded bg-f1border/10">
        <p className="text-2xl mb-2">🏎️</p>
        <p className="text-f1muted font-mono text-sm">Tyre data not available for this race</p>
        <p className="text-f1muted/60 font-mono text-xs mt-1">OpenF1 tyre data available for 2023 onwards</p>
      </div>
    </div>
  );

  if (error) return <ErrorCard message={error}/>;

  return (
    <div className="f1-card p-4 animate-slide-up">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <SectionHeader title="Tyre Strategy" subtitle={`${raceData?.raceName ?? ''} · ${totalLaps} laps`} accent/>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-f1muted font-mono text-xs">Driver</span>
          <select value={driverFilter} onChange={e=>setDriverFilter(e.target.value)}
            className="bg-black border border-f1border text-white text-xs font-mono px-2 py-1.5 rounded focus:outline-none focus:border-f1red cursor-pointer">
            <option value="ALL">All Drivers</option>
            {orderedDrivers.map(d=>(
              <option key={d.code} value={d.code}>P{d.pos} — {d.code} ({d.team?.split(' ')[0]})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-f1muted font-mono text-xs">Compounds:</span>
        {usedCompounds.map(c=>(
          <div key={c} className="flex items-center gap-1.5">
            <Badge compound={c}/>
            <span className="text-f1muted font-mono text-xs capitalize">{c.toLowerCase()}</span>
          </div>
        ))}
      </div>

      {/* Lap ruler */}
      <div className="flex items-center mb-1 ml-24">
        <div className="relative flex-1 h-3">
          {[0,25,50,75,100].map(pct=>{
            const lap = Math.round((pct/100)*totalLaps);
            return <span key={pct} className="absolute text-[9px] font-mono text-f1muted/50 -translate-x-1/2" style={{left:`${pct}%`}}>{lap>0?lap:''}</span>;
          })}
        </div>
      </div>

      {/* Strategy bars */}
      <div className="space-y-1.5 overflow-y-auto" style={{maxHeight: driverFilter==='ALL'?'520px':'auto'}}>
        {display.map(driver => {
          const dstints = stints.byDriver[driver.driverNumber] ?? [];
          return (
            <div key={driver.code} className="flex items-center gap-2">
              <div className="shrink-0 flex items-center gap-1.5" style={{width:88}}>
                <div className="w-0.5 h-5 rounded-full shrink-0" style={{background:driver.teamColor}}/>
                <div>
                  <p className="text-white font-mono text-xs font-semibold leading-none">{driver.code}</p>
                  <p className="text-f1muted font-mono text-[9px] leading-none">P{driver.pos}</p>
                </div>
              </div>
              <div className="relative flex-1 h-7 bg-f1border/30 rounded-sm overflow-visible">
                {dstints.map((stint,i) => {
                  const c = COMPOUNDS[stint.compound] ?? COMPOUNDS.UNKNOWN;
                  const lapW = ((stint.lapEnd - stint.lapStart + 1) / totalLaps) * 100;
                  const leftOff = ((stint.lapStart - 1) / totalLaps) * 100;
                  return (
                    <div key={i} title={`${stint.compound} · L${stint.lapStart}–${stint.lapEnd} · ${stint.lapEnd-stint.lapStart+1} laps${stint.tyreAgeAtStart>0?` · +${stint.tyreAgeAtStart} aged`:''}`}
                      className="absolute top-0 h-full rounded-sm border border-black/30 flex items-center justify-center overflow-hidden group cursor-default hover:opacity-80 transition-opacity"
                      style={{left:`${leftOff}%`,width:`${lapW}%`,minWidth:2,background:c.bg}}>
                      {lapW > 8 && <span className="text-[10px] font-bold font-mono" style={{color:c.text}}>{c.label}·{stint.lapEnd-stint.lapStart+1}L</span>}
                      <div className="hidden group-hover:flex absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-f1card border border-f1border rounded px-2 py-1 text-[10px] font-mono text-white whitespace-nowrap z-10 shadow-xl pointer-events-none">
                        {stint.compound} · L{stint.lapStart}–{stint.lapEnd} · {stint.lapEnd-stint.lapStart+1} laps
                        {stint.tyreAgeAtStart>0?` · +${stint.tyreAgeAtStart} aged`:''}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1 shrink-0 w-14 justify-end">
                {dstints.map((s,i)=><Badge key={i} compound={s.compound}/>)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Single driver detail */}
      {driverFilter !== 'ALL' && display[0] && (
        <div className="mt-4 pt-4 border-t border-f1border">
          <p className="text-f1muted font-mono text-xs uppercase tracking-widest mb-3">Stint Breakdown — {display[0].fullName}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(stints.byDriver[display[0].driverNumber] ?? []).map((stint,i)=>(
              <div key={i} className="f1-card p-3 flex items-start gap-2">
                <Badge compound={stint.compound} size="lg"/>
                <div>
                  <p className="text-white font-mono text-xs font-bold capitalize">{stint.compound.toLowerCase()}</p>
                  <p className="text-f1muted font-mono text-[10px]">L{stint.lapStart}–{stint.lapEnd}</p>
                  <p className="text-f1muted font-mono text-[10px]">{stint.lapEnd-stint.lapStart+1} laps</p>
                  {stint.tyreAgeAtStart>0 && <p className="text-orange-400 font-mono text-[10px]">+{stint.tyreAgeAtStart} aged</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
