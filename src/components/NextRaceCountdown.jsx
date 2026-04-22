import React, { useState, useEffect } from 'react';
import { getRaceSchedule } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { SectionHeader } from './LoadingCard';

export default function NextRaceCountdown() {
  const { season } = useApp();
  const { data: races } = useF1Data(() => getRaceSchedule(season), [season], 300_000);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const next = races?.find(r => new Date(r.date + 'T' + (r.time ?? '14:00:00Z')) > now);
  if (!next) return null;

  const raceDate = new Date(next.date + 'T' + (next.time ?? '14:00:00Z'));
  const diff = Math.max(0, raceDate.getTime() - now.getTime());
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const pad  = n => String(n).padStart(2, '0');

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title="Next Race Countdown" subtitle={`${next.raceName} · ${next.Circuit?.circuitName}`} accent/>
      <div className="grid grid-cols-4 gap-3 mt-3">
        {[['DAYS',days],['HRS',hrs],['MIN',mins],['SEC',secs]].map(([label, val]) => (
          <div key={label} className="bg-black rounded-lg p-3 text-center border border-f1border">
            <div className="number-font text-f1red font-black text-3xl leading-none">{pad(val)}</div>
            <div className="text-f1muted font-mono text-[10px] mt-1 uppercase tracking-widest">{label}</div>
          </div>
        ))}
      </div>
      <p className="text-f1muted font-mono text-xs mt-3 text-center">
        {next.date} · {next.Circuit?.Location?.locality}, {next.Circuit?.Location?.country}
      </p>
    </div>
  );
}
