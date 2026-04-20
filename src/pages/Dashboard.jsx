import React from 'react';
import StatsBar from '../components/StatsBar';
import DriverStandings from '../components/DriverStandings';
import ConstructorStandings from '../components/ConstructorStandings';
import RaceResults from '../components/RaceResults';
import ChampionshipChart from '../components/ChampionshipChart';
import PositionChart from '../components/PositionChart';

export default function Dashboard() {
  return (
    <div className="space-y-4">
      {/* Hero stats */}
      <StatsBar />

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left: Last Race */}
        <div className="xl:col-span-2">
          <RaceResults />
        </div>

        {/* Right: Constructor Standings */}
        <div>
          <ConstructorStandings />
        </div>
      </div>

      {/* Championship chart */}
      <ChampionshipChart />

      {/* Position chart */}
      <PositionChart />

      {/* Bottom: Driver standings */}
      <DriverStandings />
    </div>
  );
}
