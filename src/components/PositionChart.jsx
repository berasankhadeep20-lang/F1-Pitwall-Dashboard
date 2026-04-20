import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getLapTimes, getRaceResults, getTeamColor } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useMultiF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

const COLORS = [
  '#E10600','#3671C6','#FF8000','#00A19B','#006EFF','#FFD700',
  '#52E252','#FF87BC','#2B4562','#B6BABD','#FF5555','#55AAFF',
  '#FFBB33','#00DDBB','#6699FF','#EECC11','#99EE99','#FFAACC','#6688BB','#EEEEEE',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-f1card border border-f1border rounded p-3 shadow-xl max-h-60 overflow-y-auto">
      <p className="text-f1muted font-mono text-xs mb-2">Lap {label}</p>
      {[...payload].sort((a,b)=>a.value-b.value).map((p,i)=>(
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{background:p.color}}/>
            <span className="text-white font-mono text-xs">{p.name}</span>
          </div>
          <span className="number-font text-f1muted text-xs">P{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function PositionChart() {
  const { season, selectedRound } = useApp();
  const round = selectedRound ?? 'last';
  const [selected, setSelected] = useState([]);

  const { data, loading, error } = useMultiF1Data({
    laps: () => getLapTimes(season, round),
    race: () => getRaceResults(season, round),
  }, [season, round], 120_000);

  const { chartData, allDrivers } = useMemo(() => {
    if (!data.laps?.length || !data.race) return { chartData: [], allDrivers: [] };
    const driverLapMap = {};
    data.laps.forEach(lap => {
      const n = parseInt(lap.number);
      lap.Timings?.forEach(t => {
        if (!driverLapMap[t.driverId]) driverLapMap[t.driverId] = {};
        driverLapMap[t.driverId][n] = parseInt(t.position);
      });
    });
    const allDrivers = Object.keys(driverLapMap);
    const active = selected.length ? selected : allDrivers.slice(0, 6);
    const maxLap = Math.max(...Object.values(driverLapMap).flatMap(d => Object.keys(d).map(Number)));
    const chartData = Array.from({length: maxLap}, (_,i) => {
      const row = { lap: i+1 };
      active.forEach(d => { if (driverLapMap[d]?.[i+1]) row[d] = driverLapMap[d][i+1]; });
      return row;
    });
    return { chartData, allDrivers };
  }, [data, selected]);

  const toggle = d => setSelected(p => p.includes(d) ? p.filter(x=>x!==d) : [...p, d]);
  const display = selected.length ? selected : allDrivers.slice(0,6);

  if (loading) return <LoadingCard rows={8} />;
  if (error) return <ErrorCard message={error} />;
  if (!chartData.length) return <ErrorCard message="No lap data for this race" />;

  return (
    <div className="f1-card p-4 animate-slide-up">
      <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
        <SectionHeader title="Race Position Chart" subtitle={`${data.race?.raceName ?? ''} · click to filter`} accent />
        <button onClick={()=>setSelected([])} className="px-2 py-0.5 text-xs font-mono border border-f1border text-f1muted hover:text-white rounded transition-colors">Reset</button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {allDrivers.map((d,i) => {
          const on = display.includes(d);
          return (
            <button key={d} onClick={()=>toggle(d)}
              style={on ? {borderColor: COLORS[i%COLORS.length], color: COLORS[i%COLORS.length], background: COLORS[i%COLORS.length]+'18'} : {}}
              className={`px-2 py-0.5 rounded border text-xs font-mono transition-all ${on?'':'border-f1border text-f1border hover:text-f1muted'}`}>
              {d.slice(0,3).toUpperCase()}
            </button>
          );
        })}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{top:5,right:10,left:-20,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E"/>
          <XAxis dataKey="lap" tick={{fill:'#888',fontSize:11,fontFamily:'JetBrains Mono'}}/>
          <YAxis reversed domain={[1,20]} ticks={[1,5,10,15,20]} tick={{fill:'#888',fontSize:11,fontFamily:'JetBrains Mono'}}/>
          <Tooltip content={<CustomTooltip/>}/>
          {display.map((d,i) => (
            <Line key={d} type="monotone" dataKey={d} stroke={COLORS[allDrivers.indexOf(d)%COLORS.length]} strokeWidth={1.5} dot={false} connectNulls/>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
