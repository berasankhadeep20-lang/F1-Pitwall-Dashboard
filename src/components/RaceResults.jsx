import React, { useEffect, useState } from 'react';
import {
  getRaceResults, getQualifyingResults, getSprintResults,
  getFastestLaps, getTeamColor, formatLapTime
} from '../utils/api';
import { getSessionResults } from '../utils/openf1';
import { useApp } from '../context/AppContext';
import { useMultiF1Data } from '../hooks/useF1Data';
import { LoadingCard, ErrorCard, SectionHeader } from './LoadingCard';

function TimeDiff({ time, status }) {
  if (status && status !== 'Finished') return <span className="text-f1muted text-xs font-mono">{status}</span>;
  if (!time) return <span className="text-f1muted">—</span>;
  return <span className="number-font text-xs text-f1muted">{time}</span>;
}

function RaceTable({ results, fastestId }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-f1border">
          <th className="text-left text-f1muted font-mono text-xs uppercase px-4 py-2">Pos</th>
          <th className="text-left text-f1muted font-mono text-xs uppercase px-4 py-2">Driver</th>
          <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2">Time</th>
          <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2">Pts</th>
        </tr></thead>
        <tbody>
          {results.map(r => {
            const pos = parseInt(r.position);
            return (
              <tr key={r.Driver?.driverId} className="border-b border-f1border/50 hover:bg-f1border/20 transition-colors">
                <td className="px-4 py-2.5">
                  <span className={`number-font font-bold text-sm ${pos===1?'text-f1gold':pos===2?'text-f1silver':pos===3?'text-f1bronze':'text-f1muted'}`}>P{pos}</span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-0.5 h-7 rounded-full" style={{background: getTeamColor(r.Constructor?.name)}}/>
                    <div>
                      <div className="font-display font-semibold text-white text-sm leading-tight">
                        {r.Driver?.givenName} {r.Driver?.familyName}
                        {r.Driver?.driverId === fastestId && <span className="ml-1.5 text-purple-400 text-xs">⚡</span>}
                      </div>
                      <div className="text-f1muted font-mono text-xs">{r.Constructor?.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right"><TimeDiff time={r.Time?.time} status={r.status}/></td>
                <td className="px-4 py-2.5 text-right"><span className="number-font font-bold text-white">{r.points}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function QualiTable({ results }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-f1border">
          <th className="text-left text-f1muted font-mono text-xs uppercase px-4 py-2">Pos</th>
          <th className="text-left text-f1muted font-mono text-xs uppercase px-4 py-2">Driver</th>
          <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2 hidden sm:table-cell">Q1</th>
          <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2 hidden md:table-cell">Q2</th>
          <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2">Best</th>
        </tr></thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={r.Driver?.driverId} className={`border-b border-f1border/50 hover:bg-f1border/20 transition-colors ${i<3?'bg-f1border/10':''}`}>
              <td className="px-4 py-2.5">
                <span className={`number-font font-bold text-sm ${i===0?'text-f1gold':i===1?'text-f1silver':i===2?'text-f1bronze':'text-f1muted'}`}>P{r.position}</span>
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-7 rounded-full" style={{background: getTeamColor(r.Constructor?.name)}}/>
                  <div>
                    <div className="font-display font-semibold text-white text-sm">{r.Driver?.givenName} {r.Driver?.familyName}</div>
                    <div className="text-f1muted font-mono text-xs">{r.Constructor?.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-2.5 text-right hidden sm:table-cell"><span className="number-font text-f1muted text-xs">{r.Q1||'—'}</span></td>
              <td className="px-4 py-2.5 text-right hidden md:table-cell"><span className="number-font text-f1muted text-xs">{r.Q2||'—'}</span></td>
              <td className="px-4 py-2.5 text-right"><span className={`number-font text-xs font-bold ${r.Q3?'text-white':'text-f1muted'}`}>{r.Q3||r.Q2||r.Q1||'—'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Practice session results from OpenF1 — shows real driver names
function PracticeTable({ sessionKey }) {
  const [rows, setRows]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionKey) { setLoading(false); return; }
    setLoading(true);
    getSessionResults(sessionKey)
      .then(r => { setRows(r); setLoading(false); })
      .catch(() => { setRows([]); setLoading(false); });
  }, [sessionKey]);

  if (!sessionKey) return (
    <div className="p-8 text-center">
      <p className="text-f1muted font-mono text-sm">Practice data available for 2023+ via OpenF1</p>
      <p className="text-f1muted/50 font-mono text-xs mt-1">Select a 2023 or later race to view practice times</p>
    </div>
  );
  if (loading) return <div className="p-6"><div className="h-48 shimmer rounded"/></div>;
  if (!rows?.length) return <div className="p-8 text-center text-f1muted font-mono text-sm">No lap data for this session</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-f1border">
          <th className="text-left text-f1muted font-mono text-xs uppercase px-4 py-2">Pos</th>
          <th className="text-left text-f1muted font-mono text-xs uppercase px-4 py-2">Driver</th>
          <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2">Best Lap</th>
          <th className="text-right text-f1muted font-mono text-xs uppercase px-4 py-2">Gap</th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.driverNum} className="border-b border-f1border/50 hover:bg-f1border/20 transition-colors">
              <td className="px-4 py-2.5">
                <span className={`number-font font-bold text-sm ${i===0?'text-f1gold':i===1?'text-f1silver':i===2?'text-f1bronze':'text-f1muted'}`}>P{r.pos}</span>
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-7 rounded-full" style={{background: r.teamColour}}/>
                  <div>
                    <div className="font-display font-semibold text-white text-sm">{r.fullName}</div>
                    <div className="text-f1muted font-mono text-xs">{r.teamName}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-2.5 text-right">
                <span className={`number-font text-xs font-bold ${i===0?'text-f1red':'text-white'}`}>{formatLapTime(r.bestLap)}</span>
              </td>
              <td className="px-4 py-2.5 text-right">
                <span className="number-font text-f1muted text-xs">{i===0?'—':`+${r.gap.toFixed(3)}s`}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RaceResults() {
  const { season, selectedRound, selectedSession, weekendSessions } = useApp();
  const round = selectedRound ?? 'last';

  const { data, loading, error } = useMultiF1Data({
    race:    () => getRaceResults(season, round),
    quali:   () => getQualifyingResults(season, round),
    sprint:  () => getSprintResults(season, round),
    fastest: () => getFastestLaps(season, round),
  }, [season, round], 60_000);

  if (loading) return <LoadingCard rows={10}/>;
  if (error)   return <ErrorCard message={error}/>;

  const fastestId = data.fastest?.[0]?.Driver?.driverId;
  const displayRace = data.race ?? data.quali;
  const isPractice = ['fp1','fp2','fp3'].includes(selectedSession);
  const isSprint   = ['sprint','sq'].includes(selectedSession);
  const currentSessionMeta = weekendSessions?.find(s => s.id === selectedSession);

  let title = 'Race';
  let content = null;

  if (isPractice) {
    title = currentSessionMeta?.label ?? selectedSession.toUpperCase();
    content = <PracticeTable sessionKey={currentSessionMeta?.sessionKey ?? null}/>;
  } else if (selectedSession === 'qualifying') {
    title = 'Qualifying';
    content = data.quali?.QualifyingResults?.length
      ? <QualiTable results={data.quali.QualifyingResults}/>
      : <div className="p-8 text-center text-f1muted font-mono text-sm">No qualifying data for this race</div>;
  } else if (isSprint) {
    title = 'Sprint';
    content = data.sprint?.SprintResults?.length
      ? <RaceTable results={data.sprint.SprintResults} fastestId={null}/>
      : <div className="p-8 text-center text-f1muted font-mono text-sm">No sprint data for this race</div>;
  } else {
    title = 'Race';
    content = data.race?.Results?.length
      ? <RaceTable results={data.race.Results} fastestId={fastestId}/>
      : <div className="p-8 text-center text-f1muted font-mono text-sm">No race results yet</div>;
  }

  return (
    <div className="f1-card overflow-hidden animate-slide-up">
      <div className="p-4 border-b border-f1border">
        <SectionHeader
          title={`${title} — ${displayRace?.raceName ?? ''}`}
          subtitle={`Round ${displayRace?.round ?? '?'} · ${displayRace?.Circuit?.circuitName ?? ''} · ${displayRace?.date ?? ''}`}
          accent
        />
        {selectedSession === 'race' && data.fastest?.[0] && (
          <div className="mt-3 flex items-center gap-2 bg-purple-900/20 border border-purple-800/30 rounded px-3 py-1.5">
            <span className="text-purple-400 text-xs">⚡</span>
            <span className="text-purple-400 text-xs font-display font-semibold uppercase">Fastest Lap</span>
            <span className="text-white text-xs font-mono">{data.fastest[0].Driver?.code}</span>
            <span className="text-purple-300 text-xs font-mono ml-auto">
              {data.fastest[0].FastestLap?.Time?.time} · Lap {data.fastest[0].FastestLap?.lap}
            </span>
          </div>
        )}
      </div>
      {content}
    </div>
  );
}
