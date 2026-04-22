import React from 'react';
import RaceSelector from '../components/RaceSelector';
import DriverCompare from '../components/DriverCompare';
import TyreStrategy from '../components/TyreStrategy';
import TeammateComparison from '../components/TeammateComparison';
import QualifyingResults from '../components/QualifyingResults';
import HeadToHeadRadar from '../components/HeadToHeadRadar';

export default function ComparePage() {
  return (
    <div className="space-y-4">
      <RaceSelector />
      <HeadToHeadRadar />
      <DriverCompare />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TeammateComparison />
        <QualifyingResults />
      </div>
      <TyreStrategy />
    </div>
  );
}
