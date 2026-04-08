// components/WhatIfSimulator.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { predictChurn } from '../lib/churnEngine';
import PredictionResult from './PredictionResult';

const SLIDERS = [
  { key: 'tenure', label: 'Tenure', min: 0, max: 72, step: 1, unit: 'mo', color: '#22d3ee' },
  { key: 'monthlyCharges', label: 'Monthly Charges', min: 10, max: 150, step: 5, unit: '$', color: '#fbbf24' },
  { key: 'numServices', label: 'Services Used', min: 1, max: 8, step: 1, unit: '', color: '#818cf8' },
];

const TOGGLES = [
  { key: 'contractType', label: 'Contract', options: ['Month-to-month', 'One year', 'Two year'] },
  { key: 'techSupport', label: 'Tech Support', options: ['Yes', 'No'] },
  { key: 'onlineSecurity', label: 'Online Security', options: ['Yes', 'No'] },
];

const BASE_STATE = {
  tenure: 12,
  monthlyCharges: 75,
  numServices: 2,
  contractType: 'Month-to-month',
  techSupport: 'No',
  onlineSecurity: 'No',
  internetService: 'Fiber optic',
};

export default function WhatIfSimulator({ industryKey }) {
  const [state, setState] = useState(BASE_STATE);
  const [result, setResult] = useState(null);
  const debounceRef = useRef();

  const runPrediction = useCallback((s) => {
    const r = predictChurn({
      ...s,
      totalCharges: s.tenure * s.monthlyCharges,
    }, industryKey);
    setResult(r);
  }, [industryKey]);

  useEffect(() => {
    // Initial prediction
    runPrediction(state);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runPrediction(state), 80);
    return () => clearTimeout(debounceRef.current);
  }, [state, runPrediction]);

  const update = (key, val) => setState(prev => ({ ...prev, [key]: val }));

  const resetToHighRisk = () => setState({
    tenure: 2,
    monthlyCharges: 120,
    numServices: 1,
    contractType: 'Month-to-month',
    techSupport: 'No',
    onlineSecurity: 'No',
    internetService: 'Fiber optic',
  });

  const resetToLowRisk = () => setState({
    tenure: 60,
    monthlyCharges: 40,
    numServices: 6,
    contractType: 'Two year',
    techSupport: 'Yes',
    onlineSecurity: 'Yes',
    internetService: 'DSL',
  });

  const prob = result?.probability || 0;
  const meterColor = prob >= 70 ? '#f43f5e' : prob >= 40 ? '#fbbf24' : '#34d399';

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-700 text-white">What-If Simulator</h2>
          <p className="text-xs text-slate-500 mt-0.5">Adjust parameters to see churn probability update live</p>
        </div>
        <div className="flex gap-2">
          <button onClick={resetToHighRisk}
            className="px-3 py-1.5 text-xs rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors font-bold">
            High Risk Preset
          </button>
          <button onClick={resetToLowRisk}
            className="px-3 py-1.5 text-xs rounded-lg border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 transition-colors font-bold">
            Low Risk Preset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-5">
          {/* Sliders */}
          {SLIDERS.map(sl => (
            <div key={sl.key} className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{sl.label}</span>
                <span className="font-mono font-bold" style={{ color: sl.color }}>
                  {sl.key === 'monthlyCharges' ? '$' : ''}{state[sl.key]}{sl.unit && sl.key !== 'monthlyCharges' ? sl.unit : ''}
                </span>
              </div>
              <input
                type="range" min={sl.min} max={sl.max} step={sl.step}
                value={state[sl.key]}
                onChange={e => update(sl.key, Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${sl.color} ${((state[sl.key] - sl.min) / (sl.max - sl.min)) * 100}%, rgba(255,255,255,0.08) 0%)`,
                }}
              />
            </div>
          ))}

          {/* Toggles */}
          <div className="space-y-3 pt-2">
            {TOGGLES.map(tg => (
              <div key={tg.key}>
                <p className="text-xs text-slate-500 mb-2">{tg.label}</p>
                <div className="flex gap-2">
                  {tg.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => update(tg.key, opt)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        state[tg.key] === opt
                          ? 'bg-cyan-400/15 border border-cyan-400/40 text-cyan-400'
                          : 'border border-slate-800 text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      {opt.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Result */}
        <div className="space-y-4">
          {/* Big probability display */}
          <div className="card p-4 text-center space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-600">Live Churn Probability</p>
            <div className="relative">
              <div className="text-5xl font-display font-800 transition-all duration-300" style={{ color: meterColor }}>
                {prob}%
              </div>
            </div>
            {/* Bar */}
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden mx-auto max-w-xs">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${prob}%`, background: meterColor, boxShadow: `0 0 12px ${meterColor}66` }}
              />
            </div>
            {result && (
              <div className={`badge mx-auto ${
                result.riskLevel === 'High' ? 'bg-rose-500/15 text-rose-400 border-rose-500/20' :
                result.riskLevel === 'Medium' ? 'bg-amber-400/15 text-amber-400 border-amber-400/20' :
                'bg-emerald-400/15 text-emerald-400 border-emerald-400/20'
              }`}>
                {result.riskLevel} Risk
              </div>
            )}
          </div>

          {/* Key reason */}
          {result?.reasons?.[0] && (
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 flex gap-3 items-start">
              <span className="text-xl">{result.reasons[0].icon}</span>
              <div>
                <p className="text-xs font-semibold text-white">{result.reasons[0].factor}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{result.reasons[0].detail}</p>
              </div>
            </div>
          )}

          {/* Top recommendation */}
          {result?.recommendations?.[0] && (
            <div className="p-3 rounded-lg bg-cyan-400/5 border border-cyan-400/15 flex gap-3 items-start">
              <span className="text-xl">{result.recommendations[0].icon}</span>
              <div>
                <p className="text-xs font-semibold text-cyan-300">{result.recommendations[0].action}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{result.recommendations[0].detail}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
