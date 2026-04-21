import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getStandingsProgression, getTeamColor } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { ErrorCard, SectionHeader } from './LoadingCard';

const COLORS = ['#E10600','#3671C6','#FF8000','#00A19B','#006EFF','#FFD700','#52E252','#FF87BC','#2B4562','#B6BABD'];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-f1card border border-f1border rounded p-3 shadow-xl max-h-56 overflow-y-auto">
      <p className="text-f1muted font-mono text-xs mb-1">Round {label}</p>
      {[...payload].sort((a,b)=>b.value-a.value).map((p,i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{background:p.color}}/>
            <span className="text-white font-mono text-xs">{p.name}</span>
          </div>
          <span className="number-font text-f1muted text-xs">{p.value > 0 ? `+${p.value}` : p.value}pts</span>
        </div>
      ))}
    </div>
  );
};

export default function GapToLeader() {
  const { season } = useApp();
  const { data, loading, error } = useF1Data(() => getStandingsProgression(season), [season], 120_000);

  const { chartData, drivers } = useMemo(() => {
    if (!data?.length) return { chartData: [], drivers: [] };
    const driverSet = new Set();
    data.forEach(r => r.standings.forEach(s => driverSet.add(s.driver)));
    const drivers = Array.from(driverSet);

    const chartData = data.map(round => {
      const row = { round: round.round };
      const leaderPts = round.standings.reduce((m, s) => Math.max(m, s.points), 0);
      round.standings.forEach(s => { row[s.driver] = s.points - leaderPts; }); // gap (0 or negative)
      return row;
    });
    return { chartData, drivers };
  }, [data]);

  if (loading) return <div className="f1-card p-4"><div className="h-64 shimmer rounded mt-3"/></div>;
  if (error) return <ErrorCard message={error}/>;
  if (!chartData.length) return <ErrorCard message="No progression data yet"/>;

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title="Gap to Leader" subtitle="Points behind the championship leader each round" accent/>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{top:5,right:10,left:0,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E"/>
          <XAxis dataKey="round" tick={{fill:'#888',fontSize:11,fontFamily:'JetBrains Mono'}}/>
          <YAxis tick={{fill:'#888',fontSize:11,fontFamily:'JetBrains Mono'}} tickFormatter={v => v === 0 ? '0' : v}/>
          <Tooltip content={<Tip/>}/>
          {drivers.map((d,i) => (
            <Line key={d} type="monotone" dataKey={d} stroke={COLORS[i%COLORS.length]} strokeWidth={1.5} dot={false}/>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
