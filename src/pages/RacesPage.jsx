import React from 'react';
import RaceSelector from '../components/RaceSelector';
import RaceSchedule from '../components/RaceSchedule';
import RaceResults from '../components/RaceResults';
import FastestLaps from '../components/FastestLaps';
import TyreStrategy from '../components/TyreStrategy';

export default function RacesPage() {
  return (
    <div className="space-y-4">
      {/* Race picker — drives all components below */}
      <RaceSelector />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RaceSchedule />
        <RaceResults />
      </div>

      {/* Tyre strategy — respects selected race + driver dropdown inside */}
      <TyreStrategy />

      <FastestLaps />
    </div>
  );
}
