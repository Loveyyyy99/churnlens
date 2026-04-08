// components/CSVUploader.jsx
import { useRef, useState } from 'react';

export default function CSVUploader({ onDataLoaded }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const inputRef = useRef();

  const parseCSV = (text) => {
    try {
      // Simple CSV parser (avoid importing papaparse to reduce bundle)
      const lines = text.trim().split('\n');
      if (lines.length < 2) throw new Error('CSV must have a header and at least one row');

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

      const rows = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return obj;
      }).filter(r => Object.values(r).some(v => v !== ''));

      return rows;
    } catch (e) {
      throw new Error('Failed to parse CSV: ' + e.message);
    }
  };

  const normalizeRow = (row) => {
    // Map common column name variations
    const aliases = {
      tenure: ['tenure', 'Tenure', 'months', 'customer_tenure'],
      monthlyCharges: ['MonthlyCharges', 'monthly_charges', 'monthlycharges', 'monthly', 'Monthly Charges'],
      totalCharges: ['TotalCharges', 'total_charges', 'totalcharges', 'total', 'Total Charges'],
      contractType: ['Contract', 'contract', 'ContractType', 'contract_type', 'Contract Type'],
      internetService: ['InternetService', 'internet_service', 'internet', 'Internet Service'],
      techSupport: ['TechSupport', 'tech_support', 'tech', 'Tech Support'],
      onlineSecurity: ['OnlineSecurity', 'online_security', 'security', 'Online Security'],
      numServices: ['NumServices', 'num_services', 'services', 'Services'],
    };

    const normalized = {};
    for (const [key, aliasList] of Object.entries(aliases)) {
      for (const alias of aliasList) {
        if (row[alias] !== undefined) {
          normalized[key] = row[alias];
          break;
        }
      }
    }

    // Fallbacks
    normalized.tenure = Number(normalized.tenure) || 12;
    normalized.monthlyCharges = Number(normalized.monthlyCharges) || 50;
    normalized.totalCharges = Number(normalized.totalCharges) || normalized.tenure * normalized.monthlyCharges;
    normalized.contractType = normalized.contractType || 'Month-to-month';
    normalized.internetService = normalized.internetService || 'DSL';
    normalized.techSupport = normalized.techSupport || 'No';
    normalized.onlineSecurity = normalized.onlineSecurity || 'No';
    normalized.numServices = Number(normalized.numServices) || 2;
    normalized.name = row.name || row.Name || row.customerID || row.customer_id || `Customer-${Math.random().toString(36).slice(2, 7)}`;
    normalized.id = row.customerID || row.id || normalized.name;

    return normalized;
  };

  const handleFile = async (file) => {
    setError('');
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a .csv file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large — max 5MB');
      return;
    }

    setFileName(file.name);
    const text = await file.text();

    try {
      const raw = parseCSV(text);
      const customers = raw.slice(0, 200).map(normalizeRow);
      onDataLoaded(customers, file.name);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? 'border-cyan-400/60 bg-cyan-400/5'
            : 'border-slate-700 hover:border-cyan-400/40 hover:bg-cyan-400/3'
        }`}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        
        <div className="flex flex-col items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${
            dragging ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-slate-700 bg-slate-900'
          }`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={dragging ? '#22d3ee' : '#64748b'} strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          
          {fileName ? (
            <div>
              <p className="text-sm font-semibold text-cyan-400">{fileName}</p>
              <p className="text-xs text-slate-500 mt-1">Click to replace</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-slate-300">
                {dragging ? 'Drop your CSV here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-slate-600 mt-1">CSV up to 5MB · 200 rows max</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Column guide */}
      <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-600 mb-2">Expected CSV columns</p>
        <div className="flex flex-wrap gap-1.5">
          {['tenure', 'MonthlyCharges', 'TotalCharges', 'Contract', 'InternetService', 'TechSupport', 'OnlineSecurity'].map(col => (
            <span key={col} className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 text-[10px] font-mono">{col}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
