import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getSeasonsList } from '../utils/api';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'standings', label: 'Standings' },
  { id: 'races', label: 'Races' },
  { id: 'graphs', label: 'Analysis' },
  { id: 'compare', label: 'Compare' },
];

export default function Navbar({ lastUpdated }) {
  const { username, setUsername, season, setSeason, activeTab, setActiveTab } = useApp();
  const currentYear = new Date().getFullYear();
  const [seasons, setSeasons] = useState(['current', ...getSeasonsList().filter(y => y !== currentYear.toString())]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-f1border bg-f1dark/95 backdrop-blur-md">
      {/* Top red stripe */}
      <div className="h-0.5 bg-gradient-to-r from-f1red via-red-500 to-f1red" />

      <div className="max-w-screen-xl mx-auto px-4">
        {/* Main nav row */}
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="font-display font-black text-xl tracking-tight">
              <span className="text-f1red">F1</span>
              <span className="text-white"> PITWALL</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-f1red/10 border border-f1red/20 rounded px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-f1red live-dot" />
              <span className="text-f1red font-mono text-[10px] uppercase tracking-widest">Live</span>
            </div>
          </div>

          {/* Center: tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded text-sm font-display font-semibold uppercase tracking-wide transition-all ${
                  activeTab === tab.id
                    ? 'bg-f1red text-white'
                    : 'text-f1muted hover:text-white hover:bg-f1card'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right: season + user */}
          <div className="flex items-center gap-3 shrink-0">
            <select
              value={season}
              onChange={e => setSeason(e.target.value)}
              className="bg-f1card border border-f1border text-white text-sm font-mono px-2 py-1 rounded focus:outline-none focus:border-f1red cursor-pointer"
            >
              {seasons.map(s => (
                <option key={s} value={s}>{s === 'current' ? `${currentYear} ▾` : s}</option>
              ))}
            </select>

            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-f1red flex items-center justify-center text-white font-display font-bold text-xs">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="text-white text-sm font-display">{username}</span>
            </div>

            <button
              onClick={() => { localStorage.removeItem('f1_username'); setUsername(''); }}
              className="text-f1muted hover:text-f1red text-xs font-mono transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex md:hidden gap-1 pb-2 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-3 py-1 rounded text-xs font-display font-semibold uppercase tracking-wide transition-all ${
                activeTab === tab.id ? 'bg-f1red text-white' : 'text-f1muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-black/40 border-t border-f1border/50 px-4 py-1 flex items-center justify-between">
        <div className="max-w-screen-xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] font-mono text-f1muted">
            <span>UTC {now.toUTCString().split(' ').slice(4, 5)}</span>
            {lastUpdated && (
              <span>Updated {lastUpdated.toLocaleTimeString()}</span>
            )}
          </div>
          <div className="text-[10px] font-mono text-f1muted">
            Auto-refresh: 30s
          </div>
        </div>
      </div>
    </header>
  );
}
