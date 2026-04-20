import React from 'react';
import { getQualifyingResults, getTeamColor } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

export default function QualifyingResults() {
  const { season, selectedRound } = useApp();
  const round = selectedRound ?? 'last';

  const { data, loading, error } = useF1Data(
    () => getQualifyingResults(season, round),
    [season, round], 60_000
  );

  if (loading) return <LoadingCard rows={10}/>;
  if (error || !data) return <ErrorCard message={error || 'No qualifying data for this race'}/>;

  const results = data.QualifyingResults ?? [];

  return (
    <div className="f1-card overflow-hidden animate-slide-up">
      <div className="p-4 border-b border-f1border">
        <SectionHeader title="Qualifying" subtitle={`${data.raceName ?? ''} · ${data.date ?? ''}`} accent/>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-f1border">
            <th className="text-left text-f1muted font-mono text-xs uppercase px-4 py-2">Pos</th>
            <th className="text-left text-f1muted font-mono text-xs uppercase px-4 py-2">Driver</th>
            <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2 hidden sm:table-cell">Q1</th>
            <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2 hidden md:table-cell">Q2</th>
            <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2">Q3</th>
          </tr></thead>
          <tbody>
            {results.map((r,i) => {
              const tc = getTeamColor(r.Constructor?.name);
              const isTop3 = i < 3;
              return (
                <tr key={r.Driver?.driverId} className={`border-b border-f1border/50 hover:bg-f1border/20 transition-colors ${isTop3?'bg-f1border/10':''}`}>
                  <td className="px-4 py-2.5">
                    <span className={`number-font font-bold text-sm ${i===0?'text-f1gold':i===1?'text-f1silver':i===2?'text-f1bronze':'text-f1muted'}`}>
                      P{r.position}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-0.5 h-7 rounded-full" style={{background:tc}}/>
                      <div>
                        <div className="font-display font-semibold text-white text-sm">{r.Driver?.givenName} {r.Driver?.familyName}</div>
                        <div className="text-f1muted font-mono text-xs">{r.Constructor?.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                    <span className="number-font text-f1muted text-xs">{r.Q1 || '—'}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right hidden md:table-cell">
                    <span className="number-font text-f1muted text-xs">{r.Q2 || '—'}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`number-font text-xs font-bold ${r.Q3?'text-white':'text-f1muted'}`}>{r.Q3 || (r.Q2 || r.Q1 || '—')}</span>
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
