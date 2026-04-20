import React from 'react';
import RaceSelector from '../components/RaceSelector';
import ChampionshipChart from '../components/ChampionshipChart';
import PositionChart from '../components/PositionChart';
import FastestLaps from '../components/FastestLaps';

export default function GraphsPage() {
  return (
    <div className="space-y-4">
      <RaceSelector />
      <ChampionshipChart />
      <PositionChart />
      <FastestLaps />
    </div>
  );
}
