import React from 'react';
import RaceSchedule from '../components/RaceSchedule';
import RaceResults from '../components/RaceResults';
import FastestLaps from '../components/FastestLaps';

export default function RacesPage() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RaceSchedule />
        <div className="space-y-4">
          <RaceResults />
        </div>
      </div>
      <FastestLaps />
    </div>
  );
}
