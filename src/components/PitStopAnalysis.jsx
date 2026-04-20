import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getPitStops, getRaceResults, getTeamColor } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useMultiF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

export default function PitStopAnalysis() {
  const { season, selectedRound } = useApp();
  const round = selectedRound ?? 'last';

  const { data, loading, error } = useMultiF1Data({
    pits: () => getPitStops(season, round),
    race: () => getRaceResults(season, round),
  }, [season, round], 60_000);

  const { byDriver, fastest, slowest } = useMemo(() => {
    if (!data.pits?.length || !data.race) return {};
    const driverInfo = {};
    (data.race.Results ?? []).forEach(r => {
      driverInfo[r.Driver?.driverId] = {
        code: r.Driver?.code || r.Driver?.familyName?.slice(0,3).toUpperCase(),
        team: r.Constructor?.name,
        color: getTeamColor(r.Constructor?.name),
      };
    });
    const byDriver = {};
    data.pits.forEach(p => {
      if (!byDriver[p.driverId]) byDriver[p.driverId] = { ...driverInfo[p.driverId], stops: [], driverId: p.driverId };
      byDriver[p.driverId].stops.push({ lap: parseInt(p.lap), duration: parseFloat(p.duration), stop: parseInt(p.stop) });
    });
    Object.values(byDriver).forEach(d => {
      d.avgStop = d.stops.reduce((a,s)=>a+s.duration,0)/d.stops.length;
      d.minStop = Math.min(...d.stops.map(s=>s.duration));
      d.totalStops = d.stops.length;
    });
    const sorted = Object.values(byDriver).sort((a,b)=>a.minStop-b.minStop);
    return { byDriver: sorted, fastest: sorted[0], slowest: sorted[sorted.length-1] };
  }, [data]);

  if (loading) return <div className="f1-card p-4"><SectionHeader title="Pit Stop Analysis" accent/><div className="h-48 shimmer rounded mt-4"/></div>;
  if (error) return <ErrorCard message={error}/>;
  if (!byDriver?.length) return <ErrorCard message="No pit stop data for this race"/>;

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title="Pit Stop Analysis" subtitle={`${data.race?.raceName ?? ''} · fastest stop highlighted`} accent/>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Fastest Stop', value: `${fastest?.minStop?.toFixed(3)}s`, sub: fastest?.code },
          { label: 'Most Stops', value: Math.max(...byDriver.map(d=>d.totalStops)), sub: byDriver.find(d=>d.totalStops===Math.max(...byDriver.map(d=>d.totalStops)))?.code },
          { label: 'Fewest Stops', value: Math.min(...byDriver.map(d=>d.totalStops)), sub: byDriver.find(d=>d.totalStops===Math.min(...byDriver.map(d=>d.totalStops)))?.code },
        ].map(s=>(
          <div key={s.label} className="f1-card p-3 text-center">
            <p className="text-f1muted font-mono text-[10px] uppercase tracking-widest mb-1">{s.label}</p>
            <p className="number-font font-bold text-white text-lg">{s.value}</p>
            <p className="text-f1muted font-mono text-xs">{s.sub}</p>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={byDriver.slice(0,15)} layout="vertical" margin={{top:0,right:50,left:10,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" horizontal={false}/>
          <XAxis type="number" domain={['auto','auto']} tick={{fill:'#888',fontSize:10,fontFamily:'JetBrains Mono'}} tickFormatter={v=>`${v}s`}/>
          <YAxis type="category" dataKey="code" width={35} tick={{fill:'#ccc',fontSize:11,fontFamily:'JetBrains Mono'}}/>
          <Tooltip
            formatter={(v,n,p)=>[`${v.toFixed(3)}s`, `${p.payload.totalStops} stop${p.payload.totalStops>1?'s':''}`]}
            contentStyle={{background:'#111',border:'1px solid #1E1E1E',borderRadius:8}}
            labelStyle={{color:'#fff',fontFamily:'JetBrains Mono'}}
          />
          <Bar dataKey="minStop" name="Fastest stop" radius={[0,3,3,0]} barSize={12}>
            {byDriver.slice(0,15).map((e,i)=><Cell key={i} fill={e.color||'#888'}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
