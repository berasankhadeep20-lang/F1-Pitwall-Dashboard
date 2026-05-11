import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDriverStandings, getTeamColor } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { SectionHeader, CardLoader } from './LoadingCard';

const BASE_URL = 'https://api.jolpi.ca/ergast/f1';
const cache = new Map();
async function cGet(url) {
  if (cache.has(url)) return cache.get(url);
  const r = await fetch(url); if (!r.ok) return null;
  const d = await r.json(); cache.set(url,d); return d;
}
async function fetchCareer(driverId) {
  const cur = new Date().getFullYear();
  const results = [];
  for (let yr = 2010; yr <= cur; yr++) {
    try {
      const d = await cGet(`${BASE_URL}/${yr}/drivers/${driverId}/driverStandings.json`);
      const s = d?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings?.[0];
      if (!s) continue;
      results.push({ season:yr, points:parseFloat(s.points??0), wins:parseInt(s.wins??0), position:parseInt(s.position??99), team:s.Constructors?.[0]?.name??'—', teamColor:getTeamColor(s.Constructors?.[0]?.name) });
    } catch {}
  }
  return results.sort((a,b)=>a.season-b.season);
}

export default function DriverCareerComparison() {
  const { season } = useApp();
  const [d1,setD1]=useState(''), [d2,setD2]=useState('');
  const [c1,setC1]=useState(null), [c2,setC2]=useState(null);
  const [loading2,setLoading2]=useState(false);
  const [view,setView]=useState('points');
  const { data: standings, loading } = useF1Data(()=>getDriverStandings(season),[season],300_000);

  useEffect(()=>{ if(standings?.length>=2&&!d1){ setD1(standings[0]?.Driver?.driverId); setD2(standings[1]?.Driver?.driverId); } },[standings]);
  useEffect(()=>{
    if (!d1||!d2) return;
    setLoading2(true); setC1(null); setC2(null);
    Promise.all([fetchCareer(d1),fetchCareer(d2)]).then(([a,b])=>{ setC1(a); setC2(b); }).finally(()=>setLoading2(false));
  },[d1,d2]);

  if (loading) return <CardLoader rows={6}/>;

  const allSeasons=[...new Set([...(c1??[]).map(s=>s.season),...(c2??[]).map(s=>s.season)])].sort((a,b)=>a-b);
  const chartData=allSeasons.map(yr=>({ season:yr, [d1]:c1?.find(s=>s.season===yr)?.[view]??null, [d2]:c2?.find(s=>s.season===yr)?.[view]??null }));
  const d1Info=standings?.find(s=>s.Driver?.driverId===d1);
  const d2Info=standings?.find(s=>s.Driver?.driverId===d2);
  const d1Color=getTeamColor(d1Info?.Constructors?.[0]?.name);
  const d2Color=getTeamColor(d2Info?.Constructors?.[0]?.name);
  const totals=c=>({ seasons:c?.length??0, wins:c?.reduce((a,s)=>a+s.wins,0)??0, titles:c?.filter(s=>s.position===1).length??0, best:c?.length?Math.min(...c.map(s=>s.position)):'—' });
  const t1=totals(c1), t2=totals(c2);
  const Sel=({value,onChange})=>(
    <select value={value} onChange={e=>onChange(e.target.value)} className="bg-black border border-f1border text-white text-xs font-mono px-2 py-1 rounded focus:outline-none focus:border-f1red cursor-pointer">
      {(standings??[]).map(s=><option key={s.Driver?.driverId} value={s.Driver?.driverId}>{s.Driver?.givenName} {s.Driver?.familyName}</option>)}
    </select>
  );

  return (
    <div className="f1-card p-4 animate-slide-up">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <SectionHeader title="Career Comparison" subtitle="Season-by-season from 2010" accent/>
        <div className="flex items-center gap-2 flex-wrap">
          <Sel value={d1} onChange={setD1}/><span className="text-f1muted font-mono text-xs">vs</span><Sel value={d2} onChange={setD2}/>
        </div>
      </div>
      {c1&&c2&&(
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[['Seasons','seasons'],['Wins','wins'],['Titles','titles'],['Best Pos','best']].map(([l,k])=>(
            <div key={k} className="f1-card p-3">
              <p className="text-f1muted font-mono text-[10px] uppercase text-center mb-1">{l}</p>
              <div className="flex justify-between items-center">
                <span className="number-font font-bold text-lg" style={{color:d1Color}}>{t1[k]}</span>
                <span className="text-f1muted font-mono text-xs">vs</span>
                <span className="number-font font-bold text-lg" style={{color:d2Color}}>{t2[k]}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-f1muted font-mono text-[10px]">{d1Info?.Driver?.code}</span>
                <span className="text-f1muted font-mono text-[10px]">{d2Info?.Driver?.code}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex bg-f1border rounded overflow-hidden mb-4 w-fit">
        {[['points','Points'],['wins','Wins'],['position','Pos']].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} className={`px-3 py-1 text-xs font-display font-semibold uppercase transition-all ${view===v?'bg-f1red text-white':'text-f1muted'}`}>{l}</button>
        ))}
      </div>
      {loading2?<div className="h-52 shimmer rounded"/>:chartData.length?(
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{top:5,right:10,left:-20,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E"/>
            <XAxis dataKey="season" tick={{fill:'#888',fontSize:10,fontFamily:'JetBrains Mono'}}/>
            <YAxis tick={{fill:'#888',fontSize:10,fontFamily:'JetBrains Mono'}} reversed={view==='position'} domain={view==='position'?[1,20]:['auto','auto']}/>
            <Tooltip contentStyle={{background:'#111',border:'1px solid #1E1E1E',borderRadius:8}} labelStyle={{color:'#888'}}/>
            <Line type="monotone" dataKey={d1} name={d1Info?.Driver?.code??d1} stroke={d1Color} strokeWidth={2} dot={{r:3}} connectNulls/>
            <Line type="monotone" dataKey={d2} name={d2Info?.Driver?.code??d2} stroke={d2Color} strokeWidth={2} dot={{r:3}} connectNulls/>
          </LineChart>
        </ResponsiveContainer>
      ):<p className="text-f1muted font-mono text-sm text-center py-8">Select two drivers to compare</p>}
    </div>
  );
}