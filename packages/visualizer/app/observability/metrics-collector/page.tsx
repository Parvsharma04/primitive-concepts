'use client';

import { useState, useCallback } from 'react';

interface Metric { name: string; type: 'counter' | 'gauge'; value: number; }

export default function MetricsCollectorPage() {
    const [metrics, setMetrics] = useState<Metric[]>([
        { name: 'http_requests_total', type: 'counter', value: 0 },
        { name: 'http_errors_total', type: 'counter', value: 0 },
        { name: 'active_connections', type: 'gauge', value: 5 },
        { name: 'cpu_usage_percent', type: 'gauge', value: 42 },
    ]);
    const [log, setLog] = useState<string[]>([]);

    const increment = useCallback((name: string, amount = 1) => {
        setMetrics(prev => prev.map(m => m.name === name ? { ...m, value: m.value + amount } : m));
        setLog(prev => [...prev.slice(-15), `${name} += ${amount}`]);
    }, []);

    const setGauge = useCallback((name: string, value: number) => {
        setMetrics(prev => prev.map(m => m.name === name ? { ...m, value } : m));
        setLog(prev => [...prev.slice(-15), `${name} = ${value}`]);
    }, []);

    const simulateTraffic = useCallback(() => {
        increment('http_requests_total', Math.floor(Math.random() * 10) + 1);
        if (Math.random() < 0.3) increment('http_errors_total');
        setGauge('active_connections', Math.floor(Math.random() * 20));
        setGauge('cpu_usage_percent', Math.floor(Math.random() * 100));
    }, [increment, setGauge]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">observability</span>
                <h1>Metrics Collector</h1>
                <p className="subtitle">Counters only go up. Gauges can go up or down. Both expose system health.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={simulateTraffic} className="sim-button">Simulate Traffic</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
                {metrics.map(m => (
                    <div key={m.name} style={{ padding: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{m.type}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-bright)', fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: 20, color: m.type === 'counter' ? 'var(--accent)' : 'var(--info)', marginTop: 4 }}>{m.value}</div>
                    </div>
                ))}
            </div>

            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 150, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
