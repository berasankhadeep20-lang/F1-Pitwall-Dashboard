// OpenF1 API — free, CORS-enabled, real F1 data 2023–2025
// NOTE: 2026 season data not yet available on OpenF1
const BASE = 'https://api.openf1.org/v1';

const cache = new Map();
// Simple request queue to avoid 429s
let lastRequest = 0;
const MIN_INTERVAL = 300; // ms between requests

async function get(url, ttl = 60000) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.ts < ttl) return hit.data;

  // Rate limit: wait if last request was too recent
  const now = Date.now();
  const wait = MIN_INTERVAL - (now - lastRequest);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequest = Date.now();

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenF1 ${res.status}`);
  const data = await res.json();
  cache.set(url, { data, ts: Date.now() });
  return data;
}

// OpenF1 only has data for 2023, 2024, 2025
export function openf1Supported(year) {
  const y = parseInt(year);
  return y >= 2023 && y <= 2025;
}

export function normaliseSessionName(name) {
  const n = (name ?? '').toLowerCase();
  if (n.includes('practice 1')) return 'fp1';
  if (n.includes('practice 2')) return 'fp2';
  if (n.includes('practice 3')) return 'fp3';
  if (n.includes('sprint shootout') || n.includes('sprint qualifying')) return 'sq';
  if (n.includes('sprint')) return 'sprint';
  if (n.includes('qualifying')) return 'qualifying';
  if (n.includes('race')) return 'race';
  return 'unknown';
}

// Returns { meeting, sessions } or null
// Uses meeting_name fuzzy match — circuit_key param is a numeric ID, not a string
export async function getSessionsForMeeting(year, circuitId) {
  if (!openf1Supported(year)) return null;
  try {
    // Fetch all meetings for the year, then fuzzy-match by circuit name
    const all = await get(`${BASE}/meetings?year=${year}`, 3_600_000);
    if (!all?.length) return null;

    // circuitId from Jolpica is like "suzuka", "interlagos", "albert_park"
    // OpenF1 has circuit_short_name like "Suzuka", "Interlagos", "Melbourne"
    const key = circuitId.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');
    const firstWord = key.split(' ')[0];

    let match = all.find(m => {
      const name = (m.circuit_short_name ?? m.meeting_name ?? '').toLowerCase();
      return name.includes(firstWord) || key.includes(name.split(' ')[0]);
    });

    // Broader fallback: match by meeting_official_name or location
    if (!match) {
      match = all.find(m => {
        const loc = (m.location ?? '').toLowerCase();
        return loc.includes(firstWord) || firstWord.includes(loc.split(' ')[0]);
      });
    }

    if (!match) return null;

    const sessions = await get(`${BASE}/sessions?meeting_key=${match.meeting_key}`, 3_600_000);
    return { meeting: match, sessions: sessions ?? [] };
  } catch { return null; }
}

// Real tyre stints from OpenF1
export async function getRealTyreStints(sessionKey) {
  try {
    const [stints, drivers] = await Promise.all([
      get(`${BASE}/stints?session_key=${sessionKey}`, 300_000),
      get(`${BASE}/drivers?session_key=${sessionKey}`, 300_000),
    ]);
    if (!stints?.length) return null;

    const driverMap = {};
    (drivers ?? []).forEach(d => {
      driverMap[String(d.driver_number)] = {
        code: d.name_acronym || String(d.driver_number),
        fullName: d.full_name || d.name_acronym || `#${d.driver_number}`,
        teamColour: d.team_colour ? `#${d.team_colour}` : '#888888',
      };
    });

    const byDriver = {};
    stints.forEach(s => {
      const num = String(s.driver_number);
      if (!byDriver[num]) byDriver[num] = [];
      const raw = (s.compound ?? 'UNKNOWN').toUpperCase();
      byDriver[num].push({
        stintNum: s.stint_number ?? 1,
        lapStart: s.lap_start ?? 1,
        lapEnd: s.lap_end ?? null,
        compound: raw.startsWith('INTER') ? 'INTERMEDIATE'
                : raw === 'WET' || raw === 'FULL_WET' ? 'WET'
                : ['SOFT','MEDIUM','HARD'].includes(raw) ? raw : 'UNKNOWN',
        tyreAge: s.tyre_age_at_start ?? 0,
      });
    });

    return { byDriver, driverMap };
  } catch { return null; }
}

// Best-lap classification for a session (practice/quali)
export async function getSessionResults(sessionKey) {
  try {
    const [laps, drivers] = await Promise.all([
      get(`${BASE}/laps?session_key=${sessionKey}`, 300_000),
      get(`${BASE}/drivers?session_key=${sessionKey}`, 300_000),
    ]);
    if (!laps?.length) return [];

    const driverMap = {};
    (drivers ?? []).forEach(d => {
      driverMap[String(d.driver_number)] = {
        code: d.name_acronym || `#${d.driver_number}`,
        fullName: d.full_name || d.name_acronym || `#${d.driver_number}`,
        teamColour: d.team_colour ? `#${d.team_colour}` : '#888888',
        teamName: d.team_name || '',
      };
    });

    const best = {};
    laps.forEach(l => {
      if (!l.lap_duration || l.lap_duration <= 0) return;
      const num = String(l.driver_number);
      if (!best[num] || l.lap_duration < best[num]) best[num] = l.lap_duration;
    });

    const fastestTime = Math.min(...Object.values(best));
    return Object.entries(best)
      .sort(([, a], [, b]) => a - b)
      .map(([num, t], i) => ({
        pos: i + 1,
        driverNum: num,
        code: driverMap[num]?.code ?? `#${num}`,
        fullName: driverMap[num]?.fullName ?? `#${num}`,
        teamColour: driverMap[num]?.teamColour ?? '#888',
        teamName: driverMap[num]?.teamName ?? '',
        bestLap: t,
        gap: t - fastestTime,
      }));
  } catch { return []; }
}

// Weather data for a session
export async function getSessionWeather(sessionKey) {
  try {
    return await get(`${BASE}/weather?session_key=${sessionKey}`, 300_000);
  } catch { return []; }
}
