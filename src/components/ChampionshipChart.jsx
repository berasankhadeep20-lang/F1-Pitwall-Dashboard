import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { getStandingsProgression } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

const DRIVER_COLORS = [
  '#E10600', '#3671C6', '#FF8000', '#00A19B', '#006EFF',
  '#FFD700', '#52E252', '#FF87BC', '#2B4562', '#B6BABD',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-f1card border border-f1border rounded p-3 shadow-xl">
      <p className="text-f1muted font-mono text-xs mb-2">Round {label}</p>
      {payload
        .sort((a, b) => b.value - a.value)
        .map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-white font-mono text-xs">{p.name}</span>
            </div>
            <span className="number-font text-white text-xs font-bold">{p.value}</span>
          </div>
        ))}
    </div>
  );
};

export default function ChampionshipChart() {
  const { season } = useApp();
  const { data, loading, error } = useF1Data(
    () => getStandingsProgression(season),
    [season],
    120_000
  );

  const { chartData, drivers } = useMemo(() => {
    if (!data?.length) return { chartData: [], drivers: [] };

    // Collect all unique drivers
    const driverSet = new Set();
    data.forEach(r => r.standings.forEach(s => driverSet.add(s.driver)));
    const drivers = Array.from(driverSet).slice(0, 10);

    // Build recharts data
    const chartData = data.map(round => {
      const row = { round: round.round, raceName: round.raceName };
      round.standings.forEach(s => { row[s.driver] = s.points; });
      return row;
    });

    return { chartData, drivers };
  }, [data]);

  if (loading) return (
    <div className="f1-card p-4">
      <SectionHeader title="Championship Progression" accent />
      <div className="h-64 shimmer rounded" />
    </div>
  );
  if (error) return <ErrorCard message={error} />;
  if (!chartData.length) return <ErrorCard message="No progression data yet" />;

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title="Championship Progression" subtitle="Points over the season" accent />
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" />
          <XAxis
            dataKey="round"
            tick={{ fill: '#888', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            label={{ value: 'Round', position: 'insideBottom', offset: -2, fill: '#888', fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: '#888', fontSize: 11, fontFamily: 'JetBrains Mono' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: '#888' }}
          />
          {drivers.map((driver, i) => (
            <Line
              key={driver}
              type="monotone"
              dataKey={driver}
              stroke={DRIVER_COLORS[i % DRIVER_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: DRIVER_COLORS[i % DRIVER_COLORS.length] }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
