import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { getLapTimes, getTeamColor, getLastRaceResults } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useMultiF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

const DRIVER_COLORS = [
  '#E10600', '#3671C6', '#FF8000', '#00A19B', '#006EFF',
  '#FFD700', '#52E252', '#FF87BC', '#2B4562', '#B6BABD',
  '#E10600', '#3671C6', '#FF8000', '#00A19B', '#006EFF',
  '#FFD700', '#52E252', '#FF87BC', '#2B4562', '#B6BABD',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-f1card border border-f1border rounded p-3 shadow-xl max-h-60 overflow-y-auto">
      <p className="text-f1muted font-mono text-xs mb-2">Lap {label}</p>
      {payload
        .sort((a, b) => a.value - b.value)
        .map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-white font-mono text-xs">{p.name}</span>
            </div>
            <span className="number-font text-f1muted text-xs">P{p.value}</span>
          </div>
        ))}
    </div>
  );
};

export default function PositionChart() {
  const { season } = useApp();
  const [selectedDrivers, setSelectedDrivers] = useState([]);

  const { data, loading, error } = useMultiF1Data({
    laps: () => getLapTimes(season, 'last'),
    race: () => getLastRaceResults(),
  }, [season], 120_000);

  const { chartData, drivers } = useMemo(() => {
    if (!data.laps?.length || !data.race) return { chartData: [], drivers: [] };

    // Build position map: lap → { driver: position }
    const lapMap = {};
    data.laps.forEach(lap => {
      const lapNum = parseInt(lap.number);
      lapMap[lapNum] = {};
      lap.Timings?.forEach(timing => {
        lapMap[lapNum][timing.driverId] = parseInt(timing.position);
      });
    });

    const driverIds = [...new Set(data.laps.flatMap(l => l.Timings?.map(t => t.driverId) ?? []))];
    const filtered = selectedDrivers.length ? selectedDrivers : driverIds.slice(0, 6);

    const chartData = Object.entries(lapMap)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([lap, positions]) => {
        const row = { lap: parseInt(lap) };
        filtered.forEach(d => { if (positions[d]) row[d] = positions[d]; });
        return row;
      });

    return { chartData, drivers: driverIds };
  }, [data, selectedDrivers]);

  const toggleDriver = (d) => {
    setSelectedDrivers(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  if (loading) return (
    <div className="f1-card p-4">
      <SectionHeader title="Race Position Chart" accent />
      <div className="h-64 shimmer rounded" />
    </div>
  );
  if (error || !chartData.length) return <ErrorCard message={error || 'No lap data available for this race'} />;

  const displayDrivers = selectedDrivers.length ? selectedDrivers : drivers.slice(0, 6);

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader
        title="Race Position Chart"
        subtitle={`${data.race?.raceName ?? ''} · Select drivers below`}
        accent
      />

      {/* Driver filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {drivers.map((d, i) => (
          <button
            key={d}
            onClick={() => toggleDriver(d)}
            style={selectedDrivers.includes(d) || !selectedDrivers.length ? { borderColor: DRIVER_COLORS[i % DRIVER_COLORS.length] } : {}}
            className={`px-2 py-0.5 rounded border text-xs font-mono transition-all ${
              selectedDrivers.includes(d) ? 'text-white' : 'border-f1border text-f1muted hover:text-white'
            }`}
          >
            {d.toUpperCase().slice(0, 3)}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" />
          <XAxis
            dataKey="lap"
            tick={{ fill: '#888', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            label={{ value: 'Lap', position: 'insideBottomRight', offset: 0, fill: '#888', fontSize: 11 }}
          />
          <YAxis
            reversed
            domain={[1, 20]}
            ticks={[1, 5, 10, 15, 20]}
            tick={{ fill: '#888', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            label={{ value: 'Position', angle: -90, position: 'insideLeft', fill: '#888', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          {displayDrivers.map((driver, i) => (
            <Line
              key={driver}
              type="monotone"
              dataKey={driver}
              stroke={DRIVER_COLORS[i % DRIVER_COLORS.length]}
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
