'use client';

import { useState, useCallback, useMemo, useRef } from 'react';

interface Server { name: string; weight: number; requests: number; }

export default function WeightedRoundRobinPage() {
    const [servers, setServers] = useState<Server[]>([
        { name: 'Server A', weight: 5, requests: 0 },
        { name: 'Server B', weight: 3, requests: 0 },
        { name: 'Server C', weight: 2, requests: 0 },
    ]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [total, setTotal] = useState(0);
    const [lastTarget, setLastTarget] = useState<number | null>(null);
    const [events, setEvents] = useState<{ id: number; msg: string }[]>([]);
    const nextId = useRef(0);

    const expanded = useMemo(() => {
        const arr: number[] = [];
        servers.forEach((s, i) => { for (let j = 0; j < s.weight; j++) arr.push(i); });
        return arr;
    }, [servers]);

    const totalWeight = servers.reduce((sum, s) => sum + s.weight, 0);

    const sendRequest = useCallback(() => {
        const target = expanded[currentIndex % expanded.length];
        setServers(prev => prev.map((s, i) => i === target ? { ...s, requests: s.requests + 1 } : s));
        setLastTarget(target);
        setCurrentIndex(prev => prev + 1);
        setTotal(prev => prev + 1);
        setEvents(prev => [...prev.slice(-20), { id: nextId.current++, msg: `Request #${total + 1} → ${servers[target].name} (weight ${servers[target].weight})` }]);
    }, [currentIndex, expanded, servers, total]);

    const sendBurst = useCallback(() => {
        for (let i = 0; i < totalWeight; i++) setTimeout(() => sendRequest(), i * 80);
    }, [sendRequest, totalWeight]);

    const adjustWeight = (idx: number, delta: number) => {
        setServers(prev => prev.map((s, i) => i === idx ? { ...s, weight: Math.max(1, Math.min(8, s.weight + delta)) } : s));
    };

    const reset = () => {
        setServers(prev => prev.map(s => ({ ...s, requests: 0 })));
        setCurrentIndex(0);
        setTotal(0);
        setLastTarget(null);
        setEvents([]);
    };

    const maxReq = Math.max(...servers.map(s => s.requests), 1);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">load balancing</span>
                <h1>Weighted Round Robin</h1>
                <p className="subtitle">Servers with higher weight receive proportionally more traffic</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Total Requests</span>
                    <span className="stat-value accent">{total}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Total Weight</span>
                    <span className="stat-value warning">{totalWeight}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Cycle Position</span>
                    <span className="stat-value">{currentIndex % expanded.length}/{expanded.length}</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <button onClick={sendRequest} className="btn btn-accent">→ Send Request</button>
                    <button onClick={sendBurst} className="btn">Full Cycle ({totalWeight})</button>
                    <button onClick={reset} className="btn">Reset</button>
                </div>

                {/* Server cards with weight controls */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${servers.length}, 1fr)`, gap: 12, marginBottom: 20 }}>
                    {servers.map((s, i) => {
                        const isTarget = i === lastTarget;
                        const barHeight = maxReq > 0 ? (s.requests / maxReq) * 80 : 0;
                        const expectedPct = ((s.weight / totalWeight) * 100).toFixed(0);

                        return (
                            <div key={i} style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                padding: '16px 12px', borderRadius: 'var(--radius)',
                                background: isTarget ? 'var(--accent-glow)' : 'var(--surface-2)',
                                border: `1.5px solid ${isTarget ? 'var(--accent)' : 'var(--border)'}`,
                                transition: 'all var(--transition)',
                            }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 12 }}>{s.name}</div>

                                {/* Weight control */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <button onClick={() => adjustWeight(i, -1)} className="btn" style={{ padding: '2px 6px', fontSize: 10 }}>−</button>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--info)', minWidth: 20, textAlign: 'center' }}>{s.weight}</span>
                                    <button onClick={() => adjustWeight(i, 1)} className="btn" style={{ padding: '2px 6px', fontSize: 10 }}>+</button>
                                </div>
                                <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>weight ({expectedPct}% share)</span>

                                {/* Load bar */}
                                <div style={{ width: '100%', height: 60, background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        height: `${barHeight}%`,
                                        background: 'var(--info)', opacity: 0.4,
                                        transition: 'height 300ms ease',
                                    }} />
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: 'var(--text-bright)' }}>
                                        {s.requests}
                                    </div>
                                </div>

                                {/* Actual vs expected */}
                                {total > 0 && (
                                    <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>
                                        actual: {((s.requests / total) * 100).toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Expanded schedule visualization */}
                <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>// schedule (expanded weights)</div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {expanded.map((serverIdx, i) => (
                            <div key={i} style={{
                                width: 22, height: 22, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 9, fontWeight: 600,
                                background: i === currentIndex % expanded.length ? 'var(--accent)' : i < currentIndex % expanded.length ? 'var(--accent-dim)' : 'var(--surface-2)',
                                color: i === currentIndex % expanded.length ? 'var(--bg)' : 'var(--text-dim)',
                                border: `1px solid ${i === currentIndex % expanded.length ? 'var(--accent)' : 'var(--border)'}`,
                                opacity: i < currentIndex % expanded.length ? 0.4 : 1,
                            }}>
                                {String.fromCharCode(65 + serverIdx)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// event log</h3>
                    <div className="log-area">
                        {events.length === 0 && <div className="log-entry">No events yet.</div>}
                        {events.slice(-12).reverse().map(e => (
                            <div key={e.id} className="log-entry allowed">{e.msg}</div>
                        ))}
                    </div>
                </div>
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>Each server assigned a weight (capacity)</li>
                        <li>Expand into schedule: A×5, B×3, C×2 = 10 slots</li>
                        <li>Cycle through expanded schedule sequentially</li>
                        <li>Higher weight = more slots = more requests</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// trade-offs</h3>
                    <ul>
                        <li>Respects heterogeneous server capacity</li>
                        <li>Predictable distribution over full cycle</li>
                        <li className="con">Doesn&apos;t adapt to real-time load</li>
                        <li className="con">Requires manual weight configuration</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
