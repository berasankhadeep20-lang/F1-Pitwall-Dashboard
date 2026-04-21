import React, { useEffect, useState } from 'react';
import { getSessionsForMeeting, getSessionWeather, normaliseSessionName, openf1Supported } from '../utils/openf1';
import { getRaceResults } from '../utils/api';
import { useApp } from '../context/AppContext';
import { SectionHeader } from './LoadingCard';

const WX_ICONS = { dry: '☀️', wet: '🌧️', mixed: '⛅' };

export default function WeatherWidget() {
  const { season, selectedRound } = useApp();
  const round = selectedRound ?? 'last';
  const [weather, setWeather]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [raceName, setRaceName] = useState('');

  useEffect(() => {
    setLoading(true);
    setWeather([]);
    async function load() {
      try {
        const raceData = await getRaceResults(season, round);
        if (!raceData) return;
        setRaceName(raceData.raceName ?? '');
        const year = season === 'current' ? new Date().getFullYear() : parseInt(season);
        if (!openf1Supported(year)) return;
        const meeting = await getSessionsForMeeting(year, raceData.Circuit?.circuitId ?? '');
        const raceSession = meeting?.sessions?.find(s => normaliseSessionName(s.session_name) === 'race');
        if (!raceSession?.session_key) return;
        const wx = await getSessionWeather(raceSession.session_key);
        setWeather(wx ?? []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, [season, round]);

  if (loading) return (
    <div className="f1-card p-4">
      <SectionHeader title="Race Weather" accent/>
      <div className="h-32 shimmer rounded mt-3"/>
    </div>
  );

  if (!weather.length) return (
    <div className="f1-card p-4">
      <SectionHeader title="Race Weather" subtitle="Available for 2023+ races" accent/>
      <div className="mt-3 p-4 text-center text-f1muted font-mono text-xs">No weather data for this race</div>
    </div>
  );

  // Sample ~10 evenly-spaced weather readings
  const step = Math.max(1, Math.floor(weather.length / 10));
  const samples = weather.filter((_, i) => i % step === 0).slice(0, 10);
  const hasRain  = weather.some(w => w.rainfall > 0);
  const avgAir   = (weather.reduce((a, w) => a + (w.air_temperature ?? 0), 0) / weather.length).toFixed(1);
  const avgTrack = (weather.reduce((a, w) => a + (w.track_temperature ?? 0), 0) / weather.length).toFixed(1);
  const maxWind  = Math.max(...weather.map(w => w.wind_speed ?? 0)).toFixed(1);

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title="Race Weather" subtitle={raceName} accent/>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { label: 'Condition', value: hasRain ? '🌧️ Wet' : '☀️ Dry' },
          { label: 'Avg Air',   value: `${avgAir}°C` },
          { label: 'Avg Track', value: `${avgTrack}°C` },
          { label: 'Max Wind',  value: `${maxWind} m/s` },
        ].map(s => (
          <div key={s.label} className="f1-card px-3 py-2 flex flex-col items-center min-w-20">
            <span className="text-f1muted font-mono text-[10px] uppercase">{s.label}</span>
            <span className="text-white font-mono text-sm font-bold mt-0.5">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {samples.map((w, i) => {
            const trackT = w.track_temperature ?? 0;
            const rain   = w.rainfall ?? 0;
            const height = Math.max(20, Math.min(80, trackT * 1.5));
            return (
              <div key={i} className="flex flex-col items-center gap-1 shrink-0 flex-1 min-w-12" title={`Air: ${w.air_temperature}°C · Track: w.track_temperature}°C · Rain: ${rain}mm`}>
                <span className="text-[9px] font-mono text-f1muted">{w.air_temperature?.toFixed(0)}°</span>
                <div className="w-full rounded-sm relative overflow-hidden" style={{height: 60, background: '#1E1E1E'}}>
                  <div className="absolute bottom-0 w-full rounded-sm transition-all"
                    style={{height: `${height}%`, background: rain > 0 ? '#0067FF' : trackT > 45 ? '#E8002D' : '#FF8000'}}/>
                </div>
                <span className="text-[9px] font-mono text-f1muted">{rain > 0 ? '🌧' : '☀️'}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between px-1">
          <span className="text-[9px] font-mono text-f1muted/50">Race start</span>
          <span className="text-[9px] font-mono text-f1muted/50">Finish</span>
        </div>
      </div>
    </div>
  );
}
