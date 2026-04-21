import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

// Tab ids — availability set dynamically from OpenF1 sessions
export const SESSION_LABELS = {
  race:       'Race',
  qualifying: 'Qualifying',
  sprint:     'Sprint',
  sq:         'Sprint Qualifying',
  fp3:        'Practice 3',
  fp2:        'Practice 2',
  fp1:        'Practice 1',
};

export function AppProvider({ children }) {
  const [username, setUsername]           = useState(() => localStorage.getItem('f1_username') || '');
  const [season, setSeason]               = useState('current');
  const [selectedRound, setSelectedRound] = useState('last');
  const [selectedSession, setSelectedSession] = useState('race'); // always default race
  // OpenF1 sessions list for the selected race weekend (null = not loaded yet)
  const [weekendSessions, setWeekendSessions] = useState(null);
  const [activeTab, setActiveTab]         = useState('dashboard');
  const [favouriteDriver, setFavouriteDriver] = useState(() => localStorage.getItem('f1_fav') || null);

  useEffect(() => {
    if (username) localStorage.setItem('f1_username', username);
  }, [username]);
  useEffect(() => {
    if (favouriteDriver) localStorage.setItem('f1_fav', favouriteDriver);
  }, [favouriteDriver]);

  useEffect(() => {
    setSelectedRound('last');
    setSelectedSession('race');
    setWeekendSessions(null);
  }, [season]);

  useEffect(() => {
    setSelectedSession('race');
    setWeekendSessions(null);
  }, [selectedRound]);

  return (
    <AppContext.Provider value={{
      username, setUsername,
      season, setSeason,
      selectedRound, setSelectedRound,
      selectedSession, setSelectedSession,
      weekendSessions, setWeekendSessions,
      activeTab, setActiveTab,
      favouriteDriver, setFavouriteDriver,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
