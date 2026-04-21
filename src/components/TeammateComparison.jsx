import React from 'react';
import { getTeammateComparison } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

export default function TeammateComparison() {
  const { season } = useApp();
  const { data, loading, error } = useF1Data(
    () => getTeammateComparison(season),
    [season], 300_000
  );

  if (loading) return <LoadingCard rows={5}/>;
  if (error)   return <ErrorCard message={error}/>;
  if (!data?.length) return <ErrorCard message="No teammate data available"/>;

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title="Teammate Head-to-Head" subtitle="Race finishes — last 10 races" accent/>
      <div className="space-y-4 mt-2">
        {data.map(({ d1, d2, d1Ahead, d2Ahead, racesCompared }) => {
          const total = d1Ahead + d2Ahead || 1;
          const d1Pct = Math.round((d1Ahead / total) * 100);
          return (
            <div key={d1.driverId} className="space-y-2">
              {/* Team label */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{background: d1.teamColor}}/>
                <span className="text-f1muted font-mono text-xs">{d1.teamName}</span>
                <span className="text-f1muted/50 font-mono text-xs ml-auto">{racesCompared} races</span>
              </div>
              {/* Bar */}
              <div className="flex items-center gap-2">
                <span className="text-white font-mono text-xs font-bold w-10 text-right">{d1.code}</span>
                <div className="flex-1 h-6 bg-f1border/30 rounded overflow-hidden flex">
                  <div className="h-full flex items-center justify-end pr-2 transition-all duration-700"
                    style={{width: `${d1Pct}%`, background: d1.teamColor, minWidth: d1Ahead > 0 ? 28 : 0}}>
                    {d1Ahead > 0 && <span className="text-white font-mono text-xs font-bold">{d1Ahead}</span>}
                  </div>
                  <div className="h-full flex items-center justify-start pl-2 transition-all duration-700"
                    style={{width: `${100 - d1Pct}%`, background: d1.teamColor + '66', minWidth: d2Ahead > 0 ? 28 : 0}}>
                    {d2Ahead > 0 && <span className="text-white font-mono text-xs font-bold">{d2Ahead}</span>}
                  </div>
                </div>
                <span className="text-white font-mono text-xs font-bold w-10">{d2.code}</span>
              </div>
              {/* Points */}
              <div className="flex justify-between px-12">
                <span className="text-f1muted font-mono text-xs">{d1.points} pts</span>
                <span className="text-f1muted font-mono text-xs">{d2.points} pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
