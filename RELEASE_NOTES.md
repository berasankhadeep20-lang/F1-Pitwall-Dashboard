# Release Notes

## v1.1.0 — April 20, 2026

### 🐛 Bug Fixes

**Season year mismatch resolved**  
The dashboard was hardcoding "2025" as the current season label. The season selector and all year references are now computed dynamically from `new Date().getFullYear()`, so the label and default will always reflect the real current year going forward.

**Championship chart missing drivers**  
The standings progression endpoint was slicing results to the top 10. All 20 drivers are now included in the chart data, and their lines are individually toggleable.

---

### ✨ New Features

**Driver toggle on Championship chart**  
Every driver on the grid now has a colour-coded pill button above the progression chart. Click to hide/show individual lines. Three quick-select buttons — **All**, **Top 5**, **None** — let you jump to common views instantly.

**Automatic GitHub Pages deployment**  
A GitHub Actions workflow is included at `.github/workflows/deploy.yml`. After a one-time setup (enable Pages with "GitHub Actions" as the source in your repo settings), every push to `main` automatically builds and deploys the site. No manual commands needed.

---

### 📋 Setup for Auto-Deploy

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source → GitHub Actions**
3. Push any commit to `main`
4. Your site will be live at `https://<username>.github.io/f1-pitwall-dashboard/`

---

## v1.0.0 — April 20, 2026

Initial public release. See `CHANGELOG.md` for the full feature list.
