import React, { useMemo, useState, useEffect } from 'react';
import { getDriverStandings, getTeamColor } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { SectionHeader, LoadingCard } from './LoadingCard';

const BASE_URL = 'https://api.jolpi.ca/ergast/f1';
const cache = new Map();
async function fetchRecent(season) {
  const sr = await fetch(`${BASE_URL}/${season}.json`);
  const sd = await sr.json();
  const races = (sd?.MRData?.RaceTable?.Races??[]).filter(r=>new Date(r.date)<new Date()).slice(-15);
  const results = [];
  for (const race of races) {
    const url = `${BASE_URL}/${season}/${race.round}/results.json`;
    if (cache.has(url)) { results.push(cache.get(url)); continue; }
    try {
      const r=await fetch(url); const d=await r.json();
      const entry={round:parseInt(race.round),results:d?.MRData?.RaceTable?.Races?.[0]?.Results??[]};
      cache.set(url,entry); results.push(entry);
    } catch {}
  }
  return results;
}

function Bar({value,max,color}){
  return <div className="h-1.5 bg-f1border rounded-full overflow-hidden mt-1"><div className="h-full rounded-full transition-all duration-700" style={{width:`${Math.min((value/Math.max(max,1))*100,100)}%`,background:color}}/></div>;
}

export default function StreakTracker() {
  const { season } = useApp();
  const [raceResults, setRaceResults] = useState(null);
  const { data: standings, loading } = useF1Data(()=>getDriverStandings(season),[season],300_000);

  useEffect(()=>{ fetchRecent(season).then(setRaceResults).catch(()=>setRaceResults([])); },[season]);

  const streaks = useMemo(()=>{
    if (!raceResults?.length||!standings?.length) return {};
    const rev=[...raceResults].reverse();
    const result={};
    for (const st of standings) {
      const id=st.Driver?.driverId;
      let ws=0,ps=0,pts=0,wb=false,pb=false,ptb=false,tw=0,tp=0;
      for (const race of rev) {
        const r=race.results.find(x=>x.Driver?.driverId===id);
        if (!r) { wb=pb=ptb=true; continue; }
        const pos=parseInt(r.position);
        if (!wb){ if(pos===1)ws++; else wb=true; }
        if (!pb){ if(pos<=3)ps++; else pb=true; }
        if (!ptb){ if(pos<=10)pts++; else ptb=true; }
        if(pos===1)tw++; if(pos<=3)tp++;
      }
      result[id]={winStreak:ws,podiumStreak:ps,pointsStreak:pts,totalWins:tw,totalPodiums:tp};
    }
    return result;
  },[raceResults,standings]);

  if (loading||!raceResults) return <LoadingCard rows={8}/>;

  const maxWin=Math.max(1,...Object.values(streaks).map(s=>s.winStreak));
  const maxPod=Math.max(1,...Object.values(streaks).map(s=>s.podiumStreak));
  const maxPts=Math.max(1,...Object.values(streaks).map(s=>s.pointsStreak));
  const sorted=(standings??[]).slice().sort((a,b)=>{
    const sa=streaks[a.Driver?.driverId]??{}, sb=streaks[b.Driver?.driverId]??{};
    return (sb.podiumStreak+sb.winStreak)-(sa.podiumStreak+sa.winStreak);
  });

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title="Streak Tracker" subtitle="Current streaks — last 15 races" accent/>
      <div className="grid grid-cols-3 gap-1 text-center mb-3">
        {['🏆 Win','🥇 Podium','✅ Points'].map(l=><p key={l} className="text-f1muted font-mono text-[10px] uppercase">{l}</p>)}
      </div>
      <div className="space-y-3">
        {sorted.slice(0,12).map(st=>{
          const id=st.Driver?.driverId, s=streaks[id]??{};
          const tc=getTeamColor(st.Constructors?.[0]?.name);
          return (
            <div key={id}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-0.5 h-4 rounded-full" style={{background:tc}}/>
                <span className="font-display font-semibold text-white text-sm">{st.Driver?.code??st.Driver?.familyName}</span>
                <span className="text-f1muted font-mono text-xs">{st.Constructors?.[0]?.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[[s.winStreak,maxWin,'#FFD700'],[s.podiumStreak,maxPod,'#E10600'],[s.pointsStreak,maxPts,'#00A19B']].map(([v,max,c],i)=>(
                  <div key={i}>
                    <div className="flex items-center gap-1">
                      <span className="number-font font-bold text-white text-sm">{v}</span>
                      {v>0&&<span className="text-f1muted font-mono text-[10px]">races</span>}
                    </div>
                    <Bar value={v} max={max} color={c}/>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}