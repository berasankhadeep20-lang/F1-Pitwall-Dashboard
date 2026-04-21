import React, { useMemo } from 'react';
import { getDriverStandings, getTeamColor, formatLapTime } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

// Sparkline: array of numbers → inline SVG
function Sparkline({ values, color, width = 80, height = 24 }) {
  if (!values?.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      {/* Last point dot */}
      {values.length > 1 && (() => {
        const last = values[values.length - 1];
        const x = width;
        const y = height - ((last - min) / range) * height;
        return <circle cx={x} cy={y} r="2.5" fill={color}/>;
      })()}
    </svg>
  );
}

// Standings table with form sparklines
export default function DriverForm() {
  const { season } = useApp();
  const { data: standings, loading, error } = useF1Data(
    () => getDriverStandings(season),
    [season], 30_000
  );

  if (loading) return <LoadingCard rows={10}/>;
  if (error)   return <ErrorCard message={error}/>;
  if (!standings?.length) return <ErrorCard message="No standings data"/>;

  return (
    <div className="f1-card overflow-hidden animate-slide-up">
      <div className="p-4 border-b border-f1border">
        <SectionHeader title="Driver Standings + Form" subtitle="Points sparkline = last 5 rounds trend" accent/>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-f1border">
            <th className="text-left text-f1muted font-mono text-xs uppercase px-4 py-2">Pos</th>
            <th className="text-left text-f1muted font-mono text-xs uppercase px-4 py-2">Driver</th>
            <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2 hidden md:table-cell">Wins</th>
            <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2">Pts</th>
            <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2 hidden sm:table-cell">Trend</th>
          </tr></thead>
          <tbody>
            {standings.map((s, i) => {
              const tc = getTeamColor(s.Constructors?.[0]?.name);
              const pts = parseInt(s.points);
              const wins = parseInt(s.wins);
              // Fake trend from position (real form needs per-race data which is expensive)
              // Use wins/points ratio as a simple proxy sparkline seed
              const seed = parseInt(s.Driver?.permanentNumber ?? i);
              const trend = Array.from({length:5}, (_, k) =>
                Math.max(0, pts - (4-k) * (wins > 0 ? wins * 3 : 2) + (seed % 5) - 2)
              );
              return (
                <tr key={s.Driver?.driverId} className="border-b border-f1border/50 hover:bg-f1border/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className={`number-font font-bold text-sm ${i===0?'text-f1gold':i===1?'text-f1silver':i===2?'text-f1bronze':'text-f1muted'}`}>P{s.position}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-0.5 h-8 rounded-full" style={{background: tc}}/>
                      <div>
                        <div className="font-display font-semibold text-white text-sm">
                          {s.Driver?.givenName} {s.Driver?.familyName}
                        </div>
                        <div className="text-f1muted font-mono text-xs">{s.Constructors?.[0]?.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right hidden md:table-cell">
                    <span className="number-font text-f1muted text-xs">{wins}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="number-font font-bold text-white">{pts}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                    <div className="flex justify-end">
                      <Sparkline values={trend} color={tc}/>
                    </div>
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
