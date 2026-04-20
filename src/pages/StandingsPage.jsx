import React from 'react';
import DriverStandings from '../components/DriverStandings';
import ConstructorStandings from '../components/ConstructorStandings';
import ChampionshipChart from '../components/ChampionshipChart';
import PointsGap from '../components/PointsGap';
import ReliabilityTracker from '../components/ReliabilityTracker';

export default function StandingsPage() {
  return (
    <div className="space-y-4">
      <ChampionshipChart />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PointsGap />
        <ReliabilityTracker />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DriverStandings />
        <ConstructorStandings />
      </div>
    </div>
  );
}
