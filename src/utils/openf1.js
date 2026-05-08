// OpenF1 API — free, CORS-enabled, real F1 data 2023–present
const BASE = 'https://api.openf1.org/v1';

const cache = new Map();
let lastRequest = 0;
const MIN_INTERVAL = 300; // ms between requests

async function get(url, ttl = 60000) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.ts < ttl) return hit.data;

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

// ── Year support ───────────────────────────────────────────
// OpenF1 covers 2023 onwards — no upper cap, they add each season live
export function openf1Supported(year) {
  return parseInt(year) >= 2023;
}

// ── Session helpers ────────────────────────────────────────
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

// Returns the most recent session from OpenF1
export async function getLatestSession() {
  try {
    const data = await get(`${BASE}/sessions?session_key=latest`, 30_000);
    return data?.[0] ?? null;
  } catch { return null; }
}

// True if OpenF1's latest session is a Race that started ≤4h ago
export async function isRaceSessionLive() {
  try {
    const session = await getLatestSession();
    if (!session) return false;
    if (session.session_type !== 'Race') return false;

    const start = new Date(session.date_start);
    const hoursSince = (Date.now() - start) / 3_600_000;
    // Race window: started but within 4 hours (covers longest races + delays)
    return hoursSince >= 0 && hoursSince <= 4;
  } catch { return false; }
}

// ── Live race data ─────────────────────────────────────────

// Current position for every driver — returns array sorted by position
export async function getLivePositions(sessionKey) {
  try {
    const data = await get(`${BASE}/position?session_key=${sessionKey}`, 10_000);
    const latest = {};
    for (const p of (data ?? [])) {
      if (!latest[p.driver_number] || p.date > latest[p.driver_number].date) {
        latest[p.driver_number] = p;
      }
    }
    return Object.values(latest).sort((a, b) => a.position - b.position);
  } catch { return []; }
}

// Latest gap/interval per driver — returns { driverNumber: { gap_to_leader, interval } }
export async function getLiveIntervals(sessionKey) {
  try {
    const data = await get(`${BASE}/intervals?session_key=${sessionKey}`, 10_000);
    const latest = {};
    for (const i of (data ?? [])) {
      if (!latest[i.driver_number] || i.date > latest[i.driver_number].date) {
        latest[i.driver_number] = i;
      }
    }
    return latest;
  } catch { return {}; }
}

// Driver info map { driverNumber: driver } — mostly static, long cache
export async function getLiveDrivers(sessionKey) {
  try {
    const data = await get(`${BASE}/drivers?session_key=${sessionKey}`, 3_600_000);
    const map = {};
    for (const d of (data ?? [])) map[d.driver_number] = d;
    return map;
  } catch { return {}; }
}

// Latest completed lap per driver + total lap count
export async function getLiveLaps(sessionKey) {
  try {
    const data = await get(`${BASE}/laps?session_key=${sessionKey}`, 20_000);
    const latestPerDriver = {};
    let maxLap = 0;
    for (const l of (data ?? [])) {
      const n = l.driver_number;
      if (!latestPerDriver[n] || l.lap_number > latestPerDriver[n].lap_number) {
        latestPerDriver[n] = l;
      }
      if (l.lap_number > maxLap) maxLap = l.lap_number;
    }
    return { latestPerDriver, currentLap: maxLap };
  } catch { return { latestPerDriver: {}, currentLap: 0 }; }
}

// Race control messages (flags, SC, VSC, DRS) — newest first
export async function getLiveRaceControl(sessionKey) {
  try {
    const data = await get(`${BASE}/race_control?session_key=${sessionKey}`, 10_000);
    return (data ?? []).sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch { return []; }
}

// Number of pit stops completed per driver
export async function getLivePitStops(sessionKey) {
  try {
    const data = await get(`${BASE}/pit?session_key=${sessionKey}`, 15_000);
    const counts = {};
    for (const p of (data ?? [])) {
      counts[p.driver_number] = (counts[p.driver_number] ?? 0) + 1;
    }
    return counts;
  } catch { return {}; }
}

// Current tyre compound per driver (latest stint)
export async function getLiveTyres(sessionKey) {
  try {
    const data = await get(`${BASE}/stints?session_key=${sessionKey}`, 20_000);
    const current = {};
    for (const s of (data ?? [])) {
      const n = s.driver_number;
      if (!current[n] || s.stint_number > current[n].stint_number) {
        current[n] = s;
      }
    }
    return current;
  } catch { return {}; }
}

// ── Existing helpers (unchanged) ───────────────────────────

export async function getSessionsForMeeting(year, circuitId) {
  if (!openf1Supported(year)) return null;
  try {
    const all = await get(`${BASE}/meetings?year=${year}`, 3_600_000);
    if (!all?.length) return null;

    const key = circuitId.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');
    const firstWord = key.split(' ')[0];

    let match = all.find(m => {
      const name = (m.circuit_short_name ?? m.meeting_name ?? '').toLowerCase();
      return name.includes(firstWord) || key.includes(name.split(' ')[0]);
    });

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

export async function getRealTyreStints(sessionKey) {
  try {
    const [stints, drivers] = await Promise.all([
      get(`${BASE}/stints?session_key=${sessionKey}`, 300_000),
      get(`${BASE}/drivers?session_key=${sessionKey}`, 300_000),
    ]);
    if (!stints?.length) return null;

    const driverMap = {};
    for (const d of (drivers ?? [])) {
      driverMap[String(d.driver_number)] = {
        code: d.name_acronym || String(d.driver_number),
        fullName: d.full_name || d.name_acronym || `#${d.driver_number}`,
        teamColour: d.team_colour ? `#${d.team_colour}` : '#888888',
      };
    }

    const byDriver = {};
    for (const s of stints) {
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
    }

    return { byDriver, driverMap };
  } catch { return null; }
}

export async function getSessionResults(sessionKey) {
  try {
    const [laps, drivers] = await Promise.all([
      get(`${BASE}/laps?session_key=${sessionKey}`, 300_000),
      get(`${BASE}/drivers?session_key=${sessionKey}`, 300_000),
    ]);
    if (!laps?.length) return [];

    const driverMap = {};
    for (const d of (drivers ?? [])) {
      driverMap[String(d.driver_number)] = {
        code: d.name_acronym || `#${d.driver_number}`,
        fullName: d.full_name || d.name_acronym || `#${d.driver_number}`,
        teamColour: d.team_colour ? `#${d.team_colour}` : '#888888',
        teamName: d.team_name || '',
      };
    }

    const best = {};
    for (const l of laps) {
      if (!l.lap_duration || l.lap_duration <= 0) continue;
      const num = String(l.driver_number);
      if (!best[num] || l.lap_duration < best[num]) best[num] = l.lap_duration;
    }

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

export async function getSessionWeather(sessionKey) {
  try {
    return await get(`${BASE}/weather?session_key=${sessionKey}`, 300_000);
  } catch { return []; }
}
