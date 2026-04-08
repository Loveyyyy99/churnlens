// components/CustomerForm.jsx
import { useState, useCallback } from 'react';

const DEFAULT_VALUES = {
  name: '',
  tenure: 12,
  monthlyCharges: 65,
  totalCharges: 780,
  contractType: 'Month-to-month',
  internetService: 'Fiber optic',
  techSupport: 'No',
  onlineSecurity: 'No',
  numServices: 3,
};

const FIELD_CONFIG = [
  { key: 'name', label: 'Customer Name', type: 'text', placeholder: 'e.g. Alex Johnson', span: 2 },
  { key: 'tenure', label: 'Tenure (months)', type: 'range', min: 0, max: 72, step: 1 },
  { key: 'monthlyCharges', label: 'Monthly Charges ($)', type: 'range', min: 10, max: 150, step: 1 },
  { key: 'totalCharges', label: 'Total Charges ($)', type: 'number', placeholder: 'Auto-calculated' },
  { key: 'numServices', label: 'Number of Services', type: 'range', min: 1, max: 8, step: 1 },
  {
    key: 'contractType', label: 'Contract Type', type: 'select',
    options: ['Month-to-month', 'One year', 'Two year'],
  },
  {
    key: 'internetService', label: 'Internet Service', type: 'select',
    options: ['Fiber optic', 'DSL', 'No'],
  },
  {
    key: 'techSupport', label: 'Tech Support', type: 'select',
    options: ['Yes', 'No', 'No internet service'],
  },
  {
    key: 'onlineSecurity', label: 'Online Security', type: 'select',
    options: ['Yes', 'No', 'No internet service'],
  },
];

function RangeField({ field, value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <label className="text-slate-400 font-medium">{field.label}</label>
        <span className="font-mono text-cyan-400 font-bold">
          {field.key === 'monthlyCharges' ? `$${value}` : value}
          {field.key === 'tenure' ? ' mo' : ''}
        </span>
      </div>
      <input
        type="range"
        min={field.min} max={field.max} step={field.step}
        value={value}
        onChange={e => onChange(field.key, field.type === 'range' ? Number(e.target.value) : e.target.value)}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #22d3ee ${((value - field.min) / (field.max - field.min)) * 100}%, rgba(255,255,255,0.08) 0%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-slate-700 font-mono">
        <span>{field.min}{field.key === 'monthlyCharges' ? '$' : ''}</span>
        <span>{field.max}{field.key === 'monthlyCharges' ? '$' : ''}</span>
      </div>
    </div>
  );
}

export default function CustomerForm({ onPredict, loading, isWhatIf = false }) {
  const [form, setForm] = useState(DEFAULT_VALUES);

  const handleChange = useCallback((key, value) => {
    setForm(prev => {
      const updated = { ...prev, [key]: value };
      // Auto-calc total charges
      if (key === 'tenure' || key === 'monthlyCharges') {
        updated.totalCharges = Math.round(Number(updated.tenure) * Number(updated.monthlyCharges));
      }
      return updated;
    });
    if (isWhatIf) {
      // Debounced auto-predict for What-If mode
      onPredict({ ...form, [key]: value });
    }
  }, [form, isWhatIf, onPredict]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onPredict(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FIELD_CONFIG.map((field) => {
          const value = form[field.key];

          if (field.type === 'range') {
            return (
              <div key={field.key} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <RangeField field={field} value={value} onChange={handleChange} />
              </div>
            );
          }

          if (field.type === 'select') {
            return (
              <div key={field.key}>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">{field.label}</label>
                <select
                  value={value}
                  onChange={e => handleChange(field.key, e.target.value)}
                  className="input-field w-full px-3 py-2.5 text-sm appearance-none cursor-pointer"
                  style={{ background: '#0d1526', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 8, color: '#e2e8f0' }}
                >
                  {field.options.map(opt => (
                    <option key={opt} value={opt} style={{ background: '#0d1526' }}>{opt}</option>
                  ))}
                </select>
              </div>
            );
          }

          return (
            <div key={field.key} className={field.span === 2 ? 'sm:col-span-2' : ''}>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">{field.label}</label>
              <input
                type={field.type}
                value={value}
                onChange={e => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="input-field w-full px-3 py-2.5 text-sm"
              />
            </div>
          );
        })}
      </div>

      {!isWhatIf && (
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-200 relative overflow-hidden group"
          style={{
            background: loading ? 'rgba(34,211,238,0.1)' : 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(129,140,248,0.2))',
            border: '1px solid rgba(34,211,238,0.4)',
            color: '#22d3ee',
          }}
        >
          <div className="absolute inset-0 bg-cyan-400/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
          <span className="relative flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </>
            ) : (
              <>⚡ Predict Churn Risk</>
            )}
          </span>
        </button>
      )}

      {/* What-If label */}
      {isWhatIf && (
        <p className="text-xs text-slate-600 text-center font-mono">↑ Adjust sliders to update prediction live</p>
      )}
    </form>
  );
}
