import React, { useState } from 'react';
import { getRaceSchedule, getCircuitHistory, getTeamColor } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

const FLAG_MAP = {
  'Bahrain':'🇧🇭','Saudi Arabia':'🇸🇦','Australia':'🇦🇺','Japan':'🇯🇵',
  'China':'🇨🇳','Miami':'🇺🇸','Emilia':'🇮🇹','Monaco':'🇲🇨',
  'Canada':'🇨🇦','Spain':'🇪🇸','Austria':'🇦🇹','Great Britain':'🇬🇧',
  'Hungary':'🇭🇺','Belgium':'🇧🇪','Netherlands':'🇳🇱','Italy':'🇮🇹',
  'Azerbaijan':'🇦🇿','Singapore':'🇸🇬','United States':'🇺🇸','Mexico':'🇲🇽',
  'São Paulo':'🇧🇷','Las Vegas':'🇺🇸','Qatar':'🇶🇦','Abu Dhabi':'🇦🇪',
};
function flag(c) { return FLAG_MAP[Object.keys(FLAG_MAP).find(k=>c?.includes(k))] ?? '🏁'; }

function CircuitDetail({ circuitId, circuitName }) {
  const { data, loading } = useF1Data(() => getCircuitHistory(circuitId), [circuitId], 3_600_000);
  if (loading) return <div className="h-40 shimmer rounded mt-3"/>;
  if (!data?.length) return <p className="text-f1muted font-mono text-xs mt-3">No history data</p>;
  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-f1muted font-mono text-xs uppercase tracking-widest mb-2">Past Winners</p>
      {data.map(race => {
        const winner = race.Results?.[0];
        return (
          <div key={race.season} className="flex items-center gap-3 py-1.5 border-b border-f1border/30">
            <span className="number-font text-f1muted text-xs w-10">{race.season}</span>
            <div className="flex items-center gap-1.5 flex-1">
              <div className="w-0.5 h-4 rounded-full" style={{background: getTeamColor(winner?.Constructor?.name)}}/>
              <span className="font-display font-semibold text-white text-sm">
                {winner?.Driver?.givenName} {winner?.Driver?.familyName}
              </span>
            </div>
            <span className="text-f1muted font-mono text-xs">{winner?.Constructor?.name}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function CircuitInfo() {
  const { season, selectedRound } = useApp();
  const [selectedCircuit, setSelectedCircuit] = useState(null);

  const { data: races, loading, error } = useF1Data(() => getRaceSchedule(season), [season], 120_000);

  if (loading) return <LoadingCard rows={6}/>;
  if (error) return <ErrorCard message={error}/>;
  if (!races?.length) return null;

  const circuit = selectedCircuit
    ? races.find(r => r.Circuit?.circuitId === selectedCircuit)?.Circuit
    : (selectedRound !== 'last'
        ? races.find(r => r.round === String(selectedRound))?.Circuit
        : races.find(r => new Date(r.date) <= new Date())?.Circuit ?? races[0]?.Circuit);

  const race = races.find(r => r.Circuit?.circuitId === circuit?.circuitId);

  return (
    <div className="f1-card p-4 animate-slide-up">
      <SectionHeader title="Circuit Info" subtitle="Past winners at this venue" accent/>

      <select
        value={selectedCircuit ?? circuit?.circuitId ?? ''}
        onChange={e => setSelectedCircuit(e.target.value)}
        className="w-full bg-black border border-f1border text-white text-sm font-display px-3 py-1.5 rounded focus:outline-none focus:border-f1red cursor-pointer mt-2"
      >
        {races.map(r => (
          <option key={r.Circuit?.circuitId} value={r.Circuit?.circuitId}>
            {flag(r.Circuit?.Location?.country)} R{r.round} — {r.Circuit?.circuitName}
          </option>
        ))}
      </select>

      {circuit && (
        <div className="mt-3">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{flag(circuit.Location?.country)}</span>
            <div>
              <p className="text-white font-display font-bold text-base">{circuit.circuitName}</p>
              <p className="text-f1muted font-mono text-xs">{circuit.Location?.locality}, {circuit.Location?.country}</p>
              {race && <p className="text-f1muted font-mono text-xs mt-0.5">Round {race.round} · {race.date}</p>}
            </div>
          </div>
          <CircuitDetail circuitId={circuit.circuitId} circuitName={circuit.circuitName}/>
        </div>
      )}
    </div>
  );
}
