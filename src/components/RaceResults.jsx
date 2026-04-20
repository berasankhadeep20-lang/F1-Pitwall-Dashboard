import React, { useState } from 'react';
import { getRaceResults, getSprintResults, getFastestLaps, getTeamColor, parseLapTime } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useMultiF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

function TimeDiff({ time, status }) {
  if (status && status !== 'Finished') return <span className="text-f1muted text-xs">{status}</span>;
  if (!time) return <span className="text-f1muted">—</span>;
  return <span className="number-font text-xs text-f1muted">{time}</span>;
}

export default function RaceResults({ season, round }) {
  const { season: ctxSeason, selectedRound } = useApp();
  const usedSeason = season || ctxSeason;
  const usedRound = round ?? selectedRound ?? 'last';
  const [showSprint, setShowSprint] = useState(false);

  const { data, loading, error } = useMultiF1Data({
    race: () => getRaceResults(usedSeason, usedRound),
    fastest: () => getFastestLaps(usedSeason, usedRound),
    sprint: () => getSprintResults(usedSeason, usedRound),
  }, [usedSeason, usedRound], 60_000);

  if (loading) return <LoadingCard rows={10} />;
  if (error || !data.race) return <ErrorCard message={error || 'No race data'} />;

  const race = data.race;
  const results = showSprint ? (data.sprint?.SprintResults ?? []) : (race.Results ?? []);
  const fastestLap = data.fastest?.[0];
  const hasSprint = !!data.sprint;

  return (
    <div className="f1-card overflow-hidden animate-slide-up">
      <div className="p-4 border-b border-f1border">
        <div className="flex items-start justify-between">
          <div>
            <SectionHeader
              title={race.raceName}
              subtitle={`Round ${race.round} · ${race.Circuit?.circuitName} · ${race.date}`}
              accent
            />
          </div>
          {hasSprint && (
            <div className="flex bg-f1border rounded overflow-hidden">
              <button
                onClick={() => setShowSprint(false)}
                className={`px-3 py-1 text-xs font-display font-semibold uppercase transition-all ${!showSprint ? 'bg-f1red text-white' : 'text-f1muted'}`}
              >
                Race
              </button>
              <button
                onClick={() => setShowSprint(true)}
                className={`px-3 py-1 text-xs font-display font-semibold uppercase transition-all ${showSprint ? 'bg-f1red text-white' : 'text-f1muted'}`}
              >
                Sprint
              </button>
            </div>
          )}
        </div>

        {/* Fastest Lap highlight */}
        {fastestLap && !showSprint && (
          <div className="mt-3 flex items-center gap-2 bg-purple-900/20 border border-purple-800/30 rounded px-3 py-1.5">
            <span className="text-purple-400 text-xs">⚡</span>
            <span className="text-purple-400 text-xs font-display font-semibold uppercase">Fastest Lap</span>
            <span className="text-white text-xs font-mono">
              {fastestLap.Driver?.code || fastestLap.Driver?.familyName}
            </span>
            <span className="text-purple-300 text-xs font-mono ml-auto">
              {fastestLap.FastestLap?.Time?.time} (Lap {fastestLap.FastestLap?.lap})
            </span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-f1border">
              <th className="text-left text-f1muted font-mono text-xs uppercase px-4 py-2">Pos</th>
              <th className="text-left text-f1muted font-mono text-xs uppercase px-4 py-2">Driver</th>
              <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2">Time</th>
              <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2">Pts</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => {
              const pos = parseInt(result.position);
              const teamColor = getTeamColor(result.Constructor?.name);
              const isFastest = fastestLap?.Driver?.driverId === result.Driver?.driverId;
              return (
                <tr
                  key={result.Driver?.driverId}
                  className="border-b border-f1border/50 hover:bg-f1border/20 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <span className={`number-font font-bold text-sm ${
                      pos === 1 ? 'text-f1gold' : pos === 2 ? 'text-f1silver' : pos === 3 ? 'text-f1bronze' : 'text-f1muted'
                    }`}>
                      P{pos}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-0.5 h-7 rounded-full" style={{ background: teamColor }} />
                      <div>
                        <div className="font-display font-semibold text-white text-sm leading-tight">
                          {result.Driver?.givenName} {result.Driver?.familyName}
                          {isFastest && <span className="ml-1.5 text-purple-400 text-xs">⚡</span>}
                        </div>
                        <div className="text-f1muted font-mono text-xs">{result.Constructor?.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <TimeDiff time={result.Time?.time} status={result.status} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="number-font font-bold text-white">{result.points}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
