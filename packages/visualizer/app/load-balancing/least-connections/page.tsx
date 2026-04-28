'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface Server { name: string; active: number; total: number; processing: number[]; }

export default function LeastConnectionsPage() {
    const [servers, setServers] = useState<Server[]>([
        { name: 'Server A', active: 0, total: 0, processing: [] },
        { name: 'Server B', active: 0, total: 0, processing: [] },
        { name: 'Server C', active: 0, total: 0, processing: [] },
        { name: 'Server D', active: 0, total: 0, processing: [] },
    ]);
    const [total, setTotal] = useState(0);
    const [lastTarget, setLastTarget] = useState<number | null>(null);
    const [events, setEvents] = useState<{ id: number; msg: string; type: 'route' | 'complete' }[]>([]);
    const nextId = useRef(0);
    const reqId = useRef(0);
    const timeouts = useRef<NodeJS.Timeout[]>([]);

    useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

    const sendRequest = useCallback(() => {
        setServers(prev => {
            const minActive = Math.min(...prev.map(s => s.active));
            const target = prev.findIndex(s => s.active === minActive);
            setLastTarget(target);
            setTotal(t => t + 1);
            const rId = reqId.current++;
            const duration = 1500 + Math.random() * 3500;

            setEvents(evts => [...evts.slice(-20), { id: nextId.current++, msg: `Req #${rId} → ${prev[target].name} (active: ${prev[target].active}, duration: ${(duration / 1000).toFixed(1)}s)`, type: 'route' }]);

            const t = setTimeout(() => {
                setServers(p => p.map((s, i) => i === target ? { ...s, active: Math.max(0, s.active - 1), processing: s.processing.filter(id => id !== rId) } : s));
                setEvents(evts => [...evts.slice(-20), { id: nextId.current++, msg: `Req #${rId} completed on ${prev[target].name}`, type: 'complete' }]);
            }, duration);
            timeouts.current.push(t);

            return prev.map((s, i) => i === target ? { ...s, active: s.active + 1, total: s.total + 1, processing: [...s.processing, rId] } : s);
        });
    }, []);

    const sendBurst = useCallback(() => {
        for (let i = 0; i < 10; i++) setTimeout(() => sendRequest(), i * 120);
    }, [sendRequest]);

    const reset = () => {
        timeouts.current.forEach(clearTimeout);
        timeouts.current = [];
        setServers(prev => prev.map(s => ({ ...s, active: 0, total: 0, processing: [] })));
        setTotal(0);
        setLastTarget(null);
        setEvents([]);
    };

    const maxActive = Math.max(...servers.map(s => s.active), 1);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">load balancing</span>
                <h1>Least Connections</h1>
                <p className="subtitle">Route each request to the server with the fewest active connections — adapts to variable processing times</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Total Sent</span>
                    <span className="stat-value accent">{total}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Active Total</span>
                    <span className="stat-value warning">{servers.reduce((s, sv) => s + sv.active, 0)}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Min Active</span>
                    <span className="stat-value accent">{Math.min(...servers.map(s => s.active))}</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <button onClick={sendRequest} className="btn btn-accent">→ Send Request</button>
                    <button onClick={sendBurst} className="btn">Burst (10)</button>
                    <button onClick={reset} className="btn">Reset</button>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>Requests auto-complete after 1.5–5s</span>
                </div>

                {/* Server cards with active connection bars */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${servers.length}, 1fr)`, gap: 12, marginBottom: 16 }}>
                    {servers.map((s, i) => {
                        const isTarget = i === lastTarget;
                        const isMin = s.active === Math.min(...servers.map(sv => sv.active));
                        const barHeight = maxActive > 0 ? (s.active / maxActive) * 100 : 0;

                        return (
                            <div key={i} style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                padding: '14px 10px', borderRadius: 'var(--radius)',
                                background: isTarget ? 'var(--accent-glow)' : 'var(--surface-2)',
                                border: `1.5px solid ${isTarget ? 'var(--accent)' : isMin ? 'var(--info)' : 'var(--border)'}`,
                                transition: 'all var(--transition)',
                            }}>
                                {isMin && <span style={{ fontSize: 8, color: 'var(--info)', fontWeight: 600, textTransform: 'uppercase' }}>lowest</span>}
                                <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 11 }}>{s.name}</div>

                                {/* Active connections gauge */}
                                <div style={{ width: '100%', height: 70, background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        height: `${barHeight}%`,
                                        background: s.active > maxActive * 0.7 ? 'var(--warning)' : 'var(--info)',
                                        opacity: 0.5, transition: 'height 300ms ease',
                                    }} />
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-bright)' }}>{s.active}</span>
                                        <span style={{ fontSize: 8, color: 'var(--text-dim)' }}>active</span>
                                    </div>
                                </div>

                                {/* Connection dots */}
                                <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', minHeight: 12 }}>
                                    {s.processing.slice(-8).map(id => (
                                        <div key={id} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--info)', animation: 'pulse 1s ease-in-out infinite' }} />
                                    ))}
                                </div>

                                <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>total: {s.total}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// event log</h3>
                    <div className="log-area">
                        {events.length === 0 && <div className="log-entry">No events yet.</div>}
                        {events.slice(-12).reverse().map(e => (
                            <div key={e.id} className={`log-entry ${e.type === 'route' ? 'allowed' : ''}`}>
                                {e.msg}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>Track active connections per server</li>
                        <li>New request → find server with min(active)</li>
                        <li>Adapts to varying request durations</li>
                        <li>Slow requests don&apos;t starve fast servers</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// trade-offs</h3>
                    <ul>
                        <li>Best for variable-duration workloads</li>
                        <li>Self-balancing under heterogeneous load</li>
                        <li className="con">Requires connection counting overhead</li>
                        <li className="con">Ties broken arbitrarily (first match)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
