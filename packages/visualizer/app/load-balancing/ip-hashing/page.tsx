'use client';

import { useState, useCallback, useRef } from 'react';

const SERVERS = ['Server A', 'Server B', 'Server C', 'Server D'];

function hashIP(ip: string): number {
    let h = 0;
    for (let i = 0; i < ip.length; i++) h = (h * 31 + ip.charCodeAt(i)) >>> 0;
    return h % SERVERS.length;
}

export default function IPHashingPage() {
    const [counts, setCounts] = useState<number[]>(new Array(SERVERS.length).fill(0));
    const [inputIP, setInputIP] = useState('');
    const [lastTarget, setLastTarget] = useState<number | null>(null);
    const [lastIP, setLastIP] = useState('');
    const [events, setEvents] = useState<{ id: number; msg: string; ip: string; server: number }[]>([]);
    const [stickyDemo, setStickyDemo] = useState<Record<string, number>>({});
    const nextId = useRef(0);

    const send = useCallback((overrideIP?: string) => {
        const ip = overrideIP || inputIP.trim() || `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        const idx = hashIP(ip);
        setCounts(prev => prev.map((c, i) => i === idx ? c + 1 : c));
        setLastTarget(idx);
        setLastIP(ip);
        setStickyDemo(prev => ({ ...prev, [ip]: idx }));
        setEvents(prev => [...prev.slice(-20), { id: nextId.current++, msg: `${ip} → hash(${hashIP(ip)}) → ${SERVERS[idx]}`, ip, server: idx }]);
        if (!overrideIP) setInputIP('');
    }, [inputIP]);

    const sendBurst = useCallback(() => {
        const ips = Array.from({ length: 8 }, () => `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`);
        ips.forEach((ip, i) => setTimeout(() => send(ip), i * 100));
    }, [send]);

    const demonstrateStickiness = useCallback(() => {
        // Send same IPs multiple times to show they always go to same server
        const testIPs = ['192.168.1.100', '10.0.0.50', '172.16.5.25'];
        testIPs.forEach((ip, round) => {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => send(ip), (round * 3 + i) * 150);
            }
        });
    }, [send]);

    const reset = () => {
        setCounts(new Array(SERVERS.length).fill(0));
        setLastTarget(null);
        setLastIP('');
        setEvents([]);
        setStickyDemo({});
    };

    const maxCount = Math.max(...counts, 1);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">load balancing</span>
                <h1>IP Hashing</h1>
                <p className="subtitle">Hash client IP to deterministically route to the same server — session affinity without shared state</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Total Requests</span>
                    <span className="stat-value accent">{counts.reduce((a, b) => a + b, 0)}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Unique IPs</span>
                    <span className="stat-value warning">{Object.keys(stickyDemo).length}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Last Hash</span>
                    <span className="stat-value">{lastIP ? hashIP(lastIP) : '—'}</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <input value={inputIP} onChange={e => setInputIP(e.target.value)} placeholder="IP address (or random)" className="sim-input" onKeyDown={e => e.key === 'Enter' && send()} />
                    <button onClick={() => send()} className="btn btn-accent">Send</button>
                    <button onClick={sendBurst} className="btn">Random Burst (8)</button>
                    <button onClick={demonstrateStickiness} className="btn">Demo Stickiness</button>
                    <button onClick={reset} className="btn">Reset</button>
                </div>

                {/* Hash mapping visualization */}
                {lastIP && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px 0', marginBottom: 16, background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-bright)', fontFamily: 'var(--font-mono)' }}>{lastIP}</span>
                        <span style={{ color: 'var(--text-dim)' }}>→</span>
                        <span style={{ fontSize: 11, color: 'var(--warning)' }}>hash()</span>
                        <span style={{ color: 'var(--text-dim)' }}>→</span>
                        <span style={{ fontSize: 12, color: 'var(--info)' }}>{lastTarget !== null ? hashIP(lastIP) : ''}</span>
                        <span style={{ color: 'var(--text-dim)' }}>→</span>
                        <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{lastTarget !== null ? SERVERS[lastTarget] : ''}</span>
                    </div>
                )}

                {/* Server distribution */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SERVERS.length}, 1fr)`, gap: 12, marginBottom: 16 }}>
                    {SERVERS.map((s, i) => {
                        const isTarget = i === lastTarget;
                        const barHeight = maxCount > 0 ? (counts[i] / maxCount) * 80 : 0;

                        return (
                            <div key={i} style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                padding: '14px 10px', borderRadius: 'var(--radius)',
                                background: isTarget ? 'var(--accent-glow)' : 'var(--surface-2)',
                                border: `1.5px solid ${isTarget ? 'var(--accent)' : 'var(--border)'}`,
                                transition: 'all var(--transition)',
                            }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 11 }}>{s}</div>
                                <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>hash % {SERVERS.length} = {i}</div>

                                <div style={{ width: '100%', height: 60, background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        height: `${barHeight}%`, background: 'var(--accent)', opacity: 0.4,
                                        transition: 'height 300ms ease',
                                    }} />
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: 'var(--text-bright)' }}>
                                        {counts[i]}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Sticky sessions demo */}
                {Object.keys(stickyDemo).length > 0 && (
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>// session affinity — same IP always maps to same server</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {Object.entries(stickyDemo).slice(-8).map(([ip, serverIdx]) => (
                                <span key={ip} style={{ fontSize: 10, padding: '3px 8px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                                    {ip} → <span style={{ color: 'var(--accent)' }}>{SERVERS[serverIdx]}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
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
                        <li>hash(clientIP) % numServers = target index</li>
                        <li>Same IP always maps to same server</li>
                        <li>Provides session affinity without cookies/state</li>
                        <li>Try &quot;Demo Stickiness&quot; to see same IPs repeat</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// trade-offs</h3>
                    <ul>
                        <li>Simple session persistence mechanism</li>
                        <li>No shared state needed between LBs</li>
                        <li className="con">Uneven distribution if IPs are clustered</li>
                        <li className="con">Adding/removing servers reshuffles all mappings</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
