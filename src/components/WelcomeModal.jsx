import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function WelcomeModal() {
  const { setUsername } = useApp();
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = input.trim() || 'Stranger';
    setUsername(name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
      {/* Background F1 pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-f1red/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-f1red/3 blur-3xl" />
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-px bg-gradient-to-b from-transparent via-f1red/20 to-transparent"
            style={{
              left: `${(i * 5.26)}%`,
              height: '100%',
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md mx-4">
        {/* Card */}
        <div className="f1-card p-8 red-glow border-f1red/30">
          {/* F1 Logo area */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-f1red live-dot" />
              <span className="text-f1red font-mono text-xs tracking-widest uppercase">Live</span>
            </div>
            <div className="text-5xl font-display font-black tracking-tight mb-1">
              <span className="text-f1red">F1</span>
              <span className="text-white"> PITWALL</span>
            </div>
            <p className="text-f1muted font-display text-sm tracking-widest uppercase">
              Dashboard
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-f1border" />
            <div className="w-1 h-1 bg-f1red rounded-full" />
            <div className="flex-1 h-px bg-f1border" />
          </div>

          <p className="text-center text-f1muted text-sm mb-6">
            Enter your name to access the pitwall
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Your name (e.g. Ronnie)"
                maxLength={30}
                autoFocus
                className="w-full bg-black border border-f1border rounded px-4 py-3 text-white placeholder-f1muted/50 font-display focus:outline-none focus:border-f1red transition-colors text-center text-lg"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-f1red hover:bg-red-700 text-white font-display font-bold uppercase tracking-widest py-3 rounded transition-all hover:scale-[1.01] active:scale-95"
            >
              Enter Pitwall
            </button>
          </form>

          <p className="text-center text-f1muted/50 text-xs mt-4 font-mono">
            Press Enter to continue as "Stranger"
          </p>
        </div>

        {/* Bottom accent line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-f1red to-transparent" />
      </div>
    </div>
  );
}
