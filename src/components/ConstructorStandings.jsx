import React from 'react';
import { getConstructorStandings, getTeamColor } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

export default function ConstructorStandings() {
  const { season } = useApp();
  const { data, loading, error } = useF1Data(
    () => getConstructorStandings(season),
    [season],
    30_000
  );

  if (loading) return <LoadingCard rows={10} />;
  if (error) return <ErrorCard message={error} />;
  if (!data?.length) return <ErrorCard message="No constructor data available" />;

  const maxPts = Math.max(...data.map(s => parseInt(s.points)));

  return (
    <div className="f1-card overflow-hidden animate-slide-up">
      <div className="p-4 border-b border-f1border">
        <SectionHeader title="Constructor Championship" accent />
      </div>

      <div className="p-4 space-y-3">
        {data.map((standing, i) => {
          const teamColor = getTeamColor(standing.Constructor.name);
          const pct = (parseInt(standing.points) / maxPts) * 100;
          return (
            <div key={standing.Constructor.constructorId} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-f1muted font-mono text-xs w-4 text-center">{standing.position}</span>
                  <div className="w-2 h-2 rounded-full" style={{ background: teamColor }} />
                  <span className="font-display font-semibold text-white text-sm">
                    {standing.Constructor.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-f1muted font-mono text-xs hidden sm:block">{standing.wins}W</span>
                  <span className="number-font font-bold text-white">{standing.points}</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-f1border rounded-full overflow-hidden ml-6">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: teamColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
