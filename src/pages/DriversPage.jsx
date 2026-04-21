import React from 'react';
import DriverProfile from '../components/DriverProfile';
import DriverForm from '../components/DriverForm';
import TeammateComparison from '../components/TeammateComparison';
import ChampionshipMath from '../components/ChampionshipMath';

export default function DriversPage() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DriverProfile />
        <div className="space-y-4">
          <ChampionshipMath />
          <TeammateComparison />
        </div>
      </div>
      <DriverForm />
    </div>
  );
}
