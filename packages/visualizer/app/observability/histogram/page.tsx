'use client';

import { useState, useCallback } from 'react';

const BUCKETS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

export default function HistogramPage() {
  const [observations, setObservations] = useState<number[]>([]);
  const [bucketCounts, setBucketCounts] = useState(new Array(BUCKETS.length + 1).fill(0));

  const observe = useCallback((value?: number) => {
    const v = value ?? Math.floor(Math.random() * 1200 * Math.random());
    setObservations(prev => [...prev, v]);
    setBucketCounts(prev => {
      const next = [...prev];
      const idx = BUCKETS.findIndex(b => v <= b);
      next[idx === -1 ? BUCKETS.length : idx]++;
      return next;
    });
  }, []);

  const simulateBurst = useCallback(() => {
    for (let i = 0; i < 20; i++) {
      setTimeout(() => observe(), i * 50);
    }
  }, [observe]);

  const reset = useCallback(() => {
    setObservations([]);
    setBucketCounts(new Array(BUCKETS.length + 1).fill(0));
  }, []);

  const sorted = [...observations].sort((a, b) => a - b);
  const count = sorted.length;
  const p50 = count > 0 ? sorted[Math.floor(count * 0.5)] : 0;
  const p95 = count > 0 ? sorted[Math.floor(count * 0.95)] : 0;
  const p99 = count > 0 ? sorted[Math.floor(count * 0.99)] : 0;
  const avg = count > 0 ? Math.round(sorted.reduce((a, b) => a + b, 0) / count) : 0;
  const maxCount = Math.max(...bucketCounts, 1);

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">observability</span>
        <h1>Histogram</h1>
        <p className="subtitle">
          Track latency distributions with bucket counts. Compute percentiles for SLA monitoring.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">count</span>
          <span className="stat-value">{count}</span>
        </div>
        <div className="stat">
          <span className="stat-label">avg</span>
          <span className="stat-value">{avg}ms</span>
        </div>
        <div className="stat">
          <span className="stat-label">p50</span>
          <span className="stat-value" style={{ color: 'var(--accent)' }}>{p50}ms</span>
        </div>
        <div className="stat">
          <span className="stat-label">p95</span>
          <span className="stat-value" style={{ color: 'var(--info)' }}>{p95}ms</span>
        </div>
        <div className="stat">
          <span className="stat-label">p99</span>
          <span className="stat-value" style={{ color: 'var(--warning)' }}>{p99}ms</span>
        </div>
      </div>

      <div className="viz-controls" style={{ marginBottom: 16 }}>
        <button onClick={() => observe()} className="btn btn-accent">Observe Random</button>
        <button onClick={simulateBurst} className="btn">Burst ×20</button>
        <button onClick={reset} className="btn">Reset</button>
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        {/* Bar chart */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 3,
          height: 140,
          padding: '0 4px'
        }}>
          {bucketCounts.map((count, i) => (
            <div key={i} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
              justifyContent: 'flex-end'
            }}>
              {count > 0 && (
                <div style={{ fontSize: 9, color: 'var(--text-dim)', marginBottom: 2 }}>
                  {count}
                </div>
              )}
              <div style={{
                width: '100%',
                background: i < 3
                  ? 'var(--accent)'
                  : i < 6
                  ? 'var(--info)'
                  : 'var(--warning)',
                borderRadius: '2px 2px 0 0',
                height: `${(count / maxCount) * 100}%`,
                minHeight: count > 0 ? 2 : 0,
                transition: 'height 0.2s',
                opacity: 0.85
              }} />
            </div>
          ))}
        </div>
        {/* Bucket labels */}
        <div style={{ display: 'flex', gap: 3, marginTop: 4, padding: '0 4px' }}>
          {bucketCounts.map((_, i) => (
            <div key={i} style={{
              flex: 1,
              fontSize: 8,
              color: 'var(--text-dim)',
              textAlign: 'center'
            }}>
              {i < BUCKETS.length ? `≤${BUCKETS[i]}` : `>${BUCKETS[BUCKETS.length - 1]}`}
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-dim)', marginTop: 8 }}>
          latency (ms)
        </div>
      </div>

      <div className="info-panel">
        <h3>// recent observations (last 20)</h3>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', padding: '4px 0' }}>
          {observations.length === 0
            ? 'none yet'
            : observations.slice(-20).map(v => `${v}ms`).join(', ')
          }
        </div>
      </div>

      <div className="info-columns" style={{ marginTop: 16 }}>
        <div className="info-panel">
          <h3>How It Works</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Each observation falls into a bucket (≤ threshold)</li>
            <li>Percentiles estimated from cumulative distribution</li>
            <li>p50 = median, p99 = tail latency</li>
            <li>O(1) per observation, O(buckets) for percentile</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Request latency tracking (Prometheus)</li>
            <li>SLA monitoring (p99 &lt; 200ms)</li>
            <li>Database query performance</li>
            <li>Response size distributions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
