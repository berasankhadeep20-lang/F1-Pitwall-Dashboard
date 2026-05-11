import React, { useState, useEffect } from 'react';
import RaceSelector from '../components/RaceSelector';
import ChampionshipChart from '../components/ChampionshipChart';
import GapToLeader from '../components/GapToLeader';
import PointsGap from '../components/PointsGap';
import PositionChart from '../components/PositionChart';
import StintPaceAnalysis from '../components/StintPaceAnalysis';
import FastestLaps from '../components/FastestLaps';
import PitStopAnalysis from '../components/PitStopAnalysis';
import WeatherWidget from '../components/WeatherWidget';
import TyreDegradation from '../components/TyreDegradation';
import OvertakeTracker from '../components/OvertakeTracker';
import GapEvolution from '../components/GapEvolution';
import { getSessionsForMeeting, normaliseSessionName, openf1Supported } from '../utils/openf1';
import { getRaceResults } from '../utils/api';
import { useApp } from '../context/AppContext';

function useRaceSessionKey(season, selectedRound) {
  const [sessionKey, setSessionKey] = useState(null);
  useEffect(() => {
    const yr = season === 'current' ? new Date().getFullYear() : parseInt(season);
    if (!openf1Supported(yr)) return;
    getRaceResults(season, selectedRound ?? 'last')
      .then(async raceData => {
        if (!raceData?.Circuit?.circuitId) return;
        const meeting = await getSessionsForMeeting(yr, raceData.Circuit.circuitId);
        const raceSess = meeting?.sessions?.find(s => normaliseSessionName(s.session_name) === 'race');
        if (raceSess?.session_key) setSessionKey(raceSess.session_key);
      })
      .catch(() => {});
  }, [season, selectedRound]);
  return sessionKey;
}

export default function GraphsPage() {
  const { season, selectedRound } = useApp();
  const sessionKey = useRaceSessionKey(season, selectedRound);

  return (
    <div className="space-y-4">
      <RaceSelector />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChampionshipChart />
        <GapToLeader />
      </div>

      <PointsGap />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PositionChart />
        <WeatherWidget />
      </div>

      {/* New: Gap evolution + Overtake tracker from OpenF1 */}
      {sessionKey && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <GapEvolution sessionKey={sessionKey} />
          <OvertakeTracker sessionKey={sessionKey} />
        </div>
      )}

      <StintPaceAnalysis />

      {/* New: Tyre degradation scatter */}
      {sessionKey && <TyreDegradation sessionKey={sessionKey} />}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <FastestLaps />
        <PitStopAnalysis />
      </div>
    </div>
  );
}
