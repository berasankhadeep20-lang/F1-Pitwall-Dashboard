import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { getFastestLaps, getLastRaceResults, parseLapTime, formatLapTime, getTeamColor } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useMultiF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-f1card border border-f1border rounded p-3 shadow-xl">
      <p className="text-white font-display font-semibold text-sm">{d.driver}</p>
      <p className="text-f1muted font-mono text-xs">{d.team}</p>
      <div className="mt-2 space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-f1muted font-mono text-xs">Time</span>
          <span className="number-font text-white text-xs font-bold">{d.timeStr}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-f1muted font-mono text-xs">Lap</span>
          <span className="number-font text-f1muted text-xs">{d.lap}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-f1muted font-mono text-xs">Speed</span>
          <span className="number-font text-f1muted text-xs">{d.speed} km/h</span>
        </div>
      </div>
    </div>
  );
};

export default function FastestLaps() {
  const { season } = useApp();
  const { data, loading, error } = useMultiF1Data({
    fastest: () => getFastestLaps(season, 'last'),
    race: () => getLastRaceResults(),
  }, [season], 60_000);

  if (loading) return (
    <div className="f1-card p-4">
      <SectionHeader title="Fastest Laps" accent />
      <div className="h-64 shimmer rounded" />
    </div>
  );
  if (error) return <ErrorCard message={error} />;

  const fastest = data.fastest ?? [];
  if (!fastest.length) return <ErrorCard message="No fastest lap data available" />;

  const bestTime = parseLapTime(fastest[0]?.FastestLap?.Time?.time);

  const chartData = fastest.slice(0, 15).map(r => {
    const lapTime = parseLapTime(r.FastestLap?.Time?.time);
    return {
      driver: r.Driver?.code || r.Driver?.familyName?.slice(0, 3).toUpperCase(),
      fullName: `${r.Driver?.givenName} ${r.Driver?.familyName}`,
      team: r.Constructor?.name,
      time: lapTime,
      timeStr: r.FastestLap?.Time?.time,
      delta: lapTime - bestTime,
      lap: r.FastestLap?.lap,
      speed: parseFloat(r.FastestLap?.AverageSpeed?.speed ?? 0).toFixed(1),
      color: getTeamColor(r.Constructor?.name),
      rank: parseInt(r.FastestLap?.rank ?? 99),
    };
  }).sort((a, b) => a.time - b.time);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Chart */}
      <div className="f1-card p-4">
        <SectionHeader
          title="Fastest Laps"
          subtitle={data.race?.raceName ?? ''}
          accent
        />

        {/* Pole highlight */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-f1red/10 border border-f1red/20 rounded">
          <span className="text-2xl">⚡</span>
          <div>
            <p className="text-white font-display font-bold text-sm">
              {chartData[0]?.fullName}
            </p>
            <p className="text-f1muted font-mono text-xs">{chartData[0]?.team}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="number-font text-f1red font-bold text-lg">{chartData[0]?.timeStr}</p>
            <p className="text-f1muted font-mono text-xs">Fastest Lap</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" horizontal={false} />
            <XAxis
              type="number"
              domain={[bestTime - 0.5, 'auto']}
              tickFormatter={formatLapTime}
              tick={{ fill: '#888', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            />
            <YAxis
              type="category"
              dataKey="driver"
              width={35}
              tick={{ fill: '#ccc', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="time" radius={[0, 3, 3, 0]} barSize={14}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="f1-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-f1border">
                <th className="text-left text-f1muted font-mono text-xs uppercase px-4 py-2">Rank</th>
                <th className="text-left text-f1muted font-mono text-xs uppercase px-4 py-2">Driver</th>
                <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2">Time</th>
                <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2">Gap</th>
                <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2 hidden sm:table-cell">Lap</th>
                <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2 hidden md:table-cell">Speed</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, i) => (
                <tr key={row.driver} className="border-b border-f1border/50 hover:bg-f1border/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className={`number-font font-bold text-sm ${i === 0 ? 'text-f1red' : 'text-f1muted'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-0.5 h-6 rounded-full" style={{ background: row.color }} />
                      <div>
                        <span className="font-display font-semibold text-white text-sm">{row.fullName}</span>
                        <p className="text-f1muted font-mono text-xs">{row.team}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`number-font text-xs font-bold ${i === 0 ? 'text-f1red' : 'text-white'}`}>
                      {row.timeStr}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="number-font text-f1muted text-xs">
                      {i === 0 ? '—' : `+${row.delta.toFixed(3)}`}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                    <span className="number-font text-f1muted text-xs">{row.lap}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right hidden md:table-cell">
                    <span className="number-font text-f1muted text-xs">{row.speed}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
