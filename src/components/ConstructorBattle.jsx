import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { getConstructorStandings, getTeamColor } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { SectionHeader, LoadingCard, ErrorCard } from './LoadingCard';

export default function ConstructorBattle() {
  const { season } = useApp();
  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);
  const { data, loading, error } = useF1Data(()=>getConstructorStandings(season),[season],300_000);
  const constructors = data ?? [];

  React.useEffect(()=>{
    if (constructors.length>=2&&!teamA) {
      setTeamA(constructors[0]?.Constructor?.constructorId);
      setTeamB(constructors[1]?.Constructor?.constructorId);
    }
  },[constructors]);

  const chartData = useMemo(()=>{
    if (!teamA||!teamB||!constructors.length) return [];
    const a=constructors.find(c=>c.Constructor?.constructorId===teamA);
    const b=constructors.find(c=>c.Constructor?.constructorId===teamB);
    if (!a||!b) return [];
    const aP=parseFloat(a.points??0), bP=parseFloat(b.points??0);
    const played=Math.max(1,parseInt(a.playedGames??constructors[0]?.playedGames??10)||10);
    return Array.from({length:played},(_,i)=>{
      const frac=(i+1)/played;
      return { round:i+1, swing:Math.round(aP*frac)-Math.round(bP*frac),
        aName:a.Constructor?.name?.replace(' F1 Team','').replace(' Racing',''),
        bName:b.Constructor?.name?.replace(' F1 Team','').replace(' Racing','') };
    });
  },[constructors,teamA,teamB]);

  if (loading) return <LoadingCard rows={5}/>;
  if (error) return <ErrorCard message={error}/>;

  const aTeam=constructors.find(c=>c.Constructor?.constructorId===teamA);
  const bTeam=constructors.find(c=>c.Constructor?.constructorId===teamB);
  const aColor=getTeamColor(aTeam?.Constructor?.name);
  const bColor=getTeamColor(bTeam?.Constructor?.name);

  const Sel=({value,onChange})=>(
    <select value={value??''} onChange={e=>onChange(e.target.value)}
      className="bg-black border border-f1border text-white text-xs font-mono px-2 py-1 rounded focus:outline-none focus:border-f1red cursor-pointer">
      {constructors.map(c=><option key={c.Constructor?.constructorId} value={c.Constructor?.constructorId}>{c.Constructor?.name} — {c.points}pts</option>)}
    </select>
  );

  return (
    <div className="f1-card p-4 animate-slide-up">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <SectionHeader title="Constructor Battle" subtitle="Cumulative points gap across the season" accent/>
        <div className="flex items-center gap-2 flex-wrap">
          <Sel value={teamA} onChange={setTeamA}/>
          <span className="text-f1muted font-mono text-xs">vs</span>
          <Sel value={teamB} onChange={setTeamB}/>
        </div>
      </div>
      {aTeam&&bTeam&&(
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[[aTeam,aColor],[null,null],[bTeam,bColor]].map(([t,c],i)=>i===1?(
            <div key="gap" className="f1-card p-3 text-center">
              <p className="number-font font-bold text-xl text-white">{Math.abs(parseFloat(aTeam.points)-parseFloat(bTeam.points))}</p>
              <p className="text-f1muted font-mono text-[10px]">pts gap</p>
              <p className="text-f1muted font-mono text-[10px] mt-1">{parseFloat(aTeam.points)>parseFloat(bTeam.points)?aTeam.Constructor?.name?.replace(' F1 Team',''):bTeam.Constructor?.name?.replace(' F1 Team','')} leads</p>
            </div>
          ):(
            <div key={t.Constructor?.constructorId} className="f1-card p-3 text-center" style={{borderLeft:i===0?`2px solid ${c}`:undefined,borderRight:i===2?`2px solid ${c}`:undefined}}>
              <p className="number-font font-black text-2xl text-white">{t.points}</p>
              <p className="text-f1muted font-mono text-xs">{t.Constructor?.name?.replace(' F1 Team','')}</p>
              <p className="text-f1muted font-mono text-[10px]">{t.wins}W</p>
            </div>
          ))}
        </div>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{top:5,right:10,left:-20,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E"/>
          <XAxis dataKey="round" tick={{fill:'#888',fontSize:10,fontFamily:'JetBrains Mono'}} label={{value:'Round',position:'insideBottomRight',offset:0,fill:'#888',fontSize:10}}/>
          <YAxis tick={{fill:'#888',fontSize:10,fontFamily:'JetBrains Mono'}}/>
          <Tooltip formatter={(v,_,p)=>[`${v>0?'+':''}${v} pts`,v>=0?p.payload.aName:p.payload.bName]} contentStyle={{background:'#111',border:'1px solid #1E1E1E',borderRadius:8}} labelStyle={{color:'#888',fontFamily:'JetBrains Mono',fontSize:11}} labelFormatter={l=>`Round ${l}`}/>
          <ReferenceLine y={0} stroke="#333" strokeWidth={1}/>
          <Bar dataKey="swing" name="Gap" radius={[2,2,0,0]} barSize={14}>
            {chartData.map((e,i)=><Cell key={i} fill={e.swing>=0?aColor:bColor}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}