// components/StatsCards.jsx
import { useEffect, useState } from 'react';

function AnimatedNumber({ target, duration = 1000, suffix = '' }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCurrent(Math.round(start));
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{current.toLocaleString()}{suffix}</span>;
}

const cards = [
  {
    key: 'total',
    label: 'Total Customers',
    icon: '👥',
    color: 'cyan',
    border: 'border-cyan-400/20',
    glow: 'glow-cyan',
    bg: 'from-cyan-400/10 to-transparent',
    text: 'text-cyan-400',
  },
  {
    key: 'highRisk',
    label: 'High Risk',
    icon: '⚠️',
    color: 'rose',
    border: 'border-rose-500/20',
    glow: 'glow-rose',
    bg: 'from-rose-500/10 to-transparent',
    text: 'text-rose-400',
  },
  {
    key: 'medRisk',
    label: 'Medium Risk',
    icon: '🟡',
    color: 'amber',
    border: 'border-amber-400/20',
    glow: 'glow-amber',
    bg: 'from-amber-400/10 to-transparent',
    text: 'text-amber-400',
  },
  {
    key: 'avgChurn',
    label: 'Avg Churn Risk',
    icon: '📈',
    color: 'indigo',
    border: 'border-indigo-400/20',
    glow: '',
    bg: 'from-indigo-400/10 to-transparent',
    text: 'text-indigo-400',
    suffix: '%',
  },
];

export default function StatsCards({ stats }) {
  if (!stats) return null;

  const values = {
    total: stats.total,
    highRisk: stats.highRisk,
    medRisk: stats.medRisk,
    avgChurn: stats.avgChurn,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
      {cards.map((card) => (
        <div key={card.key} className={`card ${card.border} ${card.glow} relative overflow-hidden group`}>
          {/* Gradient accent */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.bg} opacity-60 group-hover:opacity-100 transition-opacity`} />
          
          <div className="relative p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <span className={`text-xs font-mono uppercase tracking-widest ${card.text} opacity-60`}>
                {card.key === 'avgChurn' ? 'risk' : 'count'}
              </span>
            </div>
            <div className={`font-display font-800 text-3xl ${card.text} mb-1`}>
              <AnimatedNumber target={values[card.key]} suffix={card.suffix || ''} />
            </div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              {card.label}
            </div>

            {/* Mini bar */}
            {card.key !== 'total' && stats.total > 0 && (
              <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000`}
                  style={{
                    width: `${Math.min(100, (values[card.key] / (card.suffix ? 100 : stats.total)) * 100)}%`,
                    background: card.key === 'highRisk' ? '#f43f5e' : card.key === 'medRisk' ? '#fbbf24' : '#818cf8',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
