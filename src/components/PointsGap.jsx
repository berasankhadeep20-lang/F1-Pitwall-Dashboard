import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { getDriverStandings, getTeamColor } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

export default function PointsGap() {
  const { season } = useApp();
  const { data, loading, error } = useF1Data(
    () => getDriverStandings(season),
    [season], 30_000
  );

  const chartData = useMemo(() => {
    if (!data?.length) return [];
    const leaderPts = parseInt(data[0].points);
    return data.slice(0, 15).map(s => ({
      driver: s.Driver?.code || s.Driver?.familyName?.slice(0,3).toUpperCase(),
      points: parseInt(s.points),
      gap: -(leaderPts - parseInt(s.points)),
      team: s.Constructors?.[0]?.name,
      color: getTeamColor(s.Constructors?.[0]?.name),
      pos: parseInt(s.position),
    }));
  }, [data]);

  if (loading) return <div className="f1-card p-4"><div className="h-64 shimmer rounded mt-4"/></div>;
  if (error) return <ErrorCard message={error}/>;
  if (!chartData.length) return <ErrorCard message="No standings data"/>;

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title="Points Gap to Leader" subtitle="Top 15 drivers" accent/>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} layout="vertical" margin={{top:5,right:60,left:10,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" horizontal={false}/>
          <XAxis type="number" tick={{fill:'#888',fontSize:11,fontFamily:'JetBrains Mono'}}
            tickFormatter={v => v === 0 ? 'Leader' : `${v}`}/>
          <YAxis type="category" dataKey="driver" width={38} tick={{fill:'#ccc',fontSize:11,fontFamily:'JetBrains Mono'}}/>
          <Tooltip
            formatter={(v, n, p) => [`${Math.abs(v)} pts behind`, p.payload.team]}
            contentStyle={{background:'#111',border:'1px solid #1E1E1E',borderRadius:8}}
            labelStyle={{color:'#fff',fontFamily:'JetBrains Mono'}}
          />
          <ReferenceLine x={0} stroke="#E10600" strokeWidth={2}/>
          <Bar dataKey="gap" radius={[0,3,3,0]} barSize={14}>
            {chartData.map((e,i)=><Cell key={i} fill={e.color}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
