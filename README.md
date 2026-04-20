# 🏎️ F1 Pitwall Dashboard

A modern live Formula 1 data dashboard built with React + Vite. Real-time standings, race results, lap time analysis, and driver comparisons — powered entirely by free public APIs, deployable as a static site.

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](./LICENSE.md)

---

## ✨ Features

- **Live Driver & Constructor Championship** standings updated every 30 seconds
- **Race Results** for the latest race including sprint results when applicable
- **Fastest Lap** visualization — bar chart and full table with gap analysis
- **Championship Progression** — track every driver's points across the entire season, toggle individual drivers on/off
- **Race Position Chart** — lap-by-lap position changes for any driver
- **Driver Comparison** — compare up to 5 drivers' lap times and stats side by side
- **Race Calendar** — full season schedule with live countdown badges
- **Season Selector** — switch between 2022 – current
- **Welcome screen** with username persistence via `localStorage`
- Fully responsive — works on mobile and desktop
- Auto-refresh every 30 seconds with client-side response caching

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or later
- npm

### Run Locally

```bash
git clone https://github.com/berasankhadeep20-lang/f1-pitwall-dashboard.git
cd f1-pitwall-dashboard
npm install
npm run dev
```

Open [http://localhost:5173/f1-pitwall-dashboard/](http://localhost:5173/f1-pitwall-dashboard/)

---

## 📦 Deploy to GitHub Pages

Deployment is fully automated via GitHub Actions. After the one-time setup below, every push to `main` will build and deploy automatically — no manual commands needed.

### One-time setup

**Step 1 — Push this repo to your GitHub account**

```bash
git init
git add .
git commit -m "🏎️ Initial commit"
git branch -M main
git remote add origin https://github.com/berasankhadeep20-lang/f1-pitwall-dashboard.git
git push -u origin main
```

**Step 2 — Enable GitHub Pages**

Go to your repo → **Settings → Pages → Source → GitHub Actions** → Save.

**Step 3 — Update the base path if your repo name differs**

Open `vite.config.js` and update:

```js
base: '/your-repo-name/',
```

**Step 4 — Push to main (triggers auto-deploy)**

The Actions workflow at `.github/workflows/deploy.yml` runs on every push to `main`. Your site will be live at:

```
https://berasankhadeep20-lang.github.io/f1-pitwall-dashboard/
```

---

## 🌐 APIs Used

| API | Usage |
|-----|-------|
| [Jolpica / Ergast](https://api.jolpi.ca) | Standings, race results, schedules, lap times |
| [OpenF1](https://openf1.org) | Live telemetry (future expansion) |

All responses are cached client-side with a 30 second TTL to stay within rate limits.

---

## 🛠 Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 + Vite 5 | UI framework and build tool |
| Tailwind CSS | Utility-first styling |
| Recharts | All charts and graphs |
| Framer Motion | Animations |
| Titillium Web + JetBrains Mono | Typography |

---

## 📁 Project Structure

```
f1-pitwall-dashboard/
├── .github/workflows/deploy.yml   ← Auto GitHub Pages deploy
├── public/favicon.svg
├── src/
│   ├── components/                ← UI components
│   ├── pages/                     ← Page views
│   ├── hooks/useF1Data.js         ← Polling with auto-refresh
│   ├── context/AppContext.jsx     ← Global state
│   ├── utils/api.js               ← All API calls + caching
│   ├── App.jsx
│   └── index.css
├── .gitignore
├── CHANGELOG.md
├── LICENSE.md
├── RELEASE_NOTES.md
└── package.json
```

---

## 📝 License

MIT — see [LICENSE.md](./LICENSE.md)

---

*Not affiliated with Formula 1, the FIA, or any F1 team.*