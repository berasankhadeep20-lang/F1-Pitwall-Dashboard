import React from 'react';
import ChampionshipChart from '../components/ChampionshipChart';
import PositionChart from '../components/PositionChart';
import FastestLaps from '../components/FastestLaps';

export default function GraphsPage() {
  return (
    <div className="space-y-4">
      <ChampionshipChart />
      <PositionChart />
      <FastestLaps />
    </div>
  );
}
