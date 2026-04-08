// components/Header.jsx
import { useState } from 'react';
import { INDUSTRIES } from '../lib/churnEngine';

export default function Header({ industry, onIndustryChange, customerCount }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-400/10 backdrop-blur-xl"
      style={{ background: 'rgba(3,5,8,0.85)' }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex-shrink-0">
              <div className="absolute inset-0 bg-cyan-400/20 rounded-lg blur-sm" />
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400/30 to-indigo-500/30 border border-cyan-400/30">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div>
              <div className="font-display font-800 text-base text-white tracking-tight leading-none">
                ChurnLens
              </div>
              <div className="text-[10px] text-cyan-400/60 font-mono uppercase tracking-widest mt-0.5">
                AI Prediction Platform
              </div>
            </div>
          </div>

          {/* Center — Industry Selector */}
          <div className="hidden sm:flex items-center gap-2">
            {Object.entries(INDUSTRIES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => onIndustryChange(key)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  industry === key
                    ? 'bg-cyan-400/15 border border-cyan-400/40 text-cyan-400'
                    : 'border border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'
                }`}
              >
                {val.label}
              </button>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            {customerCount > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
                <div className="relative w-2 h-2">
                  <div className="absolute inset-0 rounded-full bg-emerald-400 pulse-dot" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-mono text-emerald-400">{customerCount} loaded</span>
              </div>
            )}
            <div className="text-xs font-mono text-slate-600 hidden lg:block">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Mobile industry selector */}
        <div className="sm:hidden pb-3 flex gap-2 overflow-x-auto">
          {Object.entries(INDUSTRIES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => onIndustryChange(key)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                industry === key
                  ? 'bg-cyan-400/15 border border-cyan-400/40 text-cyan-400'
                  : 'border border-slate-800 text-slate-500'
              }`}
            >
              {val.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
