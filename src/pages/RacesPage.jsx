import React, { useState, useEffect } from 'react';
import RaceSelector from '../components/RaceSelector';
import RaceSchedule from '../components/RaceSchedule';
import RaceResults from '../components/RaceResults';
import QualifyingResults from '../components/QualifyingResults';
import FastestLaps from '../components/FastestLaps';
import TyreStrategy from '../components/TyreStrategy';
import PitStopAnalysis from '../components/PitStopAnalysis';
import WeatherWidget from '../components/WeatherWidget';
import TeamRadio from '../components/TeamRadio';
import { getSessionsForMeeting, normaliseSessionName, getLiveDrivers, openf1Supported } from '../utils/openf1';
import { getRaceResults } from '../utils/api';
import { useApp } from '../context/AppContext';

function useRaceSession(season, selectedRound) {
  const [session, setSession] = useState(null);
  const [drivers, setDrivers] = useState({});

  useEffect(() => {
    const yr = season === 'current' ? new Date().getFullYear() : parseInt(season);
    if (!openf1Supported(yr)) return;
    let cancelled = false;

    getRaceResults(season, selectedRound ?? 'last')
      .then(async raceData => {
        if (!raceData?.Circuit?.circuitId || cancelled) return;
        const meeting = await getSessionsForMeeting(yr, raceData.Circuit.circuitId);
        const raceSess = meeting?.sessions?.find(s => normaliseSessionName(s.session_name) === 'race');
        if (!raceSess || cancelled) return;
        setSession(raceSess);
        const drv = await getLiveDrivers(raceSess.session_key);
        if (!cancelled) setDrivers(drv);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [season, selectedRound]);

  return { session, drivers };
}

export default function RacesPage() {
  const { season, selectedRound } = useApp();
  const { session, drivers } = useRaceSession(season, selectedRound);

  return (
    <div className="space-y-4">
      <RaceSelector />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RaceSchedule />
        <div className="space-y-4">
          <RaceResults />
          <WeatherWidget />
        </div>
      </div>

      <TyreStrategy />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <FastestLaps />
        <PitStopAnalysis />
      </div>

      {/* Team radio — only shown when OpenF1 session available */}
      {session?.session_key && (
        <TeamRadio sessionKey={session.session_key} drivers={drivers} />
      )}
    </div>
  );
}
