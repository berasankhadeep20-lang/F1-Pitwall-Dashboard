import React from 'react';
import DriverStandings from '../components/DriverStandings';
import ConstructorStandings from '../components/ConstructorStandings';
import ChampionshipChart from '../components/ChampionshipChart';

export default function StandingsPage() {
  return (
    <div className="space-y-4">
      <ChampionshipChart />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DriverStandings />
        <ConstructorStandings />
      </div>
    </div>
  );
}
