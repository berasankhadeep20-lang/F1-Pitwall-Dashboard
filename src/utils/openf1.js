// OpenF1 API — free, CORS-enabled, real F1 data 2023+
const BASE = 'https://api.openf1.org/v1';

const cache = new Map();
async function get(url, ttl = 60000) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.ts < ttl) return hit.data;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenF1 ${res.status}`);
  const data = await res.json();
  cache.set(url, { data, ts: Date.now() });
  return data;
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
export async function getSessionsForMeeting(year, circuitId) {
  try {
    // Try direct circuit_key match first
    let meetings = await get(`${BASE}/meetings?year=${year}&circuit_key=${circuitId}`, 3_600_000).catch(() => []);
    // Fallback: fetch all meetings and fuzzy-match circuit name
    if (!meetings?.length) {
      const all = await get(`${BASE}/meetings?year=${year}`, 3_600_000).catch(() => []);
      const key = circuitId.toLowerCase().replace(/-/g, ' ');
      meetings = all.filter(m =>
        m.circuit_short_name?.toLowerCase().includes(key.split(' ')[0]) ||
        key.includes((m.circuit_short_name ?? '').toLowerCase())
      );
    }
    if (!meetings?.length) return null;
    const sessions = await get(`${BASE}/sessions?meeting_key=${meetings[0].meeting_key}`, 3_600_000).catch(() => []);
    return { meeting: meetings[0], sessions: sessions ?? [] };
  } catch { return null; }
}

// Returns { byDriver: { driverNum: [stints] }, driverMap: { driverNum: {code,fullName,teamColour} } }
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
      byDriver[num].push({
        stintNum: s.stint_number ?? 1,
        lapStart: s.lap_start ?? 1,
        lapEnd: s.lap_end ?? null,
        compound: ((s.compound ?? s.tyre_compound ?? 'UNKNOWN')).toUpperCase(),
        tyreAge: s.tyre_age_at_start ?? 0,
      });
    });

    return { byDriver, driverMap };
  } catch { return null; }
}

// Returns best-lap results for a session, with driver names resolved
// [ { pos, code, fullName, teamColour, bestLap, gap } ]
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

    // Best valid lap per driver
    const best = {};
    laps.forEach(l => {
      if (!l.lap_duration || l.lap_duration <= 0) return;
      const num = String(l.driver_number);
      if (!best[num] || l.lap_duration < best[num]) best[num] = l.lap_duration;
    });

    const sorted = Object.entries(best)
      .sort(([, a], [, b]) => a - b)
      .map(([num, t], i) => ({
        pos: i + 1,
        driverNum: num,
        code: driverMap[num]?.code ?? `#${num}`,
        fullName: driverMap[num]?.fullName ?? `#${num}`,
        teamColour: driverMap[num]?.teamColour ?? '#888',
        teamName: driverMap[num]?.teamName ?? '',
        bestLap: t,
        gap: i === 0 ? 0 : t - Object.values(best).sort((a, b) => a - b)[0],
      }));

    return sorted;
  } catch { return []; }
}

// Weather data for a session
export async function getSessionWeather(sessionKey) {
  try {
    return await get(`${BASE}/weather?session_key=${sessionKey}`, 300_000);
  } catch { return []; }
}
