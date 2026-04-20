import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [username, setUsername] = useState(() => localStorage.getItem('f1_username') || '');
  const [season, setSeason] = useState('current');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDrivers, setSelectedDrivers] = useState([]);

  useEffect(() => {
    if (username) localStorage.setItem('f1_username', username);
  }, [username]);

  return (
    <AppContext.Provider value={{
      username, setUsername,
      season, setSeason,
      activeTab, setActiveTab,
      selectedDrivers, setSelectedDrivers,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
