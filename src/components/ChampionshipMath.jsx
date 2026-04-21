import React from 'react';
import { getChampionshipMath } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

export default function ChampionshipMath() {
  const { season } = useApp();
  const { data, loading, error } = useF1Data(() => getChampionshipMath(season), [season], 60_000);

  if (loading) return <LoadingCard rows={5}/>;
  if (error) return <ErrorCard message={error}/>;
  if (!data?.length) return null;

  const contenders = data.filter(d => d.canWin);
  const eliminated = data.filter(d => !d.canWin);
  const leader = data[0];
  const maxPossible = leader.maxPossible;

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title="Championship Math" subtitle="Who can still win the WDC?" accent/>
      <div className="space-y-2 mt-2">
        {data.slice(0, 12).map((d, i) => {
          const pct = (d.maxPossible / maxPossible) * 100;
          return (
            <div key={d.code} className="flex items-center gap-2">
              <span className="text-f1muted font-mono text-xs w-8 text-right">{d.code}</span>
              <div className="flex-1 h-5 bg-f1border/30 rounded overflow-hidden relative">
                <div className="h-full rounded transition-all duration-700"
                  style={{ width: `${pct}%`, background: d.canWin ? d.teamColor : '#333' }}/>
                <span className="absolute inset-0 flex items-center px-2 text-[10px] font-mono text-white/80">
                  {d.points}pts {d.canWin ? `(max ${d.maxPossible})` : '❌ Eliminated'}
                </span>
              </div>
              <span className="text-f1muted font-mono text-[10px] w-14 text-right">
                {d.gap === 0 ? '🏆 Leader' : `-${d.gap}pts`}
              </span>
            </div>
          );
        })}
      </div>
      {eliminated.length > 0 && (
        <p className="text-f1muted font-mono text-xs mt-3">
          {eliminated.length} driver{eliminated.length > 1 ? 's' : ''} mathematically eliminated
        </p>
      )}
    </div>
  );
}
