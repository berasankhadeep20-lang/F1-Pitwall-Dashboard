import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getLapTimes, getTyreStrategy, formatLapTime, parseLapTime } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useMultiF1Data } from '../hooks/useF1Data';
import { ErrorCard, SectionHeader } from './LoadingCard';

const COMPOUND_COLORS = { SOFT:'#E8002D', MEDIUM:'#FFF200', HARD:'#EFEFEF', INTERMEDIATE:'#39B54A', WET:'#0067FF', UNKNOWN:'#555' };

const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-f1card border border-f1border rounded p-3 shadow-xl">
      <p className="text-white font-mono text-xs font-bold">{d.label}</p>
      <p className="text-f1muted font-mono text-xs">{d.compound} · {d.stintLaps} laps</p>
      <p className="text-white font-mono text-xs mt-1">Avg: {formatLapTime(d.avgLap)}</p>
    </div>
  );
};

export default function StintPaceAnalysis() {
  const { season, selectedRound } = useApp();
  const round = selectedRound ?? 'last';

  const { data, loading, error } = useMultiF1Data({
    laps: () => getLapTimes(season, round),
    tyres: () => getTyreStrategy(season, round),
  }, [season, round], 120_000);

  const chartData = useMemo(() => {
    if (!data.laps?.length || !data.tyres?.drivers?.length) return [];

    // Build lap time map: driverId → { lapNum: seconds }
    const lapMap = {};
    data.laps.forEach(lap => {
      const n = parseInt(lap.number);
      lap.Timings?.forEach(t => {
        if (!lapMap[t.driverId]) lapMap[t.driverId] = {};
        const s = parseLapTime(t.time);
        if (s && s < 200) lapMap[t.driverId][n] = s;
      });
    });

    // For top 6 drivers, compute avg lap time per stint
    const rows = [];
    data.tyres.drivers.slice(0, 6).forEach(driver => {
      driver.stints.forEach(stint => {
        const laps = [];
        for (let l = stint.lapStart; l <= (stint.lapEnd ?? data.tyres.totalLaps); l++) {
          const t = lapMap[driver.driverId]?.[l];
          if (t) laps.push(t);
        }
        if (!laps.length) return;
        const avg = laps.reduce((a,b)=>a+b,0)/laps.length;
        rows.push({
          label: `${driver.code} S${stint.stintNum}`,
          driver: driver.code,
          compound: stint.compound,
          stintLaps: laps.length,
          avgLap: avg,
          color: COMPOUND_COLORS[stint.compound] ?? '#555',
        });
      });
    });
    return rows.sort((a,b) => a.avgLap - b.avgLap);
  }, [data]);

  if (loading) return <div className="f1-card p-4"><div className="h-48 shimmer rounded mt-3"/></div>;
  if (error) return <ErrorCard message={error}/>;
  if (!chartData.length) return <ErrorCard message="No stint pace data for this race"/>;

  const minTime = Math.min(...chartData.map(d=>d.avgLap));

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title="Stint Pace Analysis" subtitle="Average lap time per stint — top 6 finishers" accent/>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={{top:0,right:60,left:10,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" horizontal={false}/>
          <XAxis type="number" domain={[minTime-1,'auto']} tickFormatter={formatLapTime} tick={{fill:'#888',fontSize:10,fontFamily:'JetBrains Mono'}}/>
          <YAxis type="category" dataKey="label" width={50} tick={{fill:'#ccc',fontSize:10,fontFamily:'JetBrains Mono'}}/>
          <Tooltip content={<Tip/>}/>
          <Bar dataKey="avgLap" radius={[0,3,3,0]} barSize={14}>
            {chartData.map((e,i) => <Cell key={i} fill={e.color}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
