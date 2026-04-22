import React, { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getDriverStandings, getTeamColor } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { LoadingCard, SectionHeader } from './LoadingCard';

const METRICS = ['Race Pace','Qualifying','Consistency','Points','Wins','Position'];

export default function HeadToHeadRadar() {
  const { season } = useApp();
  const { data: standings, loading } = useF1Data(
    () => getDriverStandings(season), [season], 30_000
  );
  const [d1, setD1] = useState('');
  const [d2, setD2] = useState('');

  const drivers = standings ?? [];
  const maxPts = drivers.length ? parseInt(drivers[0]?.points ?? 1) : 1;

  // Initialise defaults once data arrives
  React.useEffect(() => {
    if (drivers.length >= 2 && !d1) {
      setD1(drivers[0]?.Driver?.driverId);
      setD2(drivers[1]?.Driver?.driverId);
    }
  }, [drivers]);

  function metrics(driverId) {
    const s = drivers.find(s => s.Driver?.driverId === driverId);
    if (!s) return METRICS.map(m => ({ metric: m, value: 0 }));
    const pts = parseInt(s.points ?? 0);
    const wins = parseInt(s.wins ?? 0);
    const pos = parseInt(s.position ?? 20);
    return [
      { metric: 'Race Pace',   value: Math.round((pts / maxPts) * 100) },
      { metric: 'Qualifying',  value: Math.min(100, Math.round((pts / maxPts) * 95 + wins * 2)) },
      { metric: 'Consistency', value: Math.max(10, 100 - (pos - 1) * 5) },
      { metric: 'Points',      value: Math.round((pts / maxPts) * 100) },
      { metric: 'Wins',        value: Math.min(100, wins * 10) },
      { metric: 'Position',    value: Math.max(5, 100 - (pos - 1) * 5) },
    ];
  }

  const merged = METRICS.map((m, i) => ({
    metric: m,
    [d1]: metrics(d1)[i]?.value ?? 0,
    [d2]: metrics(d2)[i]?.value ?? 0,
  }));

  const c1 = getTeamColor(drivers.find(s => s.Driver?.driverId === d1)?.Constructors?.[0]?.name ?? '');
  const c2 = getTeamColor(drivers.find(s => s.Driver?.driverId === d2)?.Constructors?.[0]?.name ?? '');

  const sel = (val, set) => (
    <select value={val} onChange={e => set(e.target.value)}
      className="bg-black border border-f1border text-white text-xs font-mono px-2 py-1 rounded focus:outline-none focus:border-f1red cursor-pointer">
      {drivers.map(s => (
        <option key={s.Driver?.driverId} value={s.Driver?.driverId}>
          {s.Driver?.code ?? s.Driver?.familyName}
        </option>
      ))}
    </select>
  );

  if (loading) return <LoadingCard rows={6}/>;

  return (
    <div className="f1-card p-4 animate-slide-up">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <SectionHeader title="Head-to-Head Radar" subtitle="Performance metrics derived from season data" accent/>
        <div className="flex items-center gap-2">
          {sel(d1, setD1)}
          <span className="text-f1muted font-mono text-xs">vs</span>
          {sel(d2, setD2)}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={merged}>
          <PolarGrid stroke="#1E1E1E"/>
          <PolarAngleAxis dataKey="metric" tick={{fill:'#888',fontSize:10,fontFamily:'JetBrains Mono'}}/>
          <Radar name={d1} dataKey={d1} stroke={c1} fill={c1} fillOpacity={0.2}/>
          <Radar name={d2} dataKey={d2} stroke={c2} fill={c2} fillOpacity={0.2}/>
          <Tooltip contentStyle={{background:'#111',border:'1px solid #1E1E1E',borderRadius:8}} labelStyle={{color:'#fff',fontFamily:'JetBrains Mono'}}/>
        </RadarChart>
      </ResponsiveContainer>
      <div className="flex gap-6 justify-center mt-2">
        {[{id:d1,c:c1},{id:d2,c:c2}].map(({id,c}) => {
          const s = drivers.find(s => s.Driver?.driverId === id);
          return s ? (
            <div key={id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{background:c}}/>
              <span className="text-white font-mono text-xs font-bold">{s.Driver?.code}</span>
              <span className="text-f1muted font-mono text-xs">{s.points}pts · P{s.position}</span>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}
