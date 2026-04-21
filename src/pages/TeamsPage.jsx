import React from 'react';
import ConstructorStandings from '../components/ConstructorStandings';
import ConstructorPoints from '../components/ConstructorPoints';
import TeammateComparison from '../components/TeammateComparison';
import ReliabilityTracker from '../components/ReliabilityTracker';

export default function TeamsPage() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ConstructorStandings />
        <ConstructorPoints />
      </div>
      <TeammateComparison />
      <ReliabilityTracker />
    </div>
  );
}
