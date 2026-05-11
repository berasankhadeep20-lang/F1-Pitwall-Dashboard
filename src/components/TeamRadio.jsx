import React, { useState, useRef } from 'react';
import { getTeamRadio } from '../utils/openf1';
import { useF1Data } from '../hooks/useF1Data';
import { SectionHeader } from './LoadingCard';

export default function TeamRadio({ sessionKey, drivers }) {
  const [playingUrl, setPlayingUrl] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const audioRef = useRef(null);

  const { data: messages } = useF1Data(() => getTeamRadio(sessionKey), [sessionKey], 20_000);

  function playAudio(url) {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    if (playingUrl === url) { setPlayingUrl(null); return; }
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingUrl(url);
    audio.play().catch(() => {});
    audio.onended = () => setPlayingUrl(null);
  }

  const msgs = (messages ?? []).filter(m => m.recording_url);
  const allNums = [...new Set(msgs.map(m => m.driver_number))];
  const filtered = filter === 'ALL' ? msgs : msgs.filter(m => m.driver_number === parseInt(filter));

  if (!msgs.length) return (
    <div className="f1-card p-6 text-center">
      <p className="text-f1muted font-mono text-sm">No radio messages yet</p>
    </div>
  );

  return (
    <div className="f1-card overflow-hidden animate-slide-up">
      <div className="p-4 border-b border-f1border flex items-center justify-between flex-wrap gap-3">
        <SectionHeader title="Team Radio" subtitle={`${msgs.length} messages with audio`} accent />
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="bg-black border border-f1border text-white text-xs font-mono px-2 py-1 rounded focus:outline-none focus:border-f1red">
          <option value="ALL">All Drivers</option>
          {allNums.map(n => <option key={n} value={n}>{drivers?.[n]?.name_acronym ?? `#${n}`}</option>)}
        </select>
      </div>
      <div className="max-h-96 overflow-y-auto divide-y divide-f1border/40">
        {filtered.slice(0, 30).map(msg => {
          const driver = drivers?.[msg.driver_number];
          const teamColor = driver?.team_colour ? `#${driver.team_colour}` : '#888';
          const time = new Date(msg.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const playing = playingUrl === msg.recording_url;
          return (
            <div key={`${msg.driver_number}-${msg.date}`}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-f1border/20 transition-colors ${playing ? 'bg-f1red/5 border-l-2 border-f1red' : ''}`}>
              <div className="w-0.5 h-10 rounded-full shrink-0" style={{ background: teamColor }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-display font-bold text-white text-sm">{driver?.name_acronym ?? `#${msg.driver_number}`}</span>
                  <span className="text-f1muted font-mono text-[10px]">{driver?.team_name}</span>
                  <span className="text-f1muted font-mono text-[10px] ml-auto">{time}</span>
                </div>
                <p className="text-f1muted font-mono text-xs">🎙️ Audio message</p>
              </div>
              <button onClick={() => playAudio(msg.recording_url)}
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${playing ? 'bg-f1red text-white' : 'bg-f1border text-f1muted hover:bg-f1red/20 hover:text-f1red'}`}>
                {playing ? '■' : '▶'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}