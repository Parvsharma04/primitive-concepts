'use client';

import { useState, useCallback, useRef } from 'react';

interface Request { id: number; status: 'waiting' | 'fetching' | 'served'; servedFrom: string; }

export default function CacheStampedePage() {
    const [cache, setCache] = useState<{ value: string; expiresAt: number } | null>(null);
    const [lock, setLock] = useState(false);
    const [requests, setRequests] = useState<Request[]>([]);
    const [events, setEvents] = useState<{ id: number; msg: string; type: 'info' | 'warn' | 'ok' }[]>([]);
    const [protection, setProtection] = useState(true);
    const [dbHits, setDbHits] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const nextId = useRef(0);
    const nextReq = useRef(0);

    const addEvent = useCallback((msg: string, type: 'info' | 'warn' | 'ok') => {
        setEvents(prev => [...prev.slice(-20), { id: nextId.current++, msg, type }]);
    }, []);

    const simulateStampede = useCallback(() => {
        if (isRunning) return;
        setIsRunning(true);
        setCache(null);
        setLock(false);
        setDbHits(0);
        const count = 8;
        const reqs: Request[] = Array.from({ length: count }, () => ({
            id: nextReq.current++, status: 'waiting' as const, servedFrom: ''
        }));
        setRequests(reqs);
        addEvent(`⚡ Cache expired! ${count} concurrent requests incoming...`, 'warn');

        if (protection) {
            const fetcherId = reqs[0].id;
            setLock(true);
            addEvent(`🔒 Lock acquired by req #${fetcherId} — others queue up`, 'info');
            setRequests(prev => prev.map(r => r.id === fetcherId ? { ...r, status: 'fetching' } : r));

            setTimeout(() => {
                const newValue = `data_${Date.now().toString(36)}`;
                setCache({ value: newValue, expiresAt: Date.now() + 10000 });
                setLock(false);
                setDbHits(1);
                setRequests(prev => prev.map(r => ({
                    ...r, status: 'served',
                    servedFrom: r.id === fetcherId ? 'DB (leader)' : 'cache (waited)'
                })));
                addEvent(`✓ Req #${fetcherId} fetched from DB → cache populated`, 'ok');
                addEvent(`✓ All ${count - 1} waiting requests served from fresh cache`, 'ok');
                setIsRunning(false);
            }, 1500);
        } else {
            addEvent(`⚠ No protection! All ${count} requests hit DB simultaneously!`, 'warn');
            setRequests(prev => prev.map(r => ({ ...r, status: 'fetching' })));

            setTimeout(() => {
                const newValue = `data_${Date.now().toString(36)}`;
                setCache({ value: newValue, expiresAt: Date.now() + 10000 });
                setDbHits(count);
                setRequests(prev => prev.map(r => ({ ...r, status: 'served', servedFrom: 'DB (redundant!)' })));
                addEvent(`⚠ All ${count} requests independently fetched from DB — ${count}x wasted load!`, 'warn');
                setIsRunning(false);
            }, 1500);
        }
    }, [protection, isRunning, addEvent]);

    const reset = () => {
        setCache(null);
        setLock(false);
        setRequests([]);
        setEvents([]);
        setDbHits(0);
        setIsRunning(false);
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">caching</span>
                <h1>Cache Stampede Protection</h1>
                <p className="subtitle">Prevent thundering herd when a popular cache key expires and many requests arrive simultaneously</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Protection</span>
                    <span className={`stat-value ${protection ? 'accent' : 'danger'}`}>
                        {protection ? 'ON' : 'OFF'}
                    </span>
                </div>
                <div className="stat">
                    <span className="stat-label">DB Hits</span>
                    <span className={`stat-value ${dbHits > 1 ? 'danger' : dbHits === 1 ? 'accent' : ''}`}>{dbHits}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Lock</span>
                    <span className="stat-value warning">{lock ? '🔒 Held' : '🔓 Free'}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Cache</span>
                    <span className={`stat-value ${cache ? 'accent' : 'danger'}`}>{cache ? 'WARM' : 'COLD'}</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <button onClick={() => setProtection(true)} className={`btn ${protection ? 'btn-accent' : ''}`}>With Lock</button>
                    <button onClick={() => setProtection(false)} className={`btn ${!protection ? 'btn-danger' : ''}`}>No Protection</button>
                    <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                    <button onClick={simulateStampede} className="btn btn-accent" disabled={isRunning}>
                        ⚡ Simulate Stampede
                    </button>
                    <button onClick={reset} className="btn">Reset</button>
                </div>

                {/* Request visualization */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>
                        // concurrent requests
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                        {requests.map(r => (
                            <div key={r.id} style={{
                                padding: '10px 12px', borderRadius: 'var(--radius)',
                                background: r.status === 'served' ? 'var(--accent-glow)' : r.status === 'fetching' ? 'var(--warning-glow)' : 'var(--surface-2)',
                                border: `1px solid ${r.status === 'served' ? 'var(--accent)' : r.status === 'fetching' ? 'var(--warning)' : 'var(--border)'}`,
                                transition: 'all 300ms ease',
                            }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-bright)' }}>
                                    Req #{r.id}
                                </div>
                                <div style={{ fontSize: 10, color: r.status === 'served' ? 'var(--accent)' : r.status === 'fetching' ? 'var(--warning)' : 'var(--text-dim)', marginTop: 2 }}>
                                    {r.status === 'waiting' ? '⏳ queued' : r.status === 'fetching' ? '⟳ fetching DB...' : `✓ ${r.servedFrom}`}
                                </div>
                            </div>
                        ))}
                    </div>
                    {requests.length === 0 && (
                        <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>Click &quot;Simulate Stampede&quot; to see the effect</span>
                    )}
                </div>

                {/* Comparison diagram */}
                {dbHits > 0 && (
                    <div style={{
                        padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 12,
                        background: dbHits === 1 ? 'var(--accent-glow)' : 'var(--danger-glow)',
                        border: `1px solid ${dbHits === 1 ? 'var(--accent)' : 'var(--danger)'}`,
                    }}>
                        <span style={{ fontSize: 12, color: dbHits === 1 ? 'var(--accent)' : 'var(--danger)', fontWeight: 600 }}>
                            {dbHits === 1
                                ? `✓ Only 1 DB query — lock prevented ${requests.length - 1} redundant fetches`
                                : `⚠ ${dbHits} DB queries — ${dbHits - 1} were completely redundant!`
                            }
                        </span>
                    </div>
                )}
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// event log</h3>
                    <div className="log-area">
                        {events.length === 0 && <div className="log-entry">No events yet.</div>}
                        {events.slice(-12).reverse().map(e => (
                            <div key={e.id} className={`log-entry ${e.type === 'ok' ? 'allowed' : e.type === 'warn' ? 'rejected' : ''}`}>
                                {e.msg}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>Popular key expires → many requests arrive at once</li>
                        <li>Without protection: all hit DB (thundering herd)</li>
                        <li>With locking: first request fetches, others wait</li>
                        <li>Once cache is repopulated, all get served from cache</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// strategies</h3>
                    <ul>
                        <li>Mutex/Lock — only one fetcher at a time</li>
                        <li>Probabilistic early recomputation (jitter)</li>
                        <li>Background refresh before expiry</li>
                        <li className="con">Lock adds latency for waiting requests</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
