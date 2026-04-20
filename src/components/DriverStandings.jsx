import React from 'react';
import { getDriverStandings, getTeamColor } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

function PositionBadge({ pos }) {
  const cls = pos === 1 ? 'pos-1' : pos === 2 ? 'pos-2' : pos === 3 ? 'pos-3' : 'bg-f1border text-f1muted';
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-mono font-bold ${cls}`}>
      {pos}
    </span>
  );
}

export default function DriverStandings() {
  const { season } = useApp();
  const { data, loading, error } = useF1Data(
    () => getDriverStandings(season),
    [season],
    30_000
  );

  if (loading) return <LoadingCard title rows={10} />;
  if (error) return <ErrorCard message={error} />;
  if (!data?.length) return <ErrorCard message="No standings data available" />;

  return (
    <div className="f1-card overflow-hidden animate-slide-up">
      <div className="p-4 border-b border-f1border">
        <SectionHeader title="Driver Championship" accent />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-f1border">
              <th className="text-left text-f1muted font-mono text-xs uppercase px-4 py-2">Pos</th>
              <th className="text-left text-f1muted font-mono text-xs uppercase px-4 py-2">Driver</th>
              <th className="text-left text-f1muted font-mono text-xs uppercase px-4 py-2 hidden sm:table-cell">Team</th>
              <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2">Pts</th>
              <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2 hidden md:table-cell">Wins</th>
            </tr>
          </thead>
          <tbody>
            {data.map((standing, i) => {
              const teamColor = getTeamColor(standing.Constructors?.[0]?.name);
              const isTop3 = i < 3;
              return (
                <tr
                  key={standing.Driver.driverId}
                  className={`border-b border-f1border/50 transition-colors hover:bg-f1border/30 ${isTop3 ? 'bg-f1border/10' : ''}`}
                >
                  <td className="px-4 py-2.5">
                    <PositionBadge pos={parseInt(standing.position)} />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {/* Team color bar */}
                      <div className="w-0.5 h-8 rounded-full" style={{ background: teamColor }} />
                      <div>
                        <div className="font-display font-semibold text-white text-sm">
                          {standing.Driver.givenName} {standing.Driver.familyName}
                        </div>
                        <div className="text-f1muted font-mono text-xs">
                          {standing.Driver.code || standing.Driver.familyName.slice(0, 3).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <span className="text-f1muted text-xs font-display">
                      {standing.Constructors?.[0]?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="number-font font-bold text-white">{standing.points}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right hidden md:table-cell">
                    <span className="number-font text-f1muted">{standing.wins}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
