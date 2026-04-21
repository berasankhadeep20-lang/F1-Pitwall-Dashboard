import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getReliabilityStats, getTeamColor } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

export default function ReliabilityTracker() {
  const { season } = useApp();
  const { data, loading, error } = useF1Data(
    () => getReliabilityStats(season),
    [season], 300_000
  );

  if (loading) return <div className="f1-card p-4"><SectionHeader title="Reliability" accent/><div className="h-48 shimmer rounded mt-4"/></div>;
  if (error) return <ErrorCard message={error}/>;
  if (!data?.dnfMap || !Object.keys(data.dnfMap).length) return (
    <div className="f1-card p-4">
      <SectionHeader title="Reliability Tracker" subtitle="DNFs this season (last 10 races)" accent/>
      <div className="mt-4 p-4 text-center text-f1muted font-mono text-sm">No DNF data yet</div>
    </div>
  );

  const chartData = Object.entries(data.dnfMap)
    .sort((a,b)=>b[1]-a[1])
    .map(([team, dnfs]) => ({ team: team.replace(' F1 Team','').replace(' Racing',''), dnfs, color: getTeamColor(team) }));

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title="Reliability Tracker" subtitle="DNFs · last 10 races" accent/>
      <div className="mb-4 flex items-center gap-2 p-2 bg-red-900/10 border border-red-900/20 rounded">
        <span className="text-red-400 text-sm">⚠️</span>
        <p className="text-f1muted font-mono text-xs">Most unreliable: <span className="text-white font-bold">{chartData[0]?.team}</span> with <span className="text-f1red font-bold">{chartData[0]?.dnfs}</span> DNFs</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{top:5,right:10,left:-20,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E"/>
          <XAxis dataKey="team" tick={{fill:'#888',fontSize:10,fontFamily:'JetBrains Mono'}} angle={-25} textAnchor="end" height={50}/>
          <YAxis allowDecimals={false} tick={{fill:'#888',fontSize:11,fontFamily:'JetBrains Mono'}}/>
          <Tooltip
            formatter={(v)=>[`${v} DNF${v>1?'s':''}`]}
            contentStyle={{background:'#111',border:'1px solid #1E1E1E',borderRadius:8}}
            labelStyle={{color:'#fff',fontFamily:'JetBrains Mono'}}
          />
          <Bar dataKey="dnfs" radius={[3,3,0,0]} barSize={28}>
            {chartData.map((e,i)=><Cell key={i} fill={e.color}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {Object.keys(data.retirements ?? {}).length > 0 && (
        <div className="mt-4 pt-4 border-t border-f1border">
          <p className="text-f1muted font-mono text-xs uppercase tracking-widest mb-3">Retirement Log</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {Object.entries(data.retirements ?? {}).map(([driver, retirements]) =>
              retirements.map((r,i) => (
                <div key={`${driver}-${i}`} className="flex items-center justify-between text-xs font-mono py-1 border-b border-f1border/30">
                  <span className="text-white font-bold w-10">{driver}</span>
                  <span className="text-f1muted flex-1 mx-2 truncate">{r.race.replace(' Grand Prix',' GP')}</span>
                  <span className="text-red-400 text-right">{r.reason}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
