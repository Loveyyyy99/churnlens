// components/PredictionResult.jsx
import { useEffect, useState } from 'react';

const RISK_CONFIG = {
  Low: {
    color: '#34d399',
    bg: 'from-emerald-500/10 to-emerald-500/5',
    border: 'border-emerald-500/30',
    glow: 'glow-emerald',
    label: 'LOW RISK',
    emoji: '🟢',
    desc: 'This customer is likely to stay.',
  },
  Medium: {
    color: '#fbbf24',
    bg: 'from-amber-400/10 to-amber-400/5',
    border: 'border-amber-400/30',
    glow: 'glow-amber',
    label: 'MEDIUM RISK',
    emoji: '🟡',
    desc: 'Monitor and engage proactively.',
  },
  High: {
    color: '#f43f5e',
    bg: 'from-rose-500/10 to-rose-500/5',
    border: 'border-rose-500/30',
    glow: 'glow-rose',
    label: 'HIGH RISK',
    emoji: '🔴',
    desc: 'Immediate retention action required.',
  },
};

function RiskMeter({ probability, color }) {
  const [displayPct, setDisplayPct] = useState(0);
  const angle = (probability / 100) * 180;

  useEffect(() => {
    let t = 0;
    const interval = setInterval(() => {
      t = Math.min(t + 2, probability);
      setDisplayPct(t);
      if (t >= probability) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [probability]);

  // SVG gauge
  const R = 70;
  const cx = 90;
  const cy = 90;
  const startAngle = 180;
  const endAngle = startAngle + (displayPct / 100) * 180;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcX = cx + R * Math.cos(toRad(endAngle));
  const arcY = cy + R * Math.sin(toRad(endAngle));
  const largeArc = (displayPct / 100) * 180 > 180 ? 1 : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="180" height="100" viewBox="0 0 180 100">
        {/* Track */}
        <path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round"
        />
        {/* Fill */}
        {displayPct > 0 && (
          <path
            d={`M ${cx - R} ${cy} A ${R} ${R} 0 ${largeArc} 1 ${arcX} ${arcY}`}
            fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
          />
        )}
        {/* Center label */}
        <text x={cx} y={cy - 10} textAnchor="middle" fill={color}
          style={{ fontFamily: 'Space Mono, monospace', fontSize: 26, fontWeight: 700 }}>
          {displayPct}%
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#64748b"
          style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 2 }}>
          CHURN PROB
        </text>
      </svg>
    </div>
  );
}

function ImpactBar({ factor }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(factor.value), 100);
    return () => clearTimeout(t);
  }, [factor.value]);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{factor.name}</span>
        <span className="font-mono" style={{ color: factor.color }}>{factor.value}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, background: factor.color, boxShadow: `0 0 8px ${factor.color}66` }}
        />
      </div>
    </div>
  );
}

export default function PredictionResult({ result }) {
  if (!result) return null;
  const config = RISK_CONFIG[result.riskLevel];

  return (
    <div className="space-y-4 slide-up-fade">
      {/* Main Result Card */}
      <div className={`card bg-gradient-to-br ${config.bg} ${config.border} ${config.glow} p-6`}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Gauge */}
          <div className="flex-shrink-0">
            <RiskMeter probability={result.probability} color={config.color} />
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <div className="badge" style={{ background: `${config.color}20`, color: config.color, border: `1px solid ${config.color}40` }}>
                {config.emoji} {config.label}
              </div>
            </div>
            <p className="text-slate-400 text-sm">{config.desc}</p>

            <div className="space-y-2">
              {result.factors?.map((f, i) => <ImpactBar key={i} factor={f} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Reasons */}
      {result.reasons?.length > 0 && (
        <div className="card p-5 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">Why This Customer May Churn</h3>
          <div className="space-y-2">
            {result.reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-lg flex-shrink-0">{r.icon}</span>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-white">{r.factor}</span>
                    <span className={`badge text-[10px] ${
                      r.impact === 'high' ? 'bg-rose-500/15 text-rose-400 border-rose-500/20' :
                      r.impact === 'medium' ? 'bg-amber-400/15 text-amber-400 border-amber-400/20' :
                      'bg-cyan-400/15 text-cyan-400 border-cyan-400/20'
                    }`}>{r.impact}</span>
                  </div>
                  <p className="text-xs text-slate-500">{r.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Churn Playbook */}
      {result.recommendations?.length > 0 && (
        <div className="card p-5 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">Churn Playbook</h3>
          <div className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/30">
                <span className="text-xl flex-shrink-0">{rec.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-white">{rec.action}</span>
                    <span className={`badge text-[10px] ${
                      rec.priority === 'urgent' ? 'bg-rose-500/15 text-rose-400 border-rose-500/20' :
                      rec.priority === 'high' ? 'bg-amber-400/15 text-amber-400 border-amber-400/20' :
                      'bg-emerald-400/15 text-emerald-400 border-emerald-400/20'
                    }`}>{rec.priority}</span>
                  </div>
                  <p className="text-xs text-slate-500">{rec.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
