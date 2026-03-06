import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

function getBarColor(probability) {
  if (probability > 0.7) return '#ef4444';
  if (probability > 0.4) return '#eab308';
  return '#22c55e';
}

export default function ConfidenceChart({ findings }) {
  const data = findings
    .filter((f) => f.probability > 0.1)
    .sort((a, b) => b.probability - a.probability)
    .map((f) => ({
      name: f.condition.length > 18 ? f.condition.slice(0, 16) + '…' : f.condition,
      value: Math.round(f.probability * 100),
      probability: f.probability,
    }));

  if (data.length === 0) return null;

  return (
    <div className="w-full" style={{ height: Math.max(120, data.length * 36) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={{ stroke: '#3a3a55' }}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip
            cursor={{ fill: 'rgba(59,130,246,0.08)' }}
            contentStyle={{
              background: '#1a1a2e',
              border: '1px solid #3a3a55',
              borderRadius: 8,
              fontSize: 12,
              color: '#e2e8f0',
            }}
            formatter={(v) => [`${v}%`, 'Confidence']}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={getBarColor(entry.probability)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
