import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import WelcomeModal from './components/WelcomeModal';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import StandingsPage from './pages/StandingsPage';
import RacesPage from './pages/RacesPage';
import GraphsPage from './pages/GraphsPage';
import ComparePage from './pages/ComparePage';

function AppInner() {
  const { username, activeTab } = useApp();
  const [lastUpdated, setLastUpdated] = useState(null);

  if (!username) return <WelcomeModal />;

  const pages = {
    dashboard: <Dashboard />,
    standings: <StandingsPage />,
    races: <RacesPage />,
    graphs: <GraphsPage />,
    compare: <ComparePage />,
  };

  return (
    <div className="min-h-screen bg-f1dark">
      <Navbar lastUpdated={lastUpdated} />

      {/* Greeting banner */}
      <div className="border-b border-f1border bg-f1card/50">
        <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center gap-3">
          <span className="text-f1muted font-mono text-xs">👋</span>
          <span className="text-white font-display font-semibold text-sm">
            Welcome back, <span className="text-f1red">{username}</span>
          </span>
          <span className="text-f1muted font-mono text-xs ml-auto hidden sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        {pages[activeTab] ?? <Dashboard />}
      </main>

      {/* Footer */}
      <footer className="border-t border-f1border mt-12 py-6 text-center">
        <p className="text-f1muted font-mono text-xs">
          Data via{' '}
          <a href="https://jolpi.ca" target="_blank" rel="noreferrer" className="text-f1red hover:underline">Jolpica/Ergast API</a>
          {' · '}
          <a href="https://openf1.org" target="_blank" rel="noreferrer" className="text-f1red hover:underline">OpenF1</a>
          {' · Not affiliated with Formula 1 Group'}
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
