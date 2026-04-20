# 🏎️ F1 Pitwall Dashboard

A modern, live Formula 1 data dashboard built with React + Vite. Features real-time standings, race results, lap time analysis, and driver comparisons — all powered by free public APIs.

## ✨ Features

- **Driver & Constructor Championship** standings with live updates
- **Race Results** for the latest race (+ sprint results when applicable)
- **Fastest Lap** visualization with gap analysis
- **Championship Progression** chart over the season
- **Race Position Chart** — track every driver's position lap by lap
- **Driver Comparison** — compare up to 5 drivers' lap times side by side
- **Race Calendar** — full season schedule with countdown
- **Season Selector** — switch between 2022, 2023, 2024, 2025
- **Welcome screen** with username persistence via localStorage
- Auto-refresh every 30 seconds
- Fully responsive (mobile + desktop)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Install & Run Locally

```bash
git clone https://github.com/berasankhadeep20-lang/f1-pitwall-dashboard
cd f1-pitwall-dashboard
npm install
npm run dev
```

Open [http://localhost:5173/f1-pitwall-dashboard/](http://localhost:5173/f1-pitwall-dashboard/)

## 📦 Deploy to GitHub Pages

### 1. Create a GitHub repository
Create a new repo called `f1-pitwall-dashboard` on GitHub.

### 2. Update vite.config.js base path
The `base` in `vite.config.js` is already set to `/f1-pitwall-dashboard/`. If your repo has a different name, update it:

```js
// vite.config.js
export default defineConfig({
  plugins: [react()],
  base: '/YOUR-REPO-NAME/',   // ← change this
})
```

### 3. Update package.json deploy script (optional)
If you use gh-pages CLI:
```bash
npm install --save-dev gh-pages
```

Add to package.json scripts:
```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

### 4. Push and deploy

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/f1-pitwall-dashboard.git
git push -u origin main

# Deploy to GitHub Pages
npm run deploy
```

### 5. Enable GitHub Pages
Go to your repo → **Settings** → **Pages** → Source: **gh-pages branch** → Save.

Your dashboard will be live at:
`https://YOUR_USERNAME.github.io/f1-pitwall-dashboard/`

### Alternative: GitHub Actions (auto-deploy on push)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 🌐 APIs Used

| API | Usage | Rate Limit |
|-----|-------|------------|
| [Jolpica/Ergast](https://api.jolpi.ca) | Standings, results, schedules | ~4 req/s |
| [OpenF1](https://openf1.org) | Real-time telemetry (future) | Generous |

All data is cached client-side (30s TTL) to avoid rate limits.

## 🛠 Tech Stack

- **React 18** + **Vite 5**
- **Tailwind CSS** for styling
- **Recharts** for all charts
- **Framer Motion** for animations
- **Lucide React** for icons
- **JetBrains Mono** + **Titillium Web** fonts

## 📁 Project Structure

```
src/
├── components/
│   ├── WelcomeModal.jsx      # Name entry screen
│   ├── Navbar.jsx            # Navigation + season selector
│   ├── StatsBar.jsx          # Hero stats strip
│   ├── DriverStandings.jsx   # WDC table
│   ├── ConstructorStandings.jsx # WCC table with progress bars
│   ├── RaceResults.jsx       # Last race / sprint results
│   ├── RaceSchedule.jsx      # Full calendar with countdowns
│   ├── FastestLaps.jsx       # Fastest lap chart + table
│   ├── ChampionshipChart.jsx # Points progression line chart
│   ├── PositionChart.jsx     # Lap-by-lap position changes
│   ├── DriverCompare.jsx     # Multi-driver comparison
│   └── LoadingCard.jsx       # Skeleton loaders + error states
├── pages/
│   ├── Dashboard.jsx
│   ├── StandingsPage.jsx
│   ├── RacesPage.jsx
│   ├── GraphsPage.jsx
│   └── ComparePage.jsx
├── hooks/
│   └── useF1Data.js          # Polling hooks with auto-refresh
├── context/
│   └── AppContext.jsx        # Global state
├── utils/
│   └── api.js                # All API calls + caching
├── App.jsx
├── main.jsx
└── index.css
```

## 📝 License

MIT — free to use, fork, and deploy.

---

Built with ❤️ for F1 fans. Not affiliated with Formula 1 or the FIA.
