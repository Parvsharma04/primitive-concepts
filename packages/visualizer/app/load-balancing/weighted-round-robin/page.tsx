'use client';

import { useState, useCallback, useMemo } from 'react';

interface Server { name: string; weight: number; requests: number; }

export default function WeightedRoundRobinPage() {
    const [servers, setServers] = useState<Server[]>([
        { name: 'Server A', weight: 5, requests: 0 },
        { name: 'Server B', weight: 3, requests: 0 },
        { name: 'Server C', weight: 2, requests: 0 },
    ]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [log, setLog] = useState<string[]>([]);
    const [lastTarget, setLastTarget] = useState<number | null>(null);

    const expanded = useMemo(() => {
        const arr: number[] = [];
        servers.forEach((s, i) => { for (let j = 0; j < s.weight; j++) arr.push(i); });
        return arr;
    }, [servers]);

    const sendRequest = useCallback(() => {
        const target = expanded[currentIndex % expanded.length];
        setServers(prev => prev.map((s, i) => i === target ? { ...s, requests: s.requests + 1 } : s));
        setLastTarget(target);
        setCurrentIndex(prev => prev + 1);
        setLog(prev => [...prev.slice(-15), `Request → ${servers[target].name} (weight ${servers[target].weight})`]);
    }, [currentIndex, expanded, servers]);

    const sendBurst = useCallback(() => {
        for (let i = 0; i < 10; i++) setTimeout(() => sendRequest(), i * 80);
    }, [sendRequest]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">load balancing</span>
                <h1>Weighted Round Robin</h1>
                <p className="subtitle">Servers with higher weight receive proportionally more traffic.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={sendRequest} className="sim-button">Send Request</button>
                <button onClick={sendBurst} className="sim-button">Send Burst (10)</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {servers.map((s, i) => (
                    <div key={i} style={{
                        padding: '12px', textAlign: 'center', borderRadius: 'var(--radius)',
                        background: i === lastTarget ? 'var(--accent-glow)' : 'var(--surface-2)',
                        border: `1px solid ${i === lastTarget ? 'var(--accent)' : 'var(--border)'}`,
                    }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 12 }}>{s.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--info)' }}>weight: {s.weight}</div>
                        <div style={{ fontSize: 20, color: 'var(--accent)', marginTop: 4 }}>{s.requests}</div>
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
