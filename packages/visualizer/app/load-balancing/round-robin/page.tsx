'use client';

import { useState, useCallback } from 'react';

interface Server { id: number; name: string; requests: number; }

export default function RoundRobinPage() {
    const [servers] = useState<Server[]>([
        { id: 0, name: 'Server A', requests: 0 },
        { id: 1, name: 'Server B', requests: 0 },
        { id: 2, name: 'Server C', requests: 0 },
        { id: 3, name: 'Server D', requests: 0 },
    ]);
    const [state, setState] = useState({ servers, currentIndex: 0, total: 0 });
    const [log, setLog] = useState<string[]>([]);
    const [lastTarget, setLastTarget] = useState<number | null>(null);

    const sendRequest = useCallback(() => {
        setState(prev => {
            const target = prev.currentIndex % prev.servers.length;
            const newServers = prev.servers.map((s, i) => i === target ? { ...s, requests: s.requests + 1 } : s);
            setLastTarget(target);
            setLog(l => [...l.slice(-15), `Request #${prev.total + 1} → ${prev.servers[target].name} (index ${target})`]);
            return { servers: newServers, currentIndex: target + 1, total: prev.total + 1 };
        });
    }, []);

    const sendBurst = useCallback(() => {
        for (let i = 0; i < 8; i++) setTimeout(() => sendRequest(), i * 100);
    }, [sendRequest]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">load balancing</span>
                <h1>Round Robin</h1>
                <p className="subtitle">Distribute requests sequentially across servers in circular order.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={sendRequest} className="sim-button">Send Request</button>
                <button onClick={sendBurst} className="sim-button">Send Burst (8)</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                {state.servers.map((s, i) => (
                    <div key={s.id} style={{
                        padding: '12px', textAlign: 'center', borderRadius: 'var(--radius)',
                        background: i === lastTarget ? 'var(--accent-glow)' : 'var(--surface-2)',
                        border: `1px solid ${i === lastTarget ? 'var(--accent)' : 'var(--border)'}`,
                    }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 12 }}>{s.name}</div>
                        <div style={{ fontSize: 20, color: 'var(--accent)', marginTop: 4 }}>{s.requests}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>requests</div>
                    </div>
                ))}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>Total: {state.total} | Next index: {state.currentIndex % state.servers.length}</div>

            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
