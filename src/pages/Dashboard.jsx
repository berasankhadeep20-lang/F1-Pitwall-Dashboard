import React from 'react';
import RaceSelector from '../components/RaceSelector';
import StatsBar from '../components/StatsBar';
import DriverForm from '../components/DriverForm';
import ConstructorStandings from '../components/ConstructorStandings';
import RaceResults from '../components/RaceResults';
import ChampionshipChart from '../components/ChampionshipChart';
import PositionChart from '../components/PositionChart';
import WeatherWidget from '../components/WeatherWidget';
import NextRaceCountdown from '../components/NextRaceCountdown';
import PointsGap from '../components/PointsGap';

export default function Dashboard() {
  return (
    <div className="space-y-4">
      <StatsBar />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <NextRaceCountdown />
          <RaceSelector />
          <RaceResults />
        </div>
        <div className="space-y-4">
          <WeatherWidget />
          <ConstructorStandings />
        </div>
      </div>
      <ChampionshipChart />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PositionChart />
        <div className="space-y-4">
          <PointsGap />
          <DriverForm />
        </div>
      </div>
    </div>
  );
}
