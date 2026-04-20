import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { getStandingsProgression } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { ErrorCard, SectionHeader } from './LoadingCard';

// 20 distinct colors for all drivers on the grid
const DRIVER_COLORS = [
  '#E10600', '#3671C6', '#FF8000', '#00A19B', '#006EFF',
  '#FFD700', '#52E252', '#FF87BC', '#2B4562', '#B6BABD',
  '#FF5555', '#55AAFF', '#FFBB33', '#00DDBB', '#6699FF',
  '#EECC11', '#99EE99', '#FFAACC', '#6688BB', '#EEEEEE',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const visible = payload.filter(p => p.value !== undefined && p.value !== null);
  return (
    <div className="bg-f1card border border-f1border rounded p-3 shadow-xl max-h-72 overflow-y-auto">
      <p className="text-f1muted font-mono text-xs mb-2">Round {label}</p>
      {[...visible]
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
  const [hiddenDrivers, setHiddenDrivers] = useState(new Set());

  const { data, loading, error } = useF1Data(
    () => getStandingsProgression(season),
    [season],
    120_000
  );

  const { chartData, allDrivers } = useMemo(() => {
    if (!data?.length) return { chartData: [], allDrivers: [] };

    // Collect ALL unique drivers — no slice
    const driverSet = new Set();
    data.forEach(r => r.standings.forEach(s => driverSet.add(s.driver)));
    const allDrivers = Array.from(driverSet);

    const chartData = data.map(round => {
      const row = { round: round.round, raceName: round.raceName };
      round.standings.forEach(s => { row[s.driver] = s.points; });
      return row;
    });

    return { chartData, allDrivers };
  }, [data]);

  const toggleDriver = (driver) => {
    setHiddenDrivers(prev => {
      const next = new Set(prev);
      next.has(driver) ? next.delete(driver) : next.add(driver);
      return next;
    });
  };

  if (loading) return (
    <div className="f1-card p-4">
      <SectionHeader title="Championship Progression" accent />
      <div className="h-64 shimmer rounded mt-4" />
    </div>
  );
  if (error) return <ErrorCard message={error} />;
  if (!chartData.length) return <ErrorCard message="No progression data yet — check back after the first race" />;

  return (
    <div className="f1-card p-4 animate-slide-up">
      <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
        <SectionHeader title="Championship Progression" subtitle="Points across the season · click drivers to toggle" accent />
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => setHiddenDrivers(new Set())}
            className="px-2 py-0.5 text-xs font-mono border border-f1border text-f1muted hover:text-white hover:border-f1muted rounded transition-colors"
          >All</button>
          <button
            onClick={() => setHiddenDrivers(new Set(allDrivers.slice(5)))}
            className="px-2 py-0.5 text-xs font-mono border border-f1border text-f1muted hover:text-white hover:border-f1muted rounded transition-colors"
          >Top 5</button>
          <button
            onClick={() => setHiddenDrivers(new Set(allDrivers))}
            className="px-2 py-0.5 text-xs font-mono border border-f1border text-f1muted hover:text-white hover:border-f1muted rounded transition-colors"
          >None</button>
        </div>
      </div>

      {/* All driver toggle pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {allDrivers.map((driver, i) => {
          const color = DRIVER_COLORS[i % DRIVER_COLORS.length];
          const isVisible = !hiddenDrivers.has(driver);
          return (
            <button
              key={driver}
              onClick={() => toggleDriver(driver)}
              style={isVisible ? { background: color + '22', borderColor: color, color } : {}}
              className={`px-2 py-0.5 rounded border text-xs font-mono font-semibold transition-all ${
                isVisible ? '' : 'border-f1border text-f1border hover:text-f1muted hover:border-f1muted'
              }`}
            >
              {driver}
            </button>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" />
          <XAxis
            dataKey="round"
            tick={{ fill: '#888', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            label={{ value: 'Round', position: 'insideBottomRight', offset: 0, fill: '#888', fontSize: 11 }}
          />
          <YAxis tick={{ fill: '#888', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
          <Tooltip content={<CustomTooltip />} />
          {allDrivers.map((driver, i) => (
            <Line
              key={driver}
              type="monotone"
              dataKey={driver}
              stroke={DRIVER_COLORS[i % DRIVER_COLORS.length]}
              strokeWidth={2}
              dot={false}
              hide={hiddenDrivers.has(driver)}
              activeDot={hiddenDrivers.has(driver) ? false : { r: 4, fill: DRIVER_COLORS[i % DRIVER_COLORS.length] }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
