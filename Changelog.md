# Changelog

All notable changes to F1 Pitwall Dashboard are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.1.0] — 2026-04-20

### Fixed
- Season selector now correctly defaults to **2026** instead of hardcoded "2025"
- Season list is dynamically computed from the current year so it never goes stale
- Championship Progression chart now shows **all 20 drivers** instead of just the top 10
- `getStandingsProgression` no longer slices standings to 10 — full grid is returned

### Added
- **Championship Progression driver filter** — click any driver pill to toggle their line; use All / Top 5 / None quick-select buttons
- **GitHub Actions workflow** (`.github/workflows/deploy.yml`) for automatic deployment to GitHub Pages on every push to `main` — no manual `npm run deploy` needed
- `LICENSE.md` — MIT License
- `CHANGELOG.md` — this file
- `RELEASE_NOTES.md` — human-readable release summary
- Proper `.gitignore` covering node_modules, dist, .env files, editor artifacts, and OS files

### Changed
- `getSeasonsList()` in `api.js` now injects the current calendar year if the Jolpica API hasn't added it yet
- Navbar season dropdown label is now dynamic (`${currentYear} ▾`) instead of hardcoded

---

## [1.0.0] — 2026-04-20

### Added
- Initial release of F1 Pitwall Dashboard
- Welcome modal with username persistence via `localStorage`
- Driver Championship standings table with team colour bars
- Constructor Championship standings with animated progress bars
- Last race results with sprint toggle (when applicable)
- Fastest lap highlight + full fastest lap table and bar chart
- Championship Progression line chart (points across the season)
- Race Position Chart — lap-by-lap position changes for selected drivers
- Driver Comparison — lap time line chart and fastest/average stats for up to 5 drivers
- Full season race calendar with countdown badges and sprint indicators
- Hero stats bar (WDC leader, last race winner, fastest lap)
- Season selector supporting 2022 – current
- Auto-refresh every 30 seconds with client-side 30 s API response cache
- Fully responsive layout (mobile + desktop)
- F1-style dark theme with Titillium Web + JetBrains Mono typography
- Data sourced from Jolpica/Ergast API (no API key required)
- Static build deployable to GitHub Pages via Vite base path configuration
