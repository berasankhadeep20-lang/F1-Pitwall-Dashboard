import React, { useMemo, useState } from 'react';
import { getLiveLaps, getLiveDrivers } from '../utils/openf1';
import { useMultiF1Data } from '../hooks/useF1Data';
import { SectionHeader } from './LoadingCard';

export default function OvertakeTracker({ sessionKey }) {
  const [highlight, setHighlight] = useState(null);
  const { data, loading } = useMultiF1Data({
    laps: () => getLiveLaps(sessionKey),
    drivers: () => getLiveDrivers(sessionKey),
  }, [sessionKey], 30_000);

  const { overtakes, positionChanges } = useMemo(() => {
    const { allLaps = [] } = data.laps ?? {};
    if (!allLaps.length) return { overtakes: [], positionChanges: {} };
    const lapPos = {};
    for (const l of allLaps) {
      if (!lapPos[l.lap_number]) lapPos[l.lap_number] = {};
      lapPos[l.lap_number][l.driver_number] = l.position ?? null;
    }
    const laps = Object.keys(lapPos).map(Number).sort((a,b)=>a-b);
    const overtakes = [], positionChanges = {};
    for (let i = 1; i < laps.length; i++) {
      const prev = lapPos[laps[i-1]]??{}, curr = lapPos[laps[i]]??{};
      for (const [n, cp] of Object.entries(curr)) {
        const pp = prev[n];
        if (pp && cp && pp !== cp) overtakes.push({ lap:laps[i], driverNum:parseInt(n), from:pp, to:cp, gained:pp>cp });
      }
    }
    const first = lapPos[laps[0]]??{}, last = lapPos[laps[laps.length-1]]??{};
    for (const [n, sp] of Object.entries(first)) {
      const ep = last[n];
      if (ep) positionChanges[n] = sp - ep;
    }
    return { overtakes, positionChanges };
  }, [data]);

  const drivers = data.drivers ?? {};
  const sorted = Object.keys(positionChanges).map(Number).sort((a,b)=>positionChanges[b]-positionChanges[a]);

  if (loading) return <div className="f1-card p-4"><div className="h-48 shimmer rounded mt-3"/></div>;
  if (!sorted.length) return (
    <div className="f1-card p-4">
      <SectionHeader title="Position Changes" accent/>
      <p className="text-f1muted font-mono text-sm text-center mt-4">Available during/after race</p>
    </div>
  );

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title="Position Changes" subtitle={`${overtakes.length} on-track moves`} accent/>
      <div className="space-y-2">
        {sorted.map(n => {
          const d = drivers[n];
          const change = positionChanges[n] ?? 0;
          const tc = d?.team_colour ? `#${d.team_colour}` : '#888';
          const dOvertakes = overtakes.filter(o=>o.driverNum===n);
          const isH = highlight===n;
          return (
            <button key={n} onClick={()=>setHighlight(isH?null:n)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${isH?'border-f1red/50 bg-f1red/5':'border-f1border hover:border-f1border/80'}`}>
              <div className="w-0.5 h-8 rounded-full shrink-0" style={{background:tc}}/>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-white text-sm">{d?.name_acronym??`#${n}`}</span>
                  <span className="text-f1muted font-mono text-xs">{d?.team_name}</span>
                </div>
                {isH && dOvertakes.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {dOvertakes.slice(0,8).map((o,i)=>(
                      <span key={i} className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${o.gained?'bg-green-900/40 text-green-400':'bg-red-900/40 text-red-400'}`}>
                        L{o.lap}: P{o.from}→P{o.to}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className={`number-font font-bold text-lg ${change>0?'text-green-400':change<0?'text-f1red':'text-f1muted'}`}>
                  {change>0?`+${change}`:change===0?'=':change}
                </span>
                <p className="text-f1muted font-mono text-[10px]">{dOvertakes.length} moves</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}