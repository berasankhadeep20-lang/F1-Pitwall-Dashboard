import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getConstructorStandings, getDriverStandings, getTeamColor } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useMultiF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

export default function ConstructorPoints() {
  const { season } = useApp();
  const { data, loading, error } = useMultiF1Data({
    constructors: () => getConstructorStandings(season),
    drivers: () => getDriverStandings(season),
  }, [season], 30_000);

  const chartData = useMemo(() => {
    if (!data.constructors?.length || !data.drivers?.length) return [];
    return data.constructors.map(c => {
      const teamDrivers = data.drivers.filter(d =>
        d.Constructors?.[0]?.constructorId === c.Constructor?.constructorId
      );
      const [d1, d2] = teamDrivers;
      return {
        team: c.Constructor?.name?.replace(' F1 Team','').replace(' Racing',''),
        total: parseInt(c.points),
        d1pts: parseInt(d1?.points ?? 0),
        d2pts: parseInt(d2?.points ?? 0),
        d1code: d1?.Driver?.code ?? '—',
        d2code: d2?.Driver?.code ?? '—',
        color: getTeamColor(c.Constructor?.name),
      };
    });
  }, [data]);

  if (loading) return <LoadingCard rows={5}/>;
  if (error) return <ErrorCard message={error}/>;
  if (!chartData.length) return null;

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title="Constructor Points Split" subtitle="Each driver's contribution to team total" accent/>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{top:5,right:10,left:-20,bottom:40}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E"/>
          <XAxis dataKey="team" tick={{fill:'#888',fontSize:9,fontFamily:'JetBrains Mono'}} angle={-30} textAnchor="end"/>
          <YAxis tick={{fill:'#888',fontSize:11,fontFamily:'JetBrains Mono'}}/>
          <Tooltip
            formatter={(v,n,p) => [`${v} pts`, n === 'd1pts' ? p.payload.d1code : p.payload.d2code]}
            contentStyle={{background:'#111',border:'1px solid #1E1E1E',borderRadius:8}}
            labelStyle={{color:'#fff',fontFamily:'JetBrains Mono'}}
          />
          <Bar dataKey="d1pts" name="Driver 1" stackId="a" radius={[0,0,0,0]}>
            {chartData.map((e,i) => <Cell key={i} fill={e.color}/>)}
          </Bar>
          <Bar dataKey="d2pts" name="Driver 2" stackId="a" radius={[3,3,0,0]}>
            {chartData.map((e,i) => <Cell key={i} fill={e.color+'88'}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
