import React from 'react';
import RaceSelector from '../components/RaceSelector';
import DriverCompare from '../components/DriverCompare';
import TyreStrategy from '../components/TyreStrategy';
import QualifyingResults from '../components/QualifyingResults';

export default function ComparePage() {
  return (
    <div className="space-y-4">
      <RaceSelector />
      <DriverCompare />
      <TyreStrategy />
      <QualifyingResults />
    </div>
  );
}
