import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAllLaps, getAllStints } from '../utils/openf1';
import { useMultiF1Data } from '../hooks/useF1Data';
import { SectionHeader } from './LoadingCard';

const CC = { SOFT:'#E8002D',MEDIUM:'#FFF200',HARD:'#EFEFEF',INTERMEDIATE:'#39B54A',WET:'#0067FF',UNKNOWN:'#888' };

const Tip = ({ active, payload }) => {
  if (!active||!payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="f1-card p-3 shadow-xl">
      <p className="text-white font-mono text-xs font-bold">{d.compound}</p>
      <p className="text-f1muted font-mono text-xs">Age: {d.tyreAge} laps</p>
      <p className="text-white font-mono text-xs">{d.lapTime?.toFixed(3)}s</p>
    </div>
  );
};

export default function TyreDegradation({ sessionKey }) {
  const { data, loading } = useMultiF1Data({
    laps: () => getAllLaps(sessionKey),
    stints: () => getAllStints(sessionKey),
  }, [sessionKey], 120_000);

  const chartData = useMemo(() => {
    const laps = data.laps ?? [], stints = data.stints ?? [];
    if (!laps.length || !stints.length) return {};
    const stintMap = {};
    for (const s of stints) {
      const n = s.driver_number;
      if (!stintMap[n]) stintMap[n] = [];
      stintMap[n].push({ lapStart: s.lap_start??1, lapEnd: s.lap_end??9999, compound:(s.compound??'UNKNOWN').toUpperCase(), tyreAge: s.tyre_age_at_start??0 });
    }
    const byCompound = {};
    for (const lap of laps) {
      if (!lap.lap_duration||lap.lap_duration<=0||lap.lap_duration>200||lap.is_pit_out_lap) continue;
      const stint = stintMap[lap.driver_number]?.find(s=>lap.lap_number>=s.lapStart&&lap.lap_number<=s.lapEnd);
      if (!stint) continue;
      const compound = stint.compound;
      const tyreAge = lap.lap_number - stint.lapStart + stint.tyreAge;
      if (!byCompound[compound]) byCompound[compound] = [];
      byCompound[compound].push({ tyreAge, lapTime: lap.lap_duration });
    }
    return byCompound;
  }, [data]);

  if (loading) return <div className="f1-card p-4"><div className="h-64 shimmer rounded mt-3"/></div>;
  if (!Object.keys(chartData).length) return (
    <div className="f1-card p-4">
      <SectionHeader title="Tyre Degradation" accent/>
      <p className="text-f1muted font-mono text-sm text-center mt-6">Available during/after race via OpenF1 (2023+)</p>
    </div>
  );

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title="Tyre Degradation" subtitle="Lap time vs tyre age — each dot is one lap" accent/>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{top:5,right:20,left:-10,bottom:20}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E"/>
          <XAxis dataKey="tyreAge" name="Tyre Age" tick={{fill:'#888',fontSize:10,fontFamily:'JetBrains Mono'}} label={{value:'Tyre age (laps)',position:'insideBottom',offset:-10,fill:'#888',fontSize:10}}/>
          <YAxis dataKey="lapTime" name="Lap Time" tick={{fill:'#888',fontSize:10,fontFamily:'JetBrains Mono'}} domain={['auto','auto']}/>
          <Tooltip content={<Tip/>}/>
          {Object.entries(chartData).map(([compound, pts]) => (
            <Scatter key={compound} name={compound} data={pts} fill={CC[compound]??'#888'} fillOpacity={0.7}/>
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {Object.keys(chartData).map(c=>(
          <div key={c} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{background:CC[c]??'#888'}}/>
            <span className="text-f1muted font-mono text-xs">{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}