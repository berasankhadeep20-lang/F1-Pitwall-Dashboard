import React, { useEffect } from 'react';

const TL = { SOFT:'S',MEDIUM:'M',HARD:'H',INTERMEDIATE:'I',WET:'W',UNKNOWN:'?' };
const TC = { SOFT:'#E8002D',MEDIUM:'#FFF200',HARD:'#EFEFEF',INTERMEDIATE:'#39B54A',WET:'#0067FF',UNKNOWN:'#444' };
const FLAG_BG = { GREEN:'bg-green-900/60 border-green-500',RED:'bg-red-900/80 border-red-500',SAFETY_CAR:'bg-yellow-900/70 border-yellow-400',VIRTUAL_SAFETY_CAR:'bg-yellow-900/50 border-yellow-600',CHEQUERED:'bg-white/10 border-white',YELLOW:'bg-yellow-900/50 border-yellow-500' };

function getFlag(rc) {
  for (const m of (rc??[])) {
    const cat=m.category?.toUpperCase(), flag=m.flag?.toUpperCase(), text=m.message?.toUpperCase()??'';
    if(flag==='CHEQUERED') return {key:'CHEQUERED',label:'🏁 CHEQUERED FLAG'};
    if(cat==='SAFETYCAR'&&text.includes('DEPLOYED')&&!text.includes('VIRTUAL')) return {key:'SAFETY_CAR',label:'🚗 SAFETY CAR'};
    if(cat==='SAFETYCAR'&&text.includes('VIRTUAL')&&text.includes('DEPLOYED')) return {key:'VIRTUAL_SAFETY_CAR',label:'🚗 VIRTUAL SC'};
    if(flag==='RED') return {key:'RED',label:'🔴 RED FLAG'};
    if(flag==='YELLOW') return {key:'YELLOW',label:'🟡 YELLOW FLAG'};
    if(flag==='GREEN'||flag==='CLEAR') return {key:'GREEN',label:'🟢 GREEN FLAG'};
  }
  return {key:'GREEN',label:'🟢 RACING'};
}

export default function BroadcastMode({ onClose, positions, drivers, intervals, lapData, tyres, raceControl, session }) {
  const f = getFlag(raceControl);
  const currentLap = lapData?.currentLap ?? 0;

  useEffect(() => {
    const h = (e) => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{fontFamily:'Titillium Web,sans-serif'}}>
      <div className="flex items-center justify-between px-6 py-3 border-b border-f1border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-f1red live-dot"/>
            <span className="text-f1red font-display font-black text-xl tracking-wider">F1 PITWALL</span>
          </div>
          <span className="text-white font-display font-bold text-lg">{session?.meeting_name??'Grand Prix'}</span>
        </div>
        <div className="flex items-center gap-4">
          {currentLap>0&&<span className="number-font text-white font-bold text-xl">LAP {currentLap}</span>}
          <div className={`px-4 py-1.5 rounded border text-sm font-display font-bold uppercase tracking-wide ${FLAG_BG[f.key]??FLAG_BG.GREEN}`}>{f.label}</div>
          <button onClick={onClose} className="text-f1muted hover:text-white font-mono text-sm transition-colors px-2 py-1 border border-f1border rounded">ESC · Exit</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-4 py-2">
        <table className="w-full">
          <thead>
            <tr className="border-b border-f1border">
              {['Pos','Driver','Team','Gap','Interval','Tyre'].map(h=><th key={h} className="text-f1muted font-mono text-sm uppercase px-4 py-2 text-left">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {(positions??[]).map((p,i)=>{
              const n=p.driver_number, d=drivers?.[n], iv=intervals?.[n], t=tyres?.[n];
              const tc=d?.team_colour?`#${d.team_colour}`:'#888';
              const compound=(t?.compound?.toUpperCase()??'UNKNOWN');
              return (
                <tr key={n} className={`border-b border-f1border/20 ${i===0?'bg-f1red/5':'hover:bg-f1border/10'}`}>
                  <td className="px-4 py-3"><span className={`number-font font-black text-3xl ${i===0?'text-f1gold':i<3?'text-white':'text-f1muted'}`}>{p.position}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-10 rounded-full" style={{background:tc}}/>
                      <div>
                        <p className="font-display font-black text-white text-2xl leading-none">{d?.name_acronym??`#${n}`}</p>
                        <p className="text-f1muted font-mono text-xs mt-0.5">{d?.full_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-f1muted font-display text-sm">{d?.team_name}</span></td>
                  <td className="px-4 py-3"><span className="number-font text-white text-xl font-bold">{i===0?'—':typeof iv?.gap_to_leader==='number'?`+${iv.gap_to_leader.toFixed(3)}`:iv?.gap_to_leader??'—'}</span></td>
                  <td className="px-4 py-3"><span className="number-font text-f1muted text-lg">{i===0?'—':typeof iv?.interval==='number'?`+${iv.interval.toFixed(3)}`:iv?.interval??'—'}</span></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-base" style={{background:TC[compound]??'#444',color:compound==='MEDIUM'||compound==='HARD'?'#000':'#fff'}}>{TL[compound]??'?'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-2 border-t border-f1border text-center">
        <span className="text-f1muted font-mono text-xs">Press ESC to exit broadcast mode · Auto-refreshes every 15s</span>
      </div>
    </div>
  );
}