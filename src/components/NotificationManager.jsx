import React, { useState, useEffect, useRef } from 'react';
import { getLiveRaceControl, isRaceSessionLive, getLatestSession } from '../utils/openf1';

const EVENTS = {
  GREEN: { title: '🟢 Green Flag', body: 'Racing has resumed' },
  RED:   { title: '🔴 Red Flag!', body: 'Race stopped' },
  SAFETY_CAR: { title: '🚗 Safety Car', body: 'Safety car deployed' },
  VSC: { title: '🚗 Virtual SC', body: 'VSC conditions active' },
  CHEQUERED: { title: '🏁 Chequered Flag', body: 'The race is over!' },
};

function notify(type) {
  const cfg = EVENTS[type];
  if (!cfg || Notification.permission !== 'granted') return;
  try { new Notification(cfg.title, { body: cfg.body, icon: '/favicon.svg', tag: type, renotify: type !== 'GREEN' }); } catch {}
}

function detectType(msgs, lastRef) {
  if (!msgs.length) return;
  const m = msgs[0];
  const flag = m.flag?.toUpperCase();
  const cat = m.category?.toUpperCase();
  const text = m.message?.toUpperCase() ?? '';
  let type = null;
  if (flag === 'CHEQUERED') type = 'CHEQUERED';
  else if (flag === 'RED') type = 'RED';
  else if (cat === 'SAFETYCAR' && text.includes('DEPLOYED') && text.includes('VIRTUAL')) type = 'VSC';
  else if (cat === 'SAFETYCAR' && text.includes('DEPLOYED')) type = 'SAFETY_CAR';
  else if (flag === 'GREEN' || flag === 'CLEAR') type = 'GREEN';
  if (type && type !== lastRef.current) { lastRef.current = type; notify(type); }
}

export default function NotificationManager() {
  const [permission, setPermission] = useState(Notification.permission);
  const [enabled, setEnabled] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const lastFlag = useRef(null);

  async function request() {
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === 'granted') setEnabled(true);
  }

  useEffect(() => {
    if (!enabled || permission !== 'granted') return;
    let cancelled = false;
    async function poll() {
      try {
        const live = await isRaceSessionLive();
        if (cancelled) return;
        setIsLive(live);
        if (!live) return;
        const session = await getLatestSession();
        if (!session || cancelled) return;
        const msgs = await getLiveRaceControl(session.session_key);
        if (!cancelled) detectType(msgs, lastFlag);
      } catch {}
    }
    poll();
    const t = setInterval(poll, 15_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [enabled, permission]);

  if (!('Notification' in window)) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${enabled && isLive ? 'border-f1red/40 bg-f1red/5' : 'border-f1border'}`}>
      {permission === 'granted' ? (
        <button onClick={() => setEnabled(e => !e)}
          className={`flex items-center gap-1.5 text-xs font-mono transition-colors ${enabled ? 'text-f1red' : 'text-f1muted hover:text-white'}`}>
          {enabled ? <><span className={`w-1.5 h-1.5 rounded-full bg-f1red ${isLive ? 'live-dot' : ''}`} />{isLive ? 'Notifying · Live' : 'Notifications On'}</> : <>🔔 Enable Notifications</>}
        </button>
      ) : permission === 'denied' ? (
        <span className="text-f1muted font-mono text-xs">🔕 Notifications blocked</span>
      ) : (
        <button onClick={request} className="text-f1muted hover:text-white font-mono text-xs transition-colors">🔔 Enable Race Alerts</button>
      )}
    </div>
  );
}