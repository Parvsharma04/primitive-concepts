'use client';

import { useState, useCallback } from 'react';

type Level = 'info' | 'warn' | 'error' | 'debug';

interface LogLine {
  timestamp: string;
  level: Level;
  service: string;
  message: string;
  traceId: string;
}

const SERVICES = ['auth', 'orders', 'payments', 'gateway'];

export default function StructuredLoggerPage() {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [filter, setFilter] = useState<Level | 'all'>('all');

  const emit = useCallback((level: Level) => {
    const messages: Record<Level, string[]> = {
      info: ['Request processed', 'User authenticated', 'Order created', 'Payment confirmed'],
      warn: ['Slow query detected (2.3s)', 'Rate limit at 80%', 'Retry attempt #2', 'Connection pool low'],
      error: ['Connection refused', 'Timeout exceeded (5s)', 'Invalid token', 'Disk full'],
      debug: ['Cache hit ratio: 0.94', 'Query plan: seq_scan', 'Middleware invoked', 'GC pause: 12ms'],
    };

    const line: LogLine = {
      timestamp: new Date().toISOString(),
      level,
      service: SERVICES[Math.floor(Math.random() * SERVICES.length)],
      message: messages[level][Math.floor(Math.random() * messages[level].length)],
      traceId: `trace-${Math.random().toString(36).slice(2, 10)}`,
    };
    setLogs(prev => [...prev.slice(-50), line]);
  }, []);

  const simulate = useCallback(() => {
    const levels: Level[] = ['info', 'info', 'info', 'debug', 'warn', 'error'];
    for (let i = 0; i < 5; i++) {
      setTimeout(() => emit(levels[Math.floor(Math.random() * levels.length)]), i * 100);
    }
  }, [emit]);

  const filtered = filter === 'all' ? logs : logs.filter(l => l.level === filter);

  const levelColor = (l: Level) =>
    l === 'error' ? 'var(--danger)'
    : l === 'warn' ? 'var(--warning)'
    : l === 'debug' ? 'var(--text-dim)'
    : 'var(--accent)';

  const counts = {
    info: logs.filter(l => l.level === 'info').length,
    warn: logs.filter(l => l.level === 'warn').length,
    error: logs.filter(l => l.level === 'error').length,
    debug: logs.filter(l => l.level === 'debug').length,
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">observability</span>
        <h1>Structured Logger</h1>
        <p className="subtitle">
          JSON log lines with consistent fields — machine-parseable, filterable, correlatable.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">total</span>
          <span className="stat-value">{logs.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">info</span>
          <span className="stat-value" style={{ color: 'var(--accent)' }}>{counts.info}</span>
        </div>
        <div className="stat">
          <span className="stat-label">warn</span>
          <span className="stat-value" style={{ color: 'var(--warning)' }}>{counts.warn}</span>
        </div>
        <div className="stat">
          <span className="stat-label">error</span>
          <span className="stat-value" style={{ color: 'var(--danger)' }}>{counts.error}</span>
        </div>
      </div>

      <div className="viz-controls" style={{ marginBottom: 16 }}>
        <button onClick={() => emit('info')} className="btn btn-accent">Log INFO</button>
        <button onClick={() => emit('warn')} className="btn" style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}>Log WARN</button>
        <button onClick={() => emit('error')} className="btn" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>Log ERROR</button>
        <button onClick={simulate} className="btn">Simulate ×5</button>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as Level | 'all')}
          className="sim-input"
          style={{ width: 80 }}
        >
          <option value="all">all</option>
          <option value="info">info</option>
          <option value="warn">warn</option>
          <option value="error">error</option>
          <option value="debug">debug</option>
        </select>
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-bright)', marginBottom: 12 }}>
          Log Stream ({filtered.length} entries{filter !== 'all' ? ` — filtered: ${filter}` : ''})
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, fontStyle: 'italic' }}>
            No log entries yet
          </div>
        ) : (
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            {filtered.map((l, i) => (
              <div key={i} style={{
                fontSize: 10,
                padding: '4px 8px',
                marginBottom: 2,
                borderLeft: `3px solid ${levelColor(l.level)}`,
                background: 'var(--surface-2)',
                borderRadius: '0 4px 4px 0',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-dim)'
              }}>
                <span style={{ color: levelColor(l.level), fontWeight: 600 }}>{l.level.toUpperCase().padEnd(5)}</span>
                {' '}
                <span style={{ color: 'var(--text-dim)' }}>{l.timestamp.slice(11, 23)}</span>
                {' '}
                <span style={{ color: 'var(--info)' }}>[{l.service}]</span>
                {' '}
                <span style={{ color: 'var(--text-bright)' }}>{l.message}</span>
                {' '}
                <span style={{ color: 'var(--text-dim)', opacity: 0.7 }}>{l.traceId}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="info-columns" style={{ marginTop: 16 }}>
        <div className="info-panel">
          <h3>How It Works</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Each line is a structured JSON object</li>
            <li>Standard fields: timestamp, level, service, trace_id</li>
            <li>Machine-parseable for aggregation (ELK, Loki)</li>
            <li>Filter by level, service, or trace ID</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Centralized logging (ELK, Datadog, Loki)</li>
            <li>Debugging across microservices</li>
            <li>Audit trails and compliance</li>
            <li>Correlation via trace IDs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
