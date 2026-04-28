'use client';

import { useState, useCallback } from 'react';

type Level = 'info' | 'warn' | 'error' | 'debug';
interface LogLine { timestamp: string; level: Level; service: string; message: string; traceId: string; [key: string]: string; }

const SERVICES = ['auth', 'orders', 'payments'];

export default function StructuredLoggerPage() {
    const [logs, setLogs] = useState<LogLine[]>([]);
    const [filter, setFilter] = useState<Level | 'all'>('all');

    const emit = useCallback((level: Level) => {
        const messages: Record<Level, string[]> = {
            info: ['Request processed', 'User authenticated', 'Order created'],
            warn: ['Slow query detected', 'Rate limit approaching', 'Retry attempted'],
            error: ['Connection refused', 'Timeout exceeded', 'Invalid token'],
            debug: ['Cache hit', 'Query plan generated', 'Middleware invoked'],
        };
        const line: LogLine = {
            timestamp: new Date().toISOString(),
            level,
            service: SERVICES[Math.floor(Math.random() * SERVICES.length)],
            message: messages[level][Math.floor(Math.random() * messages[level].length)],
            traceId: `trace-${Math.random().toString(36).slice(2, 10)}`,
        };
        setLogs(prev => [...prev.slice(-30), line]);
    }, []);

    const simulate = useCallback(() => {
        const levels: Level[] = ['info', 'info', 'info', 'debug', 'warn', 'error'];
        for (let i = 0; i < 5; i++) setTimeout(() => emit(levels[Math.floor(Math.random() * levels.length)]), i * 100);
    }, [emit]);

    const filtered = filter === 'all' ? logs : logs.filter(l => l.level === filter);
    const levelColor = (l: Level) => l === 'error' ? 'var(--danger)' : l === 'warn' ? 'var(--warning)' : l === 'debug' ? 'var(--text-dim)' : 'var(--accent)';

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">observability</span>
                <h1>Structured Logger</h1>
                <p className="subtitle">JSON log lines with consistent fields — machine-parseable and filterable.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <button onClick={() => emit('info')} className="sim-button">Log INFO</button>
                <button onClick={() => emit('warn')} className="sim-button">Log WARN</button>
                <button onClick={() => emit('error')} className="sim-button">Log ERROR</button>
                <button onClick={simulate} className="sim-button">Simulate ×5</button>
                <select value={filter} onChange={e => setFilter(e.target.value as Level | 'all')} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius)', padding: '4px 8px', fontSize: 11 }}>
                    <option value="all">all</option>
                    <option value="info">info</option>
                    <option value="warn">warn</option>
                    <option value="error">error</option>
                    <option value="debug">debug</option>
                </select>
            </div>

            <div className="info-panel">
                <h3>// logs ({filtered.length})</h3>
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                    {filtered.map((l, i) => (
                        <div key={i} style={{ fontSize: 10, padding: '3px 0', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', color: levelColor(l.level) }}>
                            {JSON.stringify(l)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
