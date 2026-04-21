import React from 'react';
import RaceSelector from '../components/RaceSelector';
import CircuitInfo from '../components/CircuitPage';
import RaceSchedule from '../components/RaceSchedule';
import WeatherWidget from '../components/WeatherWidget';

export default function CircuitsPage() {
  return (
    <div className="space-y-4">
      <RaceSelector />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <CircuitInfo />
        <div className="space-y-4">
          <RaceSchedule />
          <WeatherWidget />
        </div>
      </div>
    </div>
  );
}
