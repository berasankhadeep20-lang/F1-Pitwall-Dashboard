const BASE = 'https://api.openf1.org/v1';
const cache = new Map();
let lastRequest = 0;
const MIN_INTERVAL = 300;

async function get(url, ttl = 60000) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.ts < ttl) return hit.data;
  const wait = MIN_INTERVAL - (Date.now() - lastRequest);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequest = Date.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenF1 ${res.status}`);
  const data = await res.json();
  cache.set(url, { data, ts: Date.now() });
  return data;
}

export function openf1Supported(year) { return parseInt(year) >= 2023; }

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

export async function getLatestSession() {
  try { return (await get(`${BASE}/sessions?session_key=latest`, 30_000))?.[0] ?? null; }
  catch { return null; }
}

export async function isRaceSessionLive() {
  try {
    const s = await getLatestSession();
    if (!s || s.session_type !== 'Race') return false;
    const hrs = (Date.now() - new Date(s.date_start)) / 3_600_000;
    return hrs >= 0 && hrs <= 4;
  } catch { return false; }
}

export async function getLivePositions(sessionKey) {
  try {
    const data = await get(`${BASE}/position?session_key=${sessionKey}`, 10_000);
    const latest = {};
    for (const p of (data ?? [])) {
      if (!latest[p.driver_number] || p.date > latest[p.driver_number].date) latest[p.driver_number] = p;
    }
    return Object.values(latest).sort((a, b) => a.position - b.position);
  } catch { return []; }
}

export async function getLiveIntervals(sessionKey) {
  try {
    const data = await get(`${BASE}/intervals?session_key=${sessionKey}`, 10_000);
    const latest = {};
    for (const i of (data ?? [])) {
      if (!latest[i.driver_number] || i.date > latest[i.driver_number].date) latest[i.driver_number] = i;
    }
    return latest;
  } catch { return {}; }
}

export async function getAllIntervals(sessionKey) {
  try { return await get(`${BASE}/intervals?session_key=${sessionKey}`, 60_000) ?? []; }
  catch { return []; }
}

export async function getLiveDrivers(sessionKey) {
  try {
    const data = await get(`${BASE}/drivers?session_key=${sessionKey}`, 3_600_000);
    const map = {};
    for (const d of (data ?? [])) map[d.driver_number] = d;
    return map;
  } catch { return {}; }
}

export async function getLiveLaps(sessionKey) {
  try {
    const data = await get(`${BASE}/laps?session_key=${sessionKey}`, 20_000);
    const latestPerDriver = {};
    let currentLap = 0;
    for (const l of (data ?? [])) {
      const n = l.driver_number;
      if (!latestPerDriver[n] || l.lap_number > latestPerDriver[n].lap_number) latestPerDriver[n] = l;
      if (l.lap_number > currentLap) currentLap = l.lap_number;
    }
    return { latestPerDriver, currentLap, allLaps: data ?? [] };
  } catch { return { latestPerDriver: {}, currentLap: 0, allLaps: [] }; }
}

export async function getAllLaps(sessionKey) {
  try { return await get(`${BASE}/laps?session_key=${sessionKey}`, 60_000) ?? []; }
  catch { return []; }
}

export async function getLiveRaceControl(sessionKey) {
  try {
    return (await get(`${BASE}/race_control?session_key=${sessionKey}`, 10_000) ?? [])
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch { return []; }
}

export async function getLivePitStops(sessionKey) {
  try {
    const data = await get(`${BASE}/pit?session_key=${sessionKey}`, 15_000);
    const counts = {};
    for (const p of (data ?? [])) counts[p.driver_number] = (counts[p.driver_number] ?? 0) + 1;
    return counts;
  } catch { return {}; }
}

export async function getLiveTyres(sessionKey) {
  try {
    const data = await get(`${BASE}/stints?session_key=${sessionKey}`, 20_000);
    const current = {};
    for (const s of (data ?? [])) {
      const n = s.driver_number;
      if (!current[n] || s.stint_number > current[n].stint_number) current[n] = s;
    }
    return current;
  } catch { return {}; }
}

export async function getAllStints(sessionKey) {
  try { return await get(`${BASE}/stints?session_key=${sessionKey}`, 60_000) ?? []; }
  catch { return []; }
}

export async function getLatestCarData(sessionKey) {
  try {
    const data = await get(`${BASE}/car_data?session_key=${sessionKey}`, 10_000);
    const latest = {};
    for (const c of (data ?? [])) {
      if (!latest[c.driver_number] || c.date > latest[c.driver_number].date) latest[c.driver_number] = c;
    }
    return latest;
  } catch { return {}; }
}

export async function getSpeedTraps(sessionKey) {
  try {
    const laps = await get(`${BASE}/laps?session_key=${sessionKey}`, 60_000) ?? [];
    const bests = {};
    for (const l of laps) {
      const n = l.driver_number;
      if (!bests[n]) bests[n] = { i1: 0, i2: 0, st: 0 };
      if ((l.i1_speed ?? 0) > bests[n].i1) bests[n].i1 = l.i1_speed;
      if ((l.i2_speed ?? 0) > bests[n].i2) bests[n].i2 = l.i2_speed;
      if ((l.st_speed  ?? 0) > bests[n].st) bests[n].st  = l.st_speed;
    }
    return bests;
  } catch { return {}; }
}

export async function getTeamRadio(sessionKey) {
  try {
    return (await get(`${BASE}/team_radio?session_key=${sessionKey}`, 20_000) ?? [])
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch { return []; }
}

export function computeSectorColours(allLaps) {
  if (!allLaps?.length) return {};
  let bestS1 = Infinity, bestS2 = Infinity, bestS3 = Infinity;
  for (const l of allLaps) {
    if (l.duration_sector_1 > 0 && l.duration_sector_1 < bestS1) bestS1 = l.duration_sector_1;
    if (l.duration_sector_2 > 0 && l.duration_sector_2 < bestS2) bestS2 = l.duration_sector_2;
    if (l.duration_sector_3 > 0 && l.duration_sector_3 < bestS3) bestS3 = l.duration_sector_3;
  }
  const pb = {};
  for (const l of allLaps) {
    const n = l.driver_number;
    if (!pb[n]) pb[n] = { s1: Infinity, s2: Infinity, s3: Infinity };
    if (l.duration_sector_1 > 0 && l.duration_sector_1 < pb[n].s1) pb[n].s1 = l.duration_sector_1;
    if (l.duration_sector_2 > 0 && l.duration_sector_2 < pb[n].s2) pb[n].s2 = l.duration_sector_2;
    if (l.duration_sector_3 > 0 && l.duration_sector_3 < pb[n].s3) pb[n].s3 = l.duration_sector_3;
  }
  const latestLap = {};
  for (const l of allLaps) {
    const n = l.driver_number;
    if (!latestLap[n] || l.lap_number > latestLap[n].lap_number) latestLap[n] = l;
  }
  const colours = {};
  for (const [n, lap] of Object.entries(latestLap)) {
    const p = pb[n] ?? {};
    const colour = (s, best, pbv) => {
      if (!s || s <= 0) return 'grey';
      if (Math.abs(s - best) < 0.001) return 'purple';
      if (Math.abs(s - pbv) < 0.001) return 'green';
      return 'yellow';
    };
    colours[n] = {
      s1: colour(lap.duration_sector_1, bestS1, p.s1), s1Time: lap.duration_sector_1,
      s2: colour(lap.duration_sector_2, bestS2, p.s2), s2Time: lap.duration_sector_2,
      s3: colour(lap.duration_sector_3, bestS3, p.s3), s3Time: lap.duration_sector_3,
    };
  }
  return colours;
}

export async function getSessionsForMeeting(year, circuitId) {
  if (!openf1Supported(year)) return null;
  try {
    const all = await get(`${BASE}/meetings?year=${year}`, 3_600_000);
    if (!all?.length) return null;
    const key = circuitId.toLowerCase().replace(/_/g,' ').replace(/-/g,' ');
    const fw = key.split(' ')[0];
    let match = all.find(m => { const n=(m.circuit_short_name??m.meeting_name??'').toLowerCase(); return n.includes(fw)||key.includes(n.split(' ')[0]); });
    if (!match) match = all.find(m => { const l=(m.location??'').toLowerCase(); return l.includes(fw)||fw.includes(l.split(' ')[0]); });
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
    for (const d of (drivers??[])) driverMap[String(d.driver_number)]={code:d.name_acronym||String(d.driver_number),fullName:d.full_name||d.name_acronym||`#${d.driver_number}`,teamColour:d.team_colour?`#${d.team_colour}`:'#888888'};
    const byDriver = {};
    for (const s of stints) {
      const num = String(s.driver_number);
      if (!byDriver[num]) byDriver[num] = [];
      const raw = (s.compound??'UNKNOWN').toUpperCase();
      byDriver[num].push({stintNum:s.stint_number??1,lapStart:s.lap_start??1,lapEnd:s.lap_end??null,compound:raw.startsWith('INTER')?'INTERMEDIATE':raw==='WET'||raw==='FULL_WET'?'WET':['SOFT','MEDIUM','HARD'].includes(raw)?raw:'UNKNOWN',tyreAge:s.tyre_age_at_start??0});
    }
    return { byDriver, driverMap };
  } catch { return null; }
}

export async function getSessionResults(sessionKey) {
  try {
    const [laps, drivers] = await Promise.all([get(`${BASE}/laps?session_key=${sessionKey}`,300_000),get(`${BASE}/drivers?session_key=${sessionKey}`,300_000)]);
    if (!laps?.length) return [];
    const dm = {};
    for (const d of (drivers??[])) dm[String(d.driver_number)]={code:d.name_acronym||`#${d.driver_number}`,fullName:d.full_name||d.name_acronym||`#${d.driver_number}`,teamColour:d.team_colour?`#${d.team_colour}`:'#888888',teamName:d.team_name||''};
    const best = {};
    for (const l of laps) { if(!l.lap_duration||l.lap_duration<=0) continue; const n=String(l.driver_number); if(!best[n]||l.lap_duration<best[n]) best[n]=l.lap_duration; }
    const ft = Math.min(...Object.values(best));
    return Object.entries(best).sort(([,a],[,b])=>a-b).map(([num,t],i)=>({pos:i+1,driverNum:num,code:dm[num]?.code??`#${num}`,fullName:dm[num]?.fullName??`#${num}`,teamColour:dm[num]?.teamColour??'#888',teamName:dm[num]?.teamName??'',bestLap:t,gap:t-ft}));
  } catch { return []; }
}

export async function getSessionWeather(sessionKey) {
  try { return await get(`${BASE}/weather?session_key=${sessionKey}`, 300_000); }
  catch { return []; }
}