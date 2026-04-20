import React from 'react';

export function SkeletonRow({ cols = 4 }) {
  return (
    <div className="flex gap-3 p-3">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex-1 h-4 rounded shimmer" />
      ))}
    </div>
  );
}

export function LoadingCard({ rows = 5, title }) {
  return (
    <div className="f1-card p-4">
      {title && <div className="w-32 h-5 rounded shimmer mb-4" />}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} cols={4} />
        ))}
      </div>
    </div>
  );
}

export function ErrorCard({ message }) {
  return (
    <div className="f1-card p-6 border-red-900/50 text-center">
      <div className="text-2xl mb-2">⚠️</div>
      <p className="text-f1muted text-sm font-mono">Failed to load data</p>
      <p className="text-red-400 text-xs mt-1 font-mono">{message}</p>
    </div>
  );
}

export function SectionHeader({ title, subtitle, accent }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <div className="flex items-center gap-2">
          {accent && <div className="w-1 h-5 bg-f1red rounded-full" />}
          <h2 className="text-white font-display font-bold text-lg uppercase tracking-wide">{title}</h2>
        </div>
        {subtitle && <p className="text-f1muted text-xs font-mono mt-0.5 ml-3">{subtitle}</p>}
      </div>
    </div>
  );
}
