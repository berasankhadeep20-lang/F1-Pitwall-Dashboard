import React from 'react';
import RaceSelector from '../components/RaceSelector';
import ChampionshipChart from '../components/ChampionshipChart';
import GapToLeader from '../components/GapToLeader';
import PointsGap from '../components/PointsGap';
import PositionChart from '../components/PositionChart';
import StintPaceAnalysis from '../components/StintPaceAnalysis';
import FastestLaps from '../components/FastestLaps';
import PitStopAnalysis from '../components/PitStopAnalysis';
import WeatherWidget from '../components/WeatherWidget';

export default function GraphsPage() {
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
      <StintPaceAnalysis />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <FastestLaps />
        <PitStopAnalysis />
      </div>
    </div>
  );
}
