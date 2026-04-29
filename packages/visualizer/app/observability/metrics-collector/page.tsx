'use client';

import { useState, useCallback } from 'react';

interface Metric {
  name: string;
  type: 'counter' | 'gauge';
  value: number;
  history: number[];
}

export default function MetricsCollectorPage() {
  const [metrics, setMetrics] = useState<Metric[]>([
    { name: 'http_requests_total', type: 'counter', value: 0, history: [] },
    { name: 'http_errors_total', type: 'counter', value: 0, history: [] },
    { name: 'active_connections', type: 'gauge', value: 5, history: [5] },
    { name: 'cpu_usage_percent', type: 'gauge', value: 42, history: [42] },
  ]);
  const [log, setLog] = useState<string[]>([]);
  const [scrapeCount, setScrapeCount] = useState(0);

  const simulateTraffic = useCallback(() => {
    setMetrics(prev => {
      const reqDelta = Math.floor(Math.random() * 10) + 1;
      const errorDelta = Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 0;
      const connections = Math.floor(Math.random() * 20) + 1;
      const cpu = Math.floor(Math.random() * 100);

      const updated = prev.map(m => {
        if (m.name === 'http_requests_total') {
          const v = m.value + reqDelta;
          return { ...m, value: v, history: [...m.history.slice(-19), v] };
        }
        if (m.name === 'http_errors_total') {
          const v = m.value + errorDelta;
          return { ...m, value: v, history: [...m.history.slice(-19), v] };
        }
        if (m.name === 'active_connections') {
          return { ...m, value: connections, history: [...m.history.slice(-19), connections] };
        }
        if (m.name === 'cpu_usage_percent') {
          return { ...m, value: cpu, history: [...m.history.slice(-19), cpu] };
        }
        return m;
      });

      setScrapeCount(c => c + 1);
      setLog(prevLog => [
        ...prevLog.slice(-20),
        `SCRAPE #${scrapeCount + 1}: requests+=${reqDelta}, errors+=${errorDelta}, conns=${connections}, cpu=${cpu}%`
      ]);

      return updated;
    });
  }, [scrapeCount]);

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">observability</span>
        <h1>Metrics Collector</h1>
        <p className="subtitle">
          Counters only go up. Gauges fluctuate. Both expose system health for monitoring.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">scrapes</span>
          <span className="stat-value">{scrapeCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">metrics</span>
          <span className="stat-value">{metrics.length}</span>
        </div>
      </div>

      <div className="viz-controls" style={{ marginBottom: 16 }}>
        <button onClick={simulateTraffic} className="btn btn-accent">
          Simulate Traffic (Scrape)
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>
          Each click simulates a Prometheus scrape
        </span>
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {metrics.map(m => {
            const maxVal = Math.max(...m.history, 1);

            return (
              <div key={m.name} style={{
                padding: 14,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: m.type === 'counter' ? 'var(--accent)' : 'var(--info)' }}>
                      {m.type}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-bright)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {m.name}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: m.type === 'counter' ? 'var(--accent)' : 'var(--info)'
                  }}>
                    {m.value}{m.name.includes('percent') ? '%' : ''}
                  </div>
                </div>

                {/* Sparkline */}
                {m.history.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 30 }}>
                    {m.history.map((v, i) => (
                      <div key={i} style={{
                        flex: 1,
                        background: m.type === 'counter' ? 'var(--accent)' : 'var(--info)',
                        opacity: 0.7,
                        borderRadius: '1px 1px 0 0',
                        height: `${(v / maxVal) * 100}%`,
                        minHeight: 1,
                        transition: 'height 0.2s'
                      }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="info-panel">
        <h3>// scrape log</h3>
        <div className="log-area">
          {log.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>No scrapes yet</div>
          ) : (
            log.map((entry, i) => (
              <div key={i} className="log-entry">
                <span style={{ color: 'var(--text-dim)', marginRight: 8 }}>[{String(i + 1).padStart(2, '0')}]</span>
                {entry}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="info-columns" style={{ marginTop: 16 }}>
        <div className="info-panel">
          <h3>How It Works</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Counter: monotonically increasing (total requests)</li>
            <li>Gauge: point-in-time value (current connections)</li>
            <li>Prometheus scrapes /metrics endpoint periodically</li>
            <li>Time-series stored for dashboards and alerting</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Prometheus + Grafana dashboards</li>
            <li>SLA monitoring (error rate, latency)</li>
            <li>Auto-scaling triggers</li>
            <li>Alerting on threshold breaches</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
