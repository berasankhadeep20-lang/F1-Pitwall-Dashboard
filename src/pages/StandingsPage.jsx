import React from 'react';
import ChampionshipChart from '../components/ChampionshipChart';
import GapToLeader from '../components/GapToLeader';
import PointsGap from '../components/PointsGap';
import ChampionshipMath from '../components/ChampionshipMath';
import DriverForm from '../components/DriverForm';
import ConstructorStandings from '../components/ConstructorStandings';
import ConstructorPoints from '../components/ConstructorPoints';
import TeammateComparison from '../components/TeammateComparison';
import ReliabilityTracker from '../components/ReliabilityTracker';

export default function StandingsPage() {
  return (
    <div className="space-y-4">
      <ChampionshipChart />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GapToLeader />
        <ChampionshipMath />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PointsGap />
        <ReliabilityTracker />
      </div>
      <ConstructorPoints />
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
