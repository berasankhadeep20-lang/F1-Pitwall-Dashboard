// F1 API utilities
// Primary: OpenF1 API (openf1.org) - free, no auth
// Fallback: Jolpica/Ergast mirror (jolpi.ca) - free, no auth

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';
const OPENF1_BASE = 'https://api.openf1.org/v1';

// Cache to avoid hammering APIs
const cache = new Map();
const CACHE_TTL = 30_000; // 30 seconds

async function fetchWithCache(url, ttl = CACHE_TTL) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < ttl) return cached.data;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const data = await res.json();
  cache.set(url, { data, ts: Date.now() });
  return data;
}

// ───────────────────────────────────────────────
// Driver Championship Standings
// ───────────────────────────────────────────────
export async function getDriverStandings(season = 'current') {
  const data = await fetchWithCache(`${JOLPICA_BASE}/${season}/driverStandings.json`);
  return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
}

// ───────────────────────────────────────────────
// Constructor Championship Standings
// ───────────────────────────────────────────────
export async function getConstructorStandings(season = 'current') {
  const data = await fetchWithCache(`${JOLPICA_BASE}/${season}/constructorStandings.json`);
  return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? [];
}

// ───────────────────────────────────────────────
// Race Schedule for a season
// ───────────────────────────────────────────────
export async function getRaceSchedule(season = 'current') {
  const data = await fetchWithCache(`${JOLPICA_BASE}/${season}.json`, 120_000);
  return data?.MRData?.RaceTable?.Races ?? [];
}

// ───────────────────────────────────────────────
// Race Results for a specific round
// ───────────────────────────────────────────────
export async function getRaceResults(season = 'current', round = 'last') {
  const data = await fetchWithCache(`${JOLPICA_BASE}/${season}/${round}/results.json`);
  return data?.MRData?.RaceTable?.Races?.[0] ?? null;
}

// ───────────────────────────────────────────────
// Last race results
// ───────────────────────────────────────────────
export async function getLastRaceResults() {
  return getRaceResults('current', 'last');
}

// ───────────────────────────────────────────────
// Sprint Results
// ───────────────────────────────────────────────
export async function getSprintResults(season = 'current', round = 'last') {
  try {
    const data = await fetchWithCache(`${JOLPICA_BASE}/${season}/${round}/sprint.json`);
    return data?.MRData?.RaceTable?.Races?.[0] ?? null;
  } catch {
    return null; // Not all rounds have sprints
  }
}

// ───────────────────────────────────────────────
// Fastest Laps for a race
// ───────────────────────────────────────────────
export async function getFastestLaps(season = 'current', round = 'last') {
  const data = await fetchWithCache(`${JOLPICA_BASE}/${season}/${round}/results.json?limit=30`);
  const results = data?.MRData?.RaceTable?.Races?.[0]?.Results ?? [];
  return results
    .filter(r => r.FastestLap)
    .sort((a, b) => parseFloat(a.FastestLap.rank) - parseFloat(b.FastestLap.rank));
}

// ───────────────────────────────────────────────
// Lap times for a specific race (all laps, all drivers)
// ───────────────────────────────────────────────
export async function getLapTimes(season = 'current', round = 'last') {
  // Fetch up to 5 pages of 100 laps each
  const results = [];
  let offset = 0;
  const limit = 100;
  let total = Infinity;

  while (offset < Math.min(total, 500)) {
    const data = await fetchWithCache(
      `${JOLPICA_BASE}/${season}/${round}/laps.json?limit=${limit}&offset=${offset}`
    );
    const laps = data?.MRData?.RaceTable?.Races?.[0]?.Laps ?? [];
    total = parseInt(data?.MRData?.total ?? 0);
    results.push(...laps);
    offset += limit;
    if (laps.length < limit) break;
  }
  return results;
}

// ───────────────────────────────────────────────
// Championship standings progression over season
// ───────────────────────────────────────────────
export async function getStandingsProgression(season = 'current') {
  const races = await getRaceSchedule(season);
  const completedRaces = races.filter(r => new Date(r.date) < new Date());

  // Fetch standings after each round (sample every 3 rounds to avoid rate limits)
  const progression = [];
  const rounds = completedRaces.slice(0, completedRaces.length);
  const sampleRounds = rounds.filter((_, i) => i % 2 === 0 || i === rounds.length - 1);

  for (const race of sampleRounds) {
    try {
      const data = await fetchWithCache(
        `${JOLPICA_BASE}/${race.season}/${race.round}/driverStandings.json`,
        300_000 // cache 5 min for historical
      );
      const standings = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
      progression.push({
        round: parseInt(race.round),
        raceName: race.raceName,
        standings: standings.slice(0, 10).map(s => ({
          driver: s.Driver.code || s.Driver.familyName.substring(0, 3).toUpperCase(),
          points: parseInt(s.points),
          position: parseInt(s.position),
        })),
      });
    } catch {
      // Skip failed rounds
    }
  }
  return progression;
}

// ───────────────────────────────────────────────
// All seasons list
// ───────────────────────────────────────────────
export async function getSeasonsList() {
  const data = await fetchWithCache(`${JOLPICA_BASE}/seasons.json?limit=10&offset=65`, 3_600_000);
  return (data?.MRData?.SeasonTable?.Seasons ?? [])
    .map(s => s.season)
    .reverse()
    .slice(0, 8);
}

// ───────────────────────────────────────────────
// Pit stops for a race
// ───────────────────────────────────────────────
export async function getPitStops(season = 'current', round = 'last') {
  const data = await fetchWithCache(`${JOLPICA_BASE}/${season}/${round}/pitstops.json?limit=100`);
  return data?.MRData?.RaceTable?.Races?.[0]?.PitStops ?? [];
}

// ───────────────────────────────────────────────
// Driver headshot URL (using Wikipedia API as fallback)
// ───────────────────────────────────────────────
export function getDriverImageUrl(driverCode) {
  // Use a placeholder service since F1 images require licensing
  const colors = {
    VER: 'E8002D', HAM: '00A19B', LEC: 'E8002D', SAI: 'E8002D',
    NOR: 'FF8000', PIA: 'FF8000', RUS: '00A19B', ALO: '006EFF',
    STR: '006EFF', PER: 'E8002D', GAS: '0093CC', OCO: '0093CC',
    BOT: '52E252', ZHO: '52E252', HUL: 'FFFFFF', MAG: 'FFFFFF',
    ALB: '005AFF', SAR: '005AFF', TSU: '2B4562', RIC: '2B4562',
  };
  const color = colors[driverCode] || '888888';
  return `https://placehold.co/80x80/${color}/ffffff?text=${driverCode}`;
}

// ───────────────────────────────────────────────
// Team color map
// ───────────────────────────────────────────────
export const TEAM_COLORS = {
  'Red Bull': '#3671C6',
  'Mercedes': '#00A19B',
  'Ferrari': '#E8002D',
  'McLaren': '#FF8000',
  'Aston Martin': '#006EFF',
  'Alpine F1 Team': '#FF87BC',
  'Williams': '#005AFF',
  'RB F1 Team': '#2B4562',
  'Kick Sauber': '#52E252',
  'Haas F1 Team': '#B6BABD',
};

export function getTeamColor(constructorName) {
  const key = Object.keys(TEAM_COLORS).find(k =>
    constructorName?.toLowerCase().includes(k.toLowerCase().split(' ')[0])
  );
  return TEAM_COLORS[key] || '#888888';
}

// ───────────────────────────────────────────────
// Parse lap time string "1:23.456" → seconds
// ───────────────────────────────────────────────
export function parseLapTime(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(timeStr);
}

export function formatLapTime(seconds) {
  if (!seconds) return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
}
