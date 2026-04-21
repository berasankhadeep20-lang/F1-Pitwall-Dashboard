import React, { useEffect, useState } from 'react';

export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('f1_theme') !== 'light');
  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !dark);
    localStorage.setItem('f1_theme', dark ? 'dark' : 'light');
  }, [dark]);
  return { dark, toggle: () => setDark(d => !d) };
}

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-2 py-1 rounded border border-f1border text-f1muted hover:text-white hover:border-f1muted transition-colors text-xs font-mono"
      title="Toggle dark/light mode"
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
