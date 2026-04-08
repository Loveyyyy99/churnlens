// components/Charts.jsx
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Area, AreaChart, Legend
} from 'recharts';

const COLORS = {
  cyan: '#22d3ee',
  rose: '#f43f5e',
  amber: '#fbbf24',
  indigo: '#818cf8',
  emerald: '#34d399',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-obsidian-800 border border-cyan-400/20 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-1 font-mono">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-bold">
          {entry.name}: {entry.value}{entry.name?.includes('Rate') || entry.name?.includes('Churn') ? '%' : ''}
        </p>
      ))}
    </div>
  );
};

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card p-6 flex flex-col gap-4">
      <div>
        <h3 className="font-display font-700 text-sm text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function Charts({ stats }) {
  if (!stats) return null;

  const contractData = stats.contractChurn.map(d => ({
    ...d,
    fill: d.name === 'Month-to-month' ? COLORS.rose : d.name === 'One year' ? COLORS.amber : COLORS.emerald,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Contract Type Churn */}
      <ChartCard title="Churn by Contract Type" subtitle="High-risk % per contract tier">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={contractData} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => v.split(' ')[0]} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="rate" name="Churn Rate" radius={[4, 4, 0, 0]}>
              {contractData.map((entry, i) => <Cell key={i} fill={entry.fill} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Tenure vs Churn */}
      <ChartCard title="Churn vs Tenure" subtitle="How churn risk changes over time">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.tenureChurn} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="churnRate" name="Churn Rate" radius={[4, 4, 0, 0]} fill={COLORS.cyan} fillOpacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Monthly Trend */}
      <ChartCard title="Monthly Churn Trend" subtitle="6-month rolling churn rate">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={stats.monthlyTrend}>
            <defs>
              <linearGradient id="churnGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.rose} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.rose} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.06)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="churnRate" name="Churn Rate"
              stroke={COLORS.rose} strokeWidth={2} fill="url(#churnGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
