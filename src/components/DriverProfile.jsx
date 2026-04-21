import React, { useState } from 'react';
import { getDriverStandings, getDriverCareer, getTeamColor } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

function CareerStats({ driverId, code, teamColor }) {
  const { data, loading } = useF1Data(() => getDriverCareer(driverId), [driverId], 3_600_000);
  if (loading) return <div className="h-8 shimmer rounded"/>;
  if (!data) return null;
  return (
    <div className="grid grid-cols-3 gap-2 mt-2">
      {[
        { label: 'Races', value: data.totalRaces },
        { label: 'Wins',  value: data.wins },
        { label: 'Titles',value: data.championships },
      ].map(s => (
        <div key={s.label} className="f1-card p-2 text-center border border-f1border">
          <p className="number-font font-bold text-white text-lg">{s.value}</p>
          <p className="text-f1muted font-mono text-[10px] uppercase">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

export default function DriverProfile() {
  const { season } = useApp();
  const [selected, setSelected] = useState(null);
  const { data, loading, error } = useF1Data(() => getDriverStandings(season), [season], 30_000);

  if (loading) return <LoadingCard rows={5}/>;
  if (error) return <ErrorCard message={error}/>;
  if (!data?.length) return null;

  const driver = selected
    ? data.find(s => s.Driver?.driverId === selected)
    : data[0];

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title="Driver Profile" subtitle="Select a driver to view career stats" accent/>

      {/* Driver picker */}
      <select
        value={selected ?? data[0]?.Driver?.driverId}
        onChange={e => setSelected(e.target.value)}
        className="w-full bg-black border border-f1border text-white text-sm font-display px-3 py-1.5 rounded focus:outline-none focus:border-f1red cursor-pointer mb-4 mt-2"
      >
        {data.map(s => (
          <option key={s.Driver?.driverId} value={s.Driver?.driverId}>
            P{s.position} — {s.Driver?.givenName} {s.Driver?.familyName} ({s.Constructors?.[0]?.name})
          </option>
        ))}
      </select>

      {driver && (
        <div>
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-16 rounded-full" style={{background: getTeamColor(driver.Constructors?.[0]?.name)}}/>
            <div>
              <p className="text-white font-display font-black text-2xl leading-tight">
                {driver.Driver?.givenName} {driver.Driver?.familyName}
              </p>
              <p className="text-f1muted font-mono text-xs">{driver.Constructors?.[0]?.name}</p>
              <p className="text-f1muted font-mono text-xs">#{driver.Driver?.permanentNumber} · {driver.Driver?.nationality}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="number-font font-bold text-white text-3xl">{driver.points}</p>
              <p className="text-f1muted font-mono text-xs">pts this season</p>
              <p className="text-f1muted font-mono text-xs">{driver.wins} wins</p>
            </div>
          </div>

          {/* Career stats from API */}
          <CareerStats
            driverId={driver.Driver?.driverId}
            code={driver.Driver?.code}
            teamColor={getTeamColor(driver.Constructors?.[0]?.name)}
          />
        </div>
      )}
    </div>
  );
}
