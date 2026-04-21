import React from 'react';
import DriverForm from '../components/DriverForm';
import ConstructorStandings from '../components/ConstructorStandings';
import ChampionshipChart from '../components/ChampionshipChart';
import PointsGap from '../components/PointsGap';
import ReliabilityTracker from '../components/ReliabilityTracker';
import TeammateComparison from '../components/TeammateComparison';

export default function StandingsPage() {
  return (
    <div className="space-y-4">
      <ChampionshipChart />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PointsGap />
        <ReliabilityTracker />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DriverForm />
        <div className="space-y-4">
          <ConstructorStandings />
          <TeammateComparison />
        </div>
      </div>
    </div>
  );
}
