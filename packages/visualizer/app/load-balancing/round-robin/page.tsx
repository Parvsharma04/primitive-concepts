'use client';

import { useState, useCallback, useRef } from 'react';

interface Server { id: number; name: string; requests: number; }

export default function RoundRobinPage() {
    const [servers, setServers] = useState<Server[]>([
        { id: 0, name: 'Server A', requests: 0 },
        { id: 1, name: 'Server B', requests: 0 },
        { id: 2, name: 'Server C', requests: 0 },
        { id: 3, name: 'Server D', requests: 0 },
    ]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [total, setTotal] = useState(0);
    const [lastTarget, setLastTarget] = useState<number | null>(null);
    const [events, setEvents] = useState<{ id: number; msg: string }[]>([]);
    const nextId = useRef(0);

    // Unified request handler using refs for index and total to avoid race conditions and double updates
    const indexRef = useRef(0);
    const totalRef = useRef(0);

    const handleRequest = (customIndex?: number) => {
        // Use either the provided index (for burst) or the current ref (for single)
        const idx = typeof customIndex === 'number' ? customIndex : indexRef.current;
        const target = idx % servers.length;
        setServers(prev => prev.map((s, i) => i === target ? { ...s, requests: s.requests + 1 } : s));
        setLastTarget(target);
        setEvents(prev => [...prev.slice(-20), { id: nextId.current++, msg: `Request #${totalRef.current + 1} → ${servers[target].name} (index ${target})` }]);
        // Update refs and state for UI
        indexRef.current = idx + 1;
        totalRef.current = totalRef.current + 1;
        setCurrentIndex(indexRef.current);
        setTotal(totalRef.current);
    };

    const sendRequest = () => {
        handleRequest();
    };

    const sendBurst = () => {
        let burstIndex = indexRef.current;
        for (let i = 0; i < servers.length * 2; i++) {
            setTimeout(() => {
                handleRequest(burstIndex + i);
            }, i * 100);
        }
        // Pre-increment refs for UI consistency
        indexRef.current += servers.length * 2;
        totalRef.current += servers.length * 2;
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
                <h1>Round Robin</h1>
                <p className="subtitle">Distribute requests sequentially across servers in circular order — simplest fair distribution</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Total Requests</span>
                    <span className="stat-value accent">{total}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Servers</span>
                    <span className="stat-value">{servers.length}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Next Index</span>
                    <span className="stat-value warning">{currentIndex % servers.length}</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <button onClick={sendRequest} className="btn btn-accent">→ Send Request</button>
                    <button onClick={sendBurst} className="btn">Burst ({servers.length * 2})</button>
                    <button onClick={reset} className="btn">Reset</button>
                </div>

                {/* Server visualization with load bars */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${servers.length}, 1fr)`, gap: 12, marginBottom: 20 }}>
                    {servers.map((s, i) => {
                        const isNext = i === currentIndex % servers.length;
                        const isTarget = i === lastTarget;
                        const barHeight = maxReq > 0 ? (s.requests / maxReq) * 100 : 0;

                        return (
                            <div key={s.id} style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                padding: '16px 12px', borderRadius: 'var(--radius)',
                                background: isTarget ? 'var(--accent-glow)' : 'var(--surface-2)',
                                border: `1.5px solid ${isTarget ? 'var(--accent)' : isNext ? 'var(--warning)' : 'var(--border)'}`,
                                transition: 'all var(--transition)',
                            }}>
                                {/* Next indicator */}
                                {isNext && !isTarget && (
                                    <span style={{ fontSize: 9, color: 'var(--warning)', fontWeight: 600 }}>← NEXT</span>
                                )}
                                {isTarget && (
                                    <span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 600 }}>✓ ROUTED</span>
                                )}

                                {/* Server icon */}
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: isTarget ? 'var(--accent)' : 'var(--surface)',
                                    border: `2px solid ${isTarget ? 'var(--accent)' : 'var(--border-bright)'}`,
                                    color: isTarget ? 'var(--bg)' : 'var(--text-bright)', fontSize: 12, fontWeight: 600,
                                }}>
                                    {String.fromCharCode(65 + i)}
                                </div>

                                <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 11 }}>{s.name}</div>

                                {/* Load bar */}
                                <div style={{ width: '100%', height: 60, background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        height: `${barHeight}%`,
                                        background: 'var(--accent)', opacity: 0.4,
                                        transition: 'height 300ms ease',
                                    }} />
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: 'var(--text-bright)' }}>
                                        {s.requests}
                                    </div>
                                </div>
                                <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>requests</span>
                            </div>
                        );
                    })}
                </div>

                {/* Circular pointer visualization */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 12 }}>
                    {servers.map((s, i) => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{
                                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 9, fontWeight: 600,
                                background: i === currentIndex % servers.length ? 'var(--accent)' : i === lastTarget ? 'var(--accent-dim)' : 'var(--surface-2)',
                                color: i === currentIndex % servers.length || i === lastTarget ? 'var(--bg)' : 'var(--text-dim)',
                                border: `1px solid ${i === currentIndex % servers.length ? 'var(--accent)' : 'var(--border)'}`,
                            }}>
                                {i}
                            </div>
                            {i < servers.length - 1 && <span style={{ color: 'var(--border-bright)', fontSize: 12 }}>→</span>}
                        </div>
                    ))}
                    <span style={{ color: 'var(--border-bright)', fontSize: 12 }}>↩</span>
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
                        <li>Maintain a pointer to current server index</li>
                        <li>Each request goes to servers[index % N]</li>
                        <li>Increment index after each request</li>
                        <li>Perfectly even distribution over time</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// trade-offs</h3>
                    <ul>
                        <li>Dead simple — O(1) per request</li>
                        <li>Perfectly fair for uniform workloads</li>
                        <li className="con">Ignores server capacity differences</li>
                        <li className="con">Ignores current server load</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
