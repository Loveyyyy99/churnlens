// components/AIInsights.jsx
import { useState, useEffect } from 'react';

function InsightCard({ insight, index }) {
  return (
    <div
      className="flex gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800 slide-up-fade"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base"
        style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)' }}
      >
        {insight.icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white mb-0.5">{insight.title}</p>
        <p className="text-xs text-slate-500 leading-relaxed">{insight.body}</p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex gap-3 p-3 rounded-lg border border-slate-800">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg shimmer" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 rounded shimmer w-3/4" />
        <div className="h-2.5 rounded shimmer w-full" />
        <div className="h-2.5 rounded shimmer w-5/6" />
      </div>
    </div>
  );
}

export function AIInsights({ stats, industryKey, onAlertsUpdate }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastFetched, setLastFetched] = useState(null);

  const fetchInsights = async () => {
    if (!stats) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats, industry: industryKey }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch insights');

      setInsights(data.insights || []);
      setLastFetched(new Date());
      
      // Pass alerts back to parent
      if (onAlertsUpdate && data.alerts) {
        onAlertsUpdate(data.alerts);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stats) fetchInsights();
  }, [stats?.total, stats?.highRisk, industryKey]);

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400 animate-pulse'}`} />
        <h2 className="font-display font-700 text-white text-sm">AI Insights</h2>
        <span className="ml-auto flex items-center gap-2">
          {lastFetched && !loading && (
            <span className="text-[10px] font-mono text-slate-600">
              {lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="badge bg-cyan-400/10 text-cyan-400 border-cyan-400/20 text-[10px] hover:bg-cyan-400/20 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Generating...' : ' Gemini 3.1'}
          </button>
        </span>
      </div>

      <div className="space-y-2.5">
        {loading && [1,2,3,4].map(i => <SkeletonCard key={i} />)}

        {!loading && error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 space-y-2">
            <p className="text-xs text-rose-400 font-semibold"> Could not generate insights</p>
            <p className="text-xs text-slate-500">{error}</p>
            <button onClick={fetchInsights} className="text-xs text-cyan-400 hover:text-cyan-300 underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && insights.length === 0 && (
          <div className="text-center py-6 text-slate-600 text-xs">
            No insights yet — load customer data first
          </div>
        )}

        {!loading && !error && insights.map((insight, i) => (
          <InsightCard key={i} insight={insight} index={i} />
        ))}
      </div>
    </div>
  );
}

export function AlertsPanel({ alerts, loading }) {
  const typeConfig = {
    danger: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', dot: 'bg-rose-400' },
    warning: { bg: 'bg-amber-400/10', border: 'border-amber-400/20', text: 'text-amber-400', dot: 'bg-amber-400' },
    success: { bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  };

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="font-display font-700 text-white text-sm">AI Alerts</h2>
        {alerts && alerts.some(a => a.type === 'danger') && (
          <span className="badge bg-rose-500/15 text-rose-400 border-rose-500/20 animate-pulse-slow">
            Action Required
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        {loading && [1,2].map(i => <SkeletonCard key={i} />)}
        
        {!loading && (!alerts || alerts.length === 0) && (
          <div className="text-center py-6 text-slate-600 text-xs">
            No alerts yet — generating from AI...
          </div>
        )}
        
        {!loading && alerts && alerts.map((alert, i) => {
          const cfg = typeConfig[alert.type] || typeConfig.success;
          return (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${cfg.bg} border ${cfg.border}`}>
              <span className="text-base flex-shrink-0">{alert.icon}</span>
              <p className={`text-xs font-medium ${cfg.text} leading-relaxed`}>{alert.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}