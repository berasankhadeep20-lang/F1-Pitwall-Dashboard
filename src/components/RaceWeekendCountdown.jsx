import React, { useState, useEffect } from 'react';
import { getRaceSchedule } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { SectionHeader } from './LoadingCard';

const SESSION_LABELS = {
  FirstPractice:{label:'FP1',icon:'🔧'},SecondPractice:{label:'FP2',icon:'🔧'},ThirdPractice:{label:'FP3',icon:'🔧'},
  SprintShootout:{label:'Sprint Qualifying',icon:'⚡'},Sprint:{label:'Sprint',icon:'🏎️'},
  Qualifying:{label:'Qualifying',icon:'⏱️'},Race:{label:'Race',icon:'🏁'},
};

function pad(n){ return String(Math.max(0,n)).padStart(2,'0'); }

function diffParts(target){
  const diff=Math.max(0,target-Date.now());
  return {diff,d:Math.floor(diff/86400000),h:Math.floor((diff%86400000)/3600000),m:Math.floor((diff%3600000)/60000),s:Math.floor((diff%60000)/1000)};
}

function SessionRow({label,icon,date,now}){
  const target=new Date(date).getTime();
  const {diff,d,h,m,s}=diffParts(target);
  const isPast=diff===0&&target<now;
  const isNext=Math.abs(target-now)<7200_000&&!isPast;
  return (
    <div className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all ${isNext?'bg-f1red/10 border border-f1red/30':isPast?'opacity-40':'border border-transparent'}`}>
      <span className="text-base shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-display font-bold text-sm ${isNext?'text-f1red':'text-white'}`}>{label}</p>
        <p className="text-f1muted font-mono text-[10px]">
          {new Date(date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})} · {new Date(date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
        </p>
      </div>
      <div className="text-right shrink-0">
        {isPast?<span className="text-f1muted font-mono text-xs">Done</span>
          :isNext?<div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-f1red live-dot"/><span className="text-f1red font-mono text-xs font-bold">SOON</span></div>
          :<span className="number-font text-white text-sm font-bold">{d>0?`${d}d `:''}{pad(h)}:{pad(m)}:{pad(s)}</span>}
      </div>
    </div>
  );
}

export default function RaceWeekendCountdown() {
  const { season } = useApp();
  const [now, setNow] = useState(Date.now());
  useEffect(()=>{ const t=setInterval(()=>setNow(Date.now()),1000); return()=>clearInterval(t); },[]);
  const { data: races } = useF1Data(()=>getRaceSchedule(season),[season],300_000);
  if (!races?.length) return null;
  const nextRace = races.find(r=>new Date(r.date).getTime()+86400000>now);
  if (!nextRace) return null;
  const sessions=[];
  for (const key of ['FirstPractice','SecondPractice','ThirdPractice','SprintShootout','Sprint','Qualifying']) {
    if (nextRace[key]?.date&&nextRace[key]?.time)
      sessions.push({key,...SESSION_LABELS[key],date:`${nextRace[key].date}T${nextRace[key].time}`});
  }
  sessions.push({key:'Race',...SESSION_LABELS.Race,date:`${nextRace.date}T${nextRace.time??'13:00:00Z'}`});
  sessions.sort((a,b)=>new Date(a.date)-new Date(b.date));
  const nextSession=sessions.find(s=>new Date(s.date).getTime()>now-7200_000);
  const {diff,d,h,m,s}=nextSession?diffParts(new Date(nextSession.date).getTime()):{};
  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title={nextRace.raceName?.replace(' Grand Prix',' GP')} subtitle={`${nextRace.Circuit?.Location?.locality} · Round ${nextRace.round}`} accent/>
      {nextSession&&diff>0&&(
        <div className="mb-4 p-3 bg-f1border/30 rounded-lg">
          <p className="text-f1muted font-mono text-[10px] uppercase tracking-widest mb-2 text-center">{nextSession.icon} Next: {nextSession.label}</p>
          <div className="grid grid-cols-4 gap-2">
            {[['DAYS',d],['HRS',h],['MIN',m],['SEC',s]].map(([l,v])=>(
              <div key={l} className="bg-black rounded-lg p-2 text-center border border-f1border">
                <p className="number-font text-f1red font-black text-2xl leading-none">{pad(v)}</p>
                <p className="text-f1muted font-mono text-[9px] mt-0.5 uppercase tracking-widest">{l}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-1">
        {sessions.map(sess=><SessionRow key={sess.key} {...sess} now={now}/>)}
      </div>
    </div>
  );
}