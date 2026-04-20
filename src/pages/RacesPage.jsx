import React from 'react';
import RaceSelector from '../components/RaceSelector';
import RaceSchedule from '../components/RaceSchedule';
import RaceResults from '../components/RaceResults';
import QualifyingResults from '../components/QualifyingResults';
import FastestLaps from '../components/FastestLaps';
import TyreStrategy from '../components/TyreStrategy';
import PitStopAnalysis from '../components/PitStopAnalysis';

export default function RacesPage() {
  return (
    <div className="space-y-4">
      <RaceSelector />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RaceSchedule />
        <div className="space-y-4">
          <RaceResults />
          <QualifyingResults />
        </div>
      </div>
      <TyreStrategy />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <FastestLaps />
        <PitStopAnalysis />
      </div>
    </div>
  );
}
