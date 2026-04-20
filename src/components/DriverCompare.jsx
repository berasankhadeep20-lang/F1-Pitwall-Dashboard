import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { getLapTimes, getRaceResults, parseLapTime, formatLapTime, getTeamColor } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useMultiF1Data } from '../hooks/useF1Data';
import { ErrorCard, SectionHeader } from './LoadingCard';

const COLORS = ['#E10600','#3671C6','#FF8000','#00A19B','#006EFF','#FFD700','#52E252','#FF87BC'];

const LapTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-f1card border border-f1border rounded p-3 shadow-xl">
      <p className="text-f1muted font-mono text-xs mb-2">Lap {label}</p>
      {payload.map((p,i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{background:p.color}}/>
            <span className="text-white font-mono text-xs">{p.name}</span>
          </div>
          <span className="number-font text-f1muted text-xs">{p.value ? formatLapTime(p.value) : '—'}</span>
        </div>
      ))}
    </div>
  );
};

export default function DriverCompare() {
  const { season, selectedRound } = useApp();
  const round = selectedRound ?? 'last';
  const [selected, setSelected] = useState([]);
  const [chartType, setChartType] = useState('line');

  const { data, loading, error } = useMultiF1Data({
    laps: () => getLapTimes(season, round),
    race: () => getRaceResults(season, round),
  }, [season, round], 120_000);

  const { chartData, allDrivers, stats } = useMemo(() => {
    if (!data.laps?.length) return { chartData: [], allDrivers: [], stats: {} };
    const driverLaps = {};
    data.laps.forEach(lap => {
      const n = parseInt(lap.number);
      lap.Timings?.forEach(t => {
        if (!driverLaps[t.driverId]) driverLaps[t.driverId] = {};
        const s = parseLapTime(t.time);
        if (s && s < 200) driverLaps[t.driverId][n] = s;
      });
    });
    const allDrivers = Object.keys(driverLaps);
    const active = selected.length ? selected : allDrivers.slice(0,3);
    const maxLap = Math.max(...Object.values(driverLaps).flatMap(d => Object.keys(d).map(Number)));
    const chartData = Array.from({length:maxLap}, (_,i) => {
      const row = { lap: i+1 };
      active.forEach(d => { if (driverLaps[d]?.[i+1]) row[d] = driverLaps[d][i+1]; });
      return row;
    });
    const stats = {};
    active.forEach(d => {
      const times = Object.values(driverLaps[d] ?? {});
      if (!times.length) return;
      stats[d] = { fastest: Math.min(...times), average: times.reduce((a,b)=>a+b,0)/times.length, laps: times.length };
    });
    return { chartData, allDrivers, stats };
  }, [data, selected]);

  const toggle = d => setSelected(p => p.includes(d) ? p.filter(x=>x!==d) : p.length < 5 ? [...p,d] : p);
  const active = selected.length ? selected : allDrivers.slice(0,3);
  const bestFastest = Math.min(...active.filter(d=>stats[d]).map(d=>stats[d].fastest));

  if (loading) return <div className="f1-card p-4 h-64 shimmer rounded"/>;
  if (error) return <ErrorCard message={error}/>;

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="f1-card p-4">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <SectionHeader title="Driver Comparison" subtitle={`${data.race?.raceName ?? 'Last Race'} · up to 5 drivers`} accent/>
          <div className="flex bg-f1border rounded overflow-hidden">
            {[['line','📈 Laps'],['bar','📊 Stats']].map(([t,l])=>(
              <button key={t} onClick={()=>setChartType(t)}
                className={`px-3 py-1 text-xs font-display font-semibold uppercase transition-all ${chartType===t?'bg-f1red text-white':'text-f1muted'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {allDrivers.map((d,i) => {
            const on = active.includes(d);
            return (
              <button key={d} onClick={()=>toggle(d)}
                style={on?{background:COLORS[active.indexOf(d)%COLORS.length]+'22',borderColor:COLORS[active.indexOf(d)%COLORS.length]}:{}}
                className={`px-3 py-1 rounded border text-xs font-mono font-semibold transition-all ${on?'text-white':'border-f1border text-f1muted hover:text-white'}`}>
                {d.slice(0,3).toUpperCase()}
              </button>
            );
          })}
        </div>
        {chartType === 'line' ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{top:5,right:10,left:-10,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E"/>
              <XAxis dataKey="lap" tick={{fill:'#888',fontSize:11,fontFamily:'JetBrains Mono'}}/>
              <YAxis tickFormatter={formatLapTime} tick={{fill:'#888',fontSize:10,fontFamily:'JetBrains Mono'}} width={65}/>
              <Tooltip content={<LapTooltip/>}/>
              {active.map((d,i)=><Line key={d} type="monotone" dataKey={d} stroke={COLORS[i%COLORS.length]} strokeWidth={1.5} dot={false} connectNulls={false}/>)}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={active.map((d,i)=>({driver:d.slice(0,3).toUpperCase(),fastest:stats[d]?.fastest,average:stats[d]?.average,color:COLORS[i%COLORS.length]}))} margin={{top:5,right:10,left:10,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E"/>
              <XAxis dataKey="driver" tick={{fill:'#888',fontSize:11,fontFamily:'JetBrains Mono'}}/>
              <YAxis tickFormatter={formatLapTime} tick={{fill:'#888',fontSize:10,fontFamily:'JetBrains Mono'}} width={65} domain={['auto','auto']}/>
              <Tooltip formatter={v=>formatLapTime(v)} contentStyle={{background:'#111',border:'1px solid #1E1E1E',borderRadius:8}} labelStyle={{color:'#888'}}/>
              <Legend wrapperStyle={{fontSize:'11px',fontFamily:'JetBrains Mono',color:'#888'}}/>
              <Bar dataKey="fastest" name="Fastest Lap" fill="#E10600" radius={[3,3,0,0]}/>
              <Bar dataKey="average" name="Average Lap" fill="#3671C6" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      {Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {active.filter(d=>stats[d]).map((driver,i)=>(
            <div key={driver} className="f1-card p-4 border-l-2" style={{borderLeftColor:COLORS[i%COLORS.length]}}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-display font-bold text-white text-sm uppercase">{driver}</span>
                <span className="text-f1muted font-mono text-xs">{stats[driver].laps} laps</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-f1muted text-xs font-mono">Fastest</span><span className="number-font text-white text-xs font-bold">{formatLapTime(stats[driver].fastest)}</span></div>
                <div className="flex justify-between"><span className="text-f1muted text-xs font-mono">Average</span><span className="number-font text-f1muted text-xs">{formatLapTime(stats[driver].average)}</span></div>
                <div className="flex justify-between"><span className="text-f1muted text-xs font-mono">Gap to best</span>
                  <span className={`number-font text-xs ${stats[driver].fastest === bestFastest ? 'text-green-400' : 'text-f1muted'}`}>
                    {stats[driver].fastest === bestFastest ? 'FASTEST' : `+${(stats[driver].fastest - bestFastest).toFixed(3)}s`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
