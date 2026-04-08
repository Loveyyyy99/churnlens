// components/CustomerTable.jsx
import { useState, useMemo } from 'react';

const RISK_BADGE = {
  High: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  Medium: 'bg-amber-400/15 text-amber-400 border-amber-400/25',
  Low: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/25',
};

const RISK_DOT = {
  High: 'bg-rose-400',
  Medium: 'bg-amber-400',
  Low: 'bg-emerald-400',
};

export default function CustomerTable({ customers, onSelect }) {
  const [sortKey, setSortKey] = useState('probability');
  const [sortDir, setSortDir] = useState('desc');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

  const sorted = useMemo(() => {
    let list = [...customers];

    if (filter !== 'All') list = list.filter(c => c.riskLevel === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.id || '').toLowerCase().includes(q) ||
        (c.contractType || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });

    return list;
  }, [customers, sortKey, sortDir, filter, search]);

  const pages = Math.ceil(sorted.length / PER_PAGE);
  const visible = sorted.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }) => (
    <span className={`ml-1 text-[10px] ${sortKey === k ? 'text-cyan-400' : 'text-slate-700'}`}>
      {sortKey === k ? (sortDir === 'desc' ? '▼' : '▲') : '⇅'}
    </span>
  );

  return (
    <div className="card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h2 className="font-display font-700 text-white">Customer Risk Table</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter */}
          {['All', 'High', 'Medium', 'Low'].map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(0); }}
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f ? 'bg-cyan-400/15 border border-cyan-400/40 text-cyan-400' : 'border border-slate-800 text-slate-600 hover:text-slate-400'
              }`}>{f}</button>
          ))}
          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="input-field px-3 py-1.5 text-xs w-36"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              {[
                { key: 'name', label: 'Customer' },
                { key: 'probability', label: 'Churn %' },
                { key: 'riskLevel', label: 'Risk' },
                { key: 'tenure', label: 'Tenure' },
                { key: 'monthlyCharges', label: 'Mo. Charge' },
                { key: 'contractType', label: 'Contract' },
              ].map(col => (
                <th key={col.key}
                  className="text-left py-2.5 px-3 text-[11px] font-mono uppercase tracking-widest text-slate-600 cursor-pointer hover:text-slate-400 select-none whitespace-nowrap"
                  onClick={() => toggleSort(col.key)}>
                  {col.label}<SortIcon k={col.key} />
                </th>
              ))}
              <th className="text-left py-2.5 px-3 text-[11px] font-mono uppercase tracking-widest text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c, i) => (
              <tr key={c.id || i}
                className="border-b border-slate-800/50 table-row-hover cursor-pointer transition-colors"
                onClick={() => onSelect?.(c)}>
                <td className="py-3 px-3">
                  <div className="font-medium text-white text-sm">{c.name || c.id || `—`}</div>
                  <div className="text-[10px] text-slate-600 font-mono">{c.id}</div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{
                          width: `${c.probability}%`,
                          background: c.probability >= 70 ? '#f43f5e' : c.probability >= 40 ? '#fbbf24' : '#34d399',
                        }} />
                    </div>
                    <span className="font-mono text-xs text-slate-300">{c.probability}%</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className={`badge ${RISK_BADGE[c.riskLevel]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${RISK_DOT[c.riskLevel]}`} />
                    {c.riskLevel}
                  </span>
                </td>
                <td className="py-3 px-3 font-mono text-xs text-slate-400">{c.tenure}mo</td>
                <td className="py-3 px-3 font-mono text-xs text-slate-400">${c.monthlyCharges}</td>
                <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">{c.contractType}</td>
                <td className="py-3 px-3">
                  <button
                    onClick={e => { e.stopPropagation(); onSelect?.(c); }}
                    className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-cyan-400/20 text-cyan-400 hover:bg-cyan-400/10 transition-colors">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {visible.length === 0 && (
          <div className="text-center py-10 text-slate-600 text-sm">No customers match your filter</div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-600 font-mono">{sorted.length} results</span>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-xs rounded-lg border border-slate-800 text-slate-500 disabled:opacity-30 hover:text-white hover:border-slate-600 transition-colors">
              ← Prev
            </button>
            <span className="px-3 py-1 text-xs font-mono text-slate-500">{page + 1}/{pages}</span>
            <button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-xs rounded-lg border border-slate-800 text-slate-500 disabled:opacity-30 hover:text-white hover:border-slate-600 transition-colors">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
