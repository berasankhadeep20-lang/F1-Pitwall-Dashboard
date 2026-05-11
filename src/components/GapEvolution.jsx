import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAllIntervals, getLiveDrivers } from '../utils/openf1';
import { useMultiF1Data } from '../hooks/useF1Data';
import { SectionHeader } from './LoadingCard';

const COLOURS = ['#E10600','#3671C6','#FF8000','#00A19B','#006EFF','#FFD700','#52E252','#FF87BC','#2B4562','#B6BABD'];

const Tip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div className="f1-card p-3 shadow-xl max-h-60 overflow-y-auto">
      <p className="text-f1muted font-mono text-xs mb-1">T+{label}</p>
      {[...payload].filter(p=>p.value!==null).sort((a,b)=>a.value-b.value).map((p,i)=>(
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{background:p.color}}/>
            <span className="text-white font-mono text-xs">{p.name}</span>
          </div>
          <span className="number-font text-f1muted text-xs">{p.value===0?'Leader':`+${Number(p.value).toFixed(3)}s`}</span>
        </div>
      ))}
    </div>
  );
};

export default function GapEvolution({ sessionKey }) {
  const [hidden, setHidden] = useState(new Set());
  const { data, loading } = useMultiF1Data({
    intervals: () => getAllIntervals(sessionKey),
    drivers: () => getLiveDrivers(sessionKey),
  }, [sessionKey], 60_000);

  const { chartData, allDrivers } = useMemo(() => {
    const intervals = data.intervals ?? [];
    if (!intervals.length) return { chartData: [], allDrivers: [] };
    const byDriver = {};
    for (const iv of intervals) {
      const n = iv.driver_number;
      if (!byDriver[n]) byDriver[n] = [];
      byDriver[n].push({ date: new Date(iv.date), gap: iv.gap_to_leader ?? 0 });
    }
    const allDrivers = Object.keys(byDriver).map(Number);
    if (!allDrivers.length) return { chartData: [], allDrivers: [] };
    const all = intervals.map(i=>new Date(i.date)).sort((a,b)=>a-b);
    const start = all[0], end = all[all.length-1];
    const bucketMs = 30_000;
    const chartData = [];
    for (let t = start.getTime(), i = 0; t <= end.getTime(); t += bucketMs, i++) {
      const row = { lap: i+1 };
      for (const n of allDrivers) {
        const entries = byDriver[n]??[];
        if (!entries.length) continue;
        const closest = entries.reduce((b,e)=>Math.abs(e.date-t)<Math.abs(b.date-t)?e:b, entries[0]);
        if (Math.abs(closest.date-t) < bucketMs*2) row[String(n)] = typeof closest.gap==='number'?closest.gap:0;
      }
      if (Object.keys(row).length > 1) chartData.push(row);
    }
    return { chartData, allDrivers };
  }, [data]);

  const drivers = data.drivers ?? {};
  const toggle = n => setHidden(p=>{ const nx=new Set(p); nx.has(n)?nx.delete(n):nx.add(n); return nx; });

  if (loading) return <div className="f1-card p-4"><div className="h-64 shimmer rounded mt-3"/></div>;
  if (!chartData.length) return (
    <div className="f1-card p-4">
      <SectionHeader title="Gap to Leader Evolution" accent/>
      <p className="text-f1muted font-mono text-sm text-center mt-4">Available during/after race via OpenF1</p>
    </div>
  );

  return (
    <div className="f1-card p-4 animate-slide-up">
      <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
        <SectionHeader title="Gap to Leader Evolution" subtitle="Click drivers to toggle" accent/>
        <div className="flex gap-1.5">
          {[['All',()=>setHidden(new Set())],['Top5',()=>setHidden(new Set(allDrivers.slice(5)))],['None',()=>setHidden(new Set(allDrivers))]].map(([l,fn])=>(
            <button key={l} onClick={fn} className="px-2 py-0.5 text-xs font-mono border border-f1border text-f1muted hover:text-white rounded">{l}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {allDrivers.map((n,i)=>{
          const color=COLOURS[i%COLOURS.length], on=!hidden.has(n);
          return <button key={n} onClick={()=>toggle(n)} style={on?{background:color+'22',borderColor:color,color}:{}} className={`px-2 py-0.5 rounded border text-xs font-mono font-semibold ${on?'':'border-f1border text-f1border'}`}>{drivers[n]?.name_acronym??`#${n}`}</button>;
        })}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{top:5,right:10,left:-10,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E"/>
          <XAxis dataKey="lap" tick={{fill:'#888',fontSize:10,fontFamily:'JetBrains Mono'}}/>
          <YAxis tick={{fill:'#888',fontSize:10,fontFamily:'JetBrains Mono'}} tickFormatter={v=>`+${v}s`}/>
          <Tooltip content={<Tip/>}/>
          {allDrivers.map((n,i)=>(
            <Line key={n} type="monotone" dataKey={String(n)} name={drivers[n]?.name_acronym??`#${n}`}
              stroke={COLOURS[i%COLOURS.length]} strokeWidth={1.5} dot={false} hide={hidden.has(n)} connectNulls/>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}