import React from 'react';
import RaceSelector from '../components/RaceSelector';
import DriverCompare from '../components/DriverCompare';
import TyreStrategy from '../components/TyreStrategy';

export default function ComparePage() {
  return (
    <div className="space-y-4">
      <RaceSelector />
      <DriverCompare />
      <TyreStrategy />
    </div>
  );
}
