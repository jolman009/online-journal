import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useMoodData, MOODS } from '../../hooks/useMoodData';

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

function MoodTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const mood = MOODS.find(m => m.value === d.mood);
  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--glass-4)',
      borderRadius: '8px',
      padding: '0.5rem 0.75rem',
      fontSize: '0.8rem',
    }}>
      <div style={{ color: 'var(--text-strong)', fontWeight: 600 }}>{d.date}</div>
      <div style={{ color: 'var(--muted)' }}>{mood?.emoji} {mood?.label} ({d.mood}/5)</div>
    </div>
  );
}

export default function MoodChartWidget({ config, entries }) {
  const [chartType, setChartType] = useState(config.chartType || 'line');
  const [range, setRange] = useState(config.range || 30);
  const data = useMoodData(entries, range);

  const formattedData = useMemo(() => {
    return data.map(d => ({
      ...d,
      shortDate: d.date.slice(5), // MM-DD
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="mood-chart-widget__empty">
        No mood data yet. Add moods to your entries!
      </div>
    );
  }

  return (
    <div className="mood-chart-widget">
      <div className="mood-chart-widget__controls">
        <button
          className={`mood-chart-widget__toggle${chartType === 'line' ? ' mood-chart-widget__toggle--active' : ''}`}
          onClick={() => setChartType('line')}
        >
          Line
        </button>
        <button
          className={`mood-chart-widget__toggle${chartType === 'bar' ? ' mood-chart-widget__toggle--active' : ''}`}
          onClick={() => setChartType('bar')}
        >
          Bar
        </button>
        <span style={{ flex: 1 }} />
        {RANGES.map(r => (
          <button
            key={r.days}
            className={`mood-chart-widget__toggle${range === r.days ? ' mood-chart-widget__toggle--active' : ''}`}
            onClick={() => setRange(r.days)}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="mood-chart-widget__chart">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-3)" />
              <XAxis dataKey="shortDate" tick={{ fontSize: 10, fill: 'var(--muted)' }} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: 'var(--muted)' }} width={25} />
              <Tooltip content={<MoodTooltip />} />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--accent)' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : (
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-3)" />
              <XAxis dataKey="shortDate" tick={{ fontSize: 10, fill: 'var(--muted)' }} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: 'var(--muted)' }} width={25} />
              <Tooltip content={<MoodTooltip />} />
              <Bar dataKey="mood" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
