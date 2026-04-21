// Jolpica/Ergast API — free, CORS-friendly, no auth
const BASE = 'https://api.jolpi.ca/ergast/f1';

const cache = new Map();
async function get(url, ttl = 30000) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.ts < ttl) return hit.data;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  cache.set(url, { data, ts: Date.now() });
  return data;
}

export async function getDriverStandings(season = 'current') {
  const d = await get(`${BASE}/${season}/driverStandings.json`);
  return d?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
}

export async function getConstructorStandings(season = 'current') {
  const d = await get(`${BASE}/${season}/constructorStandings.json`);
  return d?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? [];
}

export async function getRaceSchedule(season = 'current') {
  const d = await get(`${BASE}/${season}.json`, 120000);
  return d?.MRData?.RaceTable?.Races ?? [];
}

export async function getRaceResults(season = 'current', round = 'last') {
  const d = await get(`${BASE}/${season}/${round}/results.json`);
  return d?.MRData?.RaceTable?.Races?.[0] ?? null;
}

export async function getLastRaceResults(season = 'current') {
  return getRaceResults(season, 'last');
}

export async function getQualifyingResults(season = 'current', round = 'last') {
  try {
    const d = await get(`${BASE}/${season}/${round}/qualifying.json`);
    return d?.MRData?.RaceTable?.Races?.[0] ?? null;
  } catch { return null; }
}

export async function getSprintResults(season = 'current', round = 'last') {
  try {
    const d = await get(`${BASE}/${season}/${round}/sprint.json`);
    return d?.MRData?.RaceTable?.Races?.[0] ?? null;
  } catch { return null; }
}

export async function getFastestLaps(season = 'current', round = 'last') {
  const d = await get(`${BASE}/${season}/${round}/results.json`);
  return (d?.MRData?.RaceTable?.Races?.[0]?.Results ?? [])
    .filter(r => r.FastestLap)
    .sort((a, b) => +a.FastestLap.rank - +b.FastestLap.rank);
}

export async function getLapTimes(season = 'current', round = 'last') {
  const all = [];
  let offset = 0;
  while (offset < 500) {
    const d = await get(`${BASE}/${season}/${round}/laps.json?limit=100&offset=${offset}`);
    const laps = d?.MRData?.RaceTable?.Races?.[0]?.Laps ?? [];
    all.push(...laps);
    if (laps.length < 100) break;
    offset += 100;
  }
  return all;
}

export async function getPitStops(season = 'current', round = 'last') {
  const all = [];
  let offset = 0;
  while (true) {
    const d = await get(`${BASE}/${season}/${round}/pitstops.json?limit=100&offset=${offset}`);
    const ps = d?.MRData?.RaceTable?.Races?.[0]?.PitStops ?? [];
    const total = parseInt(d?.MRData?.total ?? 0);
    all.push(...ps);
    offset += 100;
    if (offset >= total || ps.length === 0) break;
  }
  return all;
}

export async function getStandingsProgression(season = 'current') {
  const races = await getRaceSchedule(season);
  const completed = races.filter(r => new Date(r.date) < new Date());
  const progression = [];
  for (const race of completed) {
    try {
      const d = await get(`${BASE}/${race.season}/${race.round}/driverStandings.json`, 300000);
      const standings = d?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
      progression.push({
        round: parseInt(race.round),
        raceName: race.raceName,
        standings: standings.map(s => ({
          driver: s.Driver.code || s.Driver.familyName.slice(0, 3).toUpperCase(),
          points: parseInt(s.points),
        })),
      });
    } catch { /* skip */ }
  }
  return progression;
}

export async function getReliabilityStats(season = 'current') {
  const races = await getRaceSchedule(season);
  const completed = races.filter(r => new Date(r.date) < new Date()).slice(-10);
  const dnfMap = {};
  const retirements = {};
  for (const race of completed) {
    try {
      const d = await get(`${BASE}/${season}/${race.round}/results.json`, 300000);
      (d?.MRData?.RaceTable?.Races?.[0]?.Results ?? []).forEach(r => {
        if (r.status && r.status !== 'Finished' && !r.status.startsWith('+')) {
          const team = r.Constructor?.name ?? 'Unknown';
          const drv = r.Driver?.code ?? r.Driver?.familyName;
          dnfMap[team] = (dnfMap[team] || 0) + 1;
          if (!retirements[drv]) retirements[drv] = [];
          retirements[drv].push({ race: race.raceName, reason: r.status });
        }
      });
    } catch { /* skip */ }
  }
  return { dnfMap, retirements };
}

// Driver form: points per race for last N rounds
export async function getDriverForm(season = 'current', driverId, rounds = 5) {
  const races = await getRaceSchedule(season);
  const completed = races.filter(r => new Date(r.date) < new Date()).slice(-rounds);
  const form = [];
  for (const race of completed) {
    try {
      const d = await get(`${BASE}/${season}/${race.round}/results.json`, 300000);
      const result = (d?.MRData?.RaceTable?.Races?.[0]?.Results ?? [])
        .find(r => r.Driver?.driverId === driverId);
      form.push({
        round: parseInt(race.round),
        raceName: race.raceName.replace(' Grand Prix', ' GP'),
        points: parseInt(result?.points ?? 0),
        position: result ? parseInt(result.position) : null,
      });
    } catch { /* skip */ }
  }
  return form;
}

// Season-long teammate head-to-head
export async function getTeammateComparison(season = 'current') {
  const [standings, schedule] = await Promise.all([
    getDriverStandings(season),
    getRaceSchedule(season),
  ]);
  const completed = schedule.filter(r => new Date(r.date) < new Date());

  // Group drivers by constructor
  const byTeam = {};
  standings.forEach(s => {
    const team = s.Constructors?.[0]?.constructorId ?? 'unknown';
    if (!byTeam[team]) byTeam[team] = [];
    byTeam[team].push({
      driverId: s.Driver.driverId,
      code: s.Driver.code || s.Driver.familyName.slice(0, 3).toUpperCase(),
      name: `${s.Driver.givenName} ${s.Driver.familyName}`,
      points: parseInt(s.points),
      wins: parseInt(s.wins),
      teamName: s.Constructors?.[0]?.name ?? '',
      teamColor: getTeamColor(s.Constructors?.[0]?.name ?? ''),
    });
  });

  // For each team with 2 drivers, collect head-to-head race data
  const pairs = [];
  for (const [, drivers] of Object.entries(byTeam)) {
    if (drivers.length < 2) continue;
    const [d1, d2] = drivers;
    let d1Ahead = 0, d2Ahead = 0, qualiD1 = 0, qualiD2 = 0;

    for (const race of completed.slice(-10)) {
      try {
        const d = await get(`${BASE}/${season}/${race.round}/results.json`, 300000);
        const results = d?.MRData?.RaceTable?.Races?.[0]?.Results ?? [];
        const r1 = results.find(r => r.Driver?.driverId === d1.driverId);
        const r2 = results.find(r => r.Driver?.driverId === d2.driverId);
        if (r1 && r2) {
          if (parseInt(r1.position) < parseInt(r2.position)) d1Ahead++;
          else d2Ahead++;
        }
      } catch { /* skip */ }
    }

    pairs.push({ d1, d2, d1Ahead, d2Ahead, racesCompared: d1Ahead + d2Ahead });
  }
  return pairs;
}

export function getSeasonsList() {
  const y = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => (y - i).toString());
}

// Tyre strategy: OpenF1 for real compounds (2023+), pit stop reconstruction fallback
export async function getTyreStrategy(season = 'current', round = 'last') {
  try {
    const { getSessionsForMeeting, getRealTyreStints, normaliseSessionName } = await import('./openf1.js');
    const raceData = await getRaceResults(season, round);
    if (!raceData?.Results?.length) return null;

    const results = raceData.Results;
    const totalLaps = parseInt(results.find(r => r.position === '1')?.laps ?? 70);
    const year = season === 'current' ? new Date().getFullYear() : parseInt(season);
    const circuitId = raceData.Circuit?.circuitId ?? '';

    // Try OpenF1 for real compound data (2023+)
    let openf1 = null;
    if (year >= 2023) {
      try {
        const meeting = await getSessionsForMeeting(year, circuitId);
        const raceSession = meeting?.sessions?.find(s => normaliseSessionName(s.session_name) === 'race');
        if (raceSession?.session_key) {
          openf1 = await getRealTyreStints(raceSession.session_key);
        }
      } catch (e) { console.warn('OpenF1 tyre:', e.message); }
    }

    // Get pit stops for fallback / stop-lap accuracy
    const pitStops = await getPitStops(season, round);
    const pitsByDriver = {};
    pitStops.forEach(p => {
      if (!pitsByDriver[p.driverId]) pitsByDriver[p.driverId] = [];
      pitsByDriver[p.driverId].push(parseInt(p.lap));
    });

    let usingRealData = false;
    const drivers = results.map(r => {
      const driverId = r.Driver?.driverId;
      const code = r.Driver?.code || r.Driver?.familyName?.slice(0, 3).toUpperCase();
      const driverLaps = parseInt(r.laps ?? totalLaps);

      // Try to match OpenF1 stints by driver code
      let stints = null;
      if (openf1?.byDriver) {
        for (const [num, stintArr] of Object.entries(openf1.byDriver)) {
          if (openf1.driverMap[num]?.code === code) {
            stints = stintArr.map(s => ({
              ...s,
              lapEnd: s.lapEnd ?? driverLaps,
              laps: (s.lapEnd ?? driverLaps) - s.lapStart + 1,
            }));
            usingRealData = true;
            break;
          }
        }
      }

      // Fallback: reconstruct from pit stops
      if (!stints) {
        const pits = (pitsByDriver[driverId] ?? []).sort((a, b) => a - b);
        const bounds = [1, ...pits.map(p => p + 1), driverLaps + 1];
        stints = [];
        for (let i = 0; i < bounds.length - 1; i++) {
          const lapStart = bounds[i], lapEnd = bounds[i + 1] - 1;
          if (lapEnd >= lapStart) {
            stints.push({
              stintNum: i + 1, lapStart, lapEnd,
              laps: lapEnd - lapStart + 1,
              compound: inferCompound(i, bounds.length - 1, lapEnd - lapStart + 1, totalLaps),
              tyreAge: 0,
            });
          }
        }
      }

      return {
        pos: parseInt(r.position), code,
        fullName: `${r.Driver?.givenName} ${r.Driver?.familyName}`,
        driverId, team: r.Constructor?.name,
        teamColor: getTeamColor(r.Constructor?.name),
        status: r.status, stints,
      };
    });

    return { drivers, totalLaps, raceName: raceData.raceName, usingRealData };
  } catch (e) {
    console.error('getTyreStrategy:', e);
    return null;
  }
}

function inferCompound(idx, total, laps, raceLaps) {
  const f = laps / raceLaps;
  if (idx === 0) return f > 0.35 ? 'MEDIUM' : 'SOFT';
  if (idx === total - 1) return f < 0.25 ? 'SOFT' : f > 0.45 ? 'HARD' : 'MEDIUM';
  return f > 0.40 ? 'HARD' : f > 0.22 ? 'MEDIUM' : 'SOFT';
}

export const TEAM_COLORS = {
  'Red Bull': '#3671C6', 'Mercedes': '#00A19B', 'Ferrari': '#E8002D',
  'McLaren': '#FF8000', 'Aston Martin': '#006EFF', 'Alpine': '#FF87BC',
  'Williams': '#005AFF', 'RB': '#2B4562', 'Sauber': '#52E252', 'Haas': '#B6BABD',
};

export function getTeamColor(name) {
  const k = Object.keys(TEAM_COLORS).find(k => name?.toLowerCase().includes(k.toLowerCase()));
  return TEAM_COLORS[k] || '#888888';
}

export function parseLapTime(t) {
  if (!t) return null;
  const p = t.split(':');
  return p.length === 2 ? +p[0] * 60 + +p[1] : +t;
}

export function formatLapTime(s) {
  if (!s || s <= 0) return 'N/A';
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, '0')}`;
}

// ── Driver career stats ────────────────────────────────────
export async function getDriverCareer(driverId) {
  try {
    const [res, champ] = await Promise.all([
      get(`${BASE}/drivers/${driverId}/results.json?limit=1`, 3_600_000),
      get(`${BASE}/drivers/${driverId}/driverStandings.json?limit=100`, 3_600_000),
    ]);
    const totalRaces = parseInt(res?.MRData?.total ?? 0);
    const lists = champ?.MRData?.StandingsTable?.StandingsLists ?? [];
    const championships = lists.filter(l => l.DriverStandings?.[0]?.position === '1').length;
    const wins = lists.reduce((a, l) => a + parseInt(l.DriverStandings?.[0]?.wins ?? 0), 0);
    const seasons = lists.map(l => l.season);
    return { totalRaces, championships, wins, seasons };
  } catch { return null; }
}

// ── Circuit history: past winners ─────────────────────────
export async function getCircuitHistory(circuitId, limit = 10) {
  try {
    const d = await get(`${BASE}/circuits/${circuitId}/results/1.json?limit=${limit}`, 3_600_000);
    return d?.MRData?.RaceTable?.Races ?? [];
  } catch { return []; }
}

// ── WDC mathematical elimination check ────────────────────
export async function getChampionshipMath(season = 'current') {
  const [standings, schedule] = await Promise.all([
    getDriverStandings(season),
    getRaceSchedule(season),
  ]);
  const remaining = schedule.filter(r => new Date(r.date) > new Date()).length;
  const maxPointsPerRace = 26; // 25 + 1 fastest lap
  const maxRemaining = remaining * maxPointsPerRace;
  const leader = parseInt(standings[0]?.points ?? 0);
  return standings.map(s => ({
    code: s.Driver?.code || s.Driver?.familyName?.slice(0, 3).toUpperCase(),
    name: `${s.Driver?.givenName} ${s.Driver?.familyName}`,
    points: parseInt(s.points),
    maxPossible: parseInt(s.points) + maxRemaining,
    canWin: parseInt(s.points) + maxRemaining >= leader,
    gap: leader - parseInt(s.points),
    teamColor: getTeamColor(s.Constructors?.[0]?.name ?? ''),
  }));
}
