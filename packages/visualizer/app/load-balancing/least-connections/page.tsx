'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface Server { name: string; active: number; total: number; }

export default function LeastConnectionsPage() {
    const [servers, setServers] = useState<Server[]>([
        { name: 'Server A', active: 0, total: 0 },
        { name: 'Server B', active: 0, total: 0 },
        { name: 'Server C', active: 0, total: 0 },
        { name: 'Server D', active: 0, total: 0 },
    ]);
    const [log, setLog] = useState<string[]>([]);
    const [lastTarget, setLastTarget] = useState<number | null>(null);
    const timeouts = useRef<NodeJS.Timeout[]>([]);

    useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

    const sendRequest = useCallback(() => {
        setServers(prev => {
            const minActive = Math.min(...prev.map(s => s.active));
            const target = prev.findIndex(s => s.active === minActive);
            setLastTarget(target);
            setLog(l => [...l.slice(-15), `Request → ${prev[target].name} (active: ${prev[target].active})`]);
            const duration = 1000 + Math.random() * 3000;
            const t = setTimeout(() => {
                setServers(p => p.map((s, i) => i === target ? { ...s, active: Math.max(0, s.active - 1) } : s));
            }, duration);
            timeouts.current.push(t);
            return prev.map((s, i) => i === target ? { ...s, active: s.active + 1, total: s.total + 1 } : s);
        });
    }, []);

    const sendBurst = useCallback(() => {
        for (let i = 0; i < 8; i++) setTimeout(() => sendRequest(), i * 150);
    }, [sendRequest]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">load balancing</span>
                <h1>Least Connections</h1>
                <p className="subtitle">Route to the server with the fewest active connections. Adapts to varying request durations.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={sendRequest} className="sim-button">Send Request</button>
                <button onClick={sendBurst} className="sim-button">Send Burst (8)</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                {servers.map((s, i) => (
                    <div key={i} style={{
                        padding: '12px', textAlign: 'center', borderRadius: 'var(--radius)',
                        background: i === lastTarget ? 'var(--accent-glow)' : 'var(--surface-2)',
                        border: `1px solid ${i === lastTarget ? 'var(--accent)' : 'var(--border)'}`,
                    }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 12 }}>{s.name}</div>
                        <div style={{ fontSize: 14, color: 'var(--info)', marginTop: 4 }}>active: {s.active}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>total: {s.total}</div>
                    </div>
                ))}
            </div>

            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
