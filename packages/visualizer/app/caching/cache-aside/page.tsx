'use client';

import { useState, useCallback, useRef } from 'react';

type Step = 'idle' | 'check-cache' | 'cache-hit' | 'cache-miss' | 'fetch-db' | 'populate-cache' | 'done';

interface LogEntry { id: number; msg: string; type: 'hit' | 'miss' | 'write' | 'info'; }

export default function CacheAsidePage() {
    const [db] = useState<Record<string, string>>({
        user_1: 'Alice', user_2: 'Bob', user_3: 'Carol', user_4: 'Dave', user_5: 'Eve'
    });
    const [cache, setCache] = useState<Record<string, string>>({});
    const [events, setEvents] = useState<LogEntry[]>([]);
    const [queryKey, setQueryKey] = useState('');
    const [step, setStep] = useState<Step>('idle');
    const [activeKey, setActiveKey] = useState('');
    const [stats, setStats] = useState({ hits: 0, misses: 0 });
    const nextId = useRef(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const addEvent = useCallback((msg: string, type: LogEntry['type']) => {
        setEvents(prev => [...prev.slice(-20), { id: nextId.current++, msg, type }]);
    }, []);

    const read = useCallback(() => {
        const key = queryKey.trim();
        if (!key || step !== 'idle') return;
        setActiveKey(key);
        setQueryKey('');

        // Step 1: Check cache
        setStep('check-cache');
        addEvent(`→ Check cache for "${key}"`, 'info');

        timerRef.current = setTimeout(() => {
            if (cache[key]) {
                // Cache hit
                setStep('cache-hit');
                setStats(s => ({ ...s, hits: s.hits + 1 }));
                addEvent(`✓ CACHE HIT: "${key}" = "${cache[key]}"`, 'hit');
                setTimeout(() => setStep('idle'), 1000);
            } else {
                // Cache miss
                setStep('cache-miss');
                addEvent(`✗ CACHE MISS for "${key}"`, 'miss');

                setTimeout(() => {
                    setStep('fetch-db');
                    addEvent(`→ Fetching "${key}" from database...`, 'info');

                    setTimeout(() => {
                        if (db[key]) {
                            setStep('populate-cache');
                            setCache(prev => ({ ...prev, [key]: db[key] }));
                            setStats(s => ({ ...s, misses: s.misses + 1 }));
                            addEvent(`← DB returned "${db[key]}" → populating cache`, 'write');
                            setTimeout(() => {
                                setStep('idle');
                                addEvent(`✓ Cache populated. Next GET "${key}" will hit.`, 'info');
                            }, 600);
                        } else {
                            setStats(s => ({ ...s, misses: s.misses + 1 }));
                            addEvent(`✗ "${key}" NOT FOUND in database`, 'miss');
                            setStep('idle');
                        }
                    }, 800);
                }, 500);
            }
        }, 500);
    }, [queryKey, step, cache, db, addEvent]);

    const invalidate = useCallback((key: string) => {
        setCache(prev => { const n = { ...prev }; delete n[key]; return n; });
        addEvent(`INVALIDATE "${key}" → removed from cache`, 'info');
    }, [addEvent]);

    const reset = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setCache({});
        setEvents([]);
        setStep('idle');
        setStats({ hits: 0, misses: 0 });
    };

    const hitRate = stats.hits + stats.misses > 0
        ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(0)
        : '—';

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">caching</span>
                <h1>Cache Aside (Lazy Loading)</h1>
                <p className="subtitle">Application checks cache first, loads from DB on miss, then populates cache</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Cache Hits</span>
                    <span className="stat-value accent">{stats.hits}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Cache Misses</span>
                    <span className="stat-value danger">{stats.misses}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Hit Rate</span>
                    <span className="stat-value warning">{hitRate}%</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Cache Size</span>
                    <span className="stat-value">{Object.keys(cache).length}</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <input value={queryKey} onChange={e => setQueryKey(e.target.value)} placeholder="key (e.g. user_1)" className="sim-input" onKeyDown={e => e.key === 'Enter' && read()} />
                    <button onClick={read} className="btn btn-accent" disabled={step !== 'idle'}>GET</button>
                    <button onClick={reset} className="btn">Reset</button>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>
                        Try: user_1, user_2, user_3, user_4, user_5
                    </span>
                </div>

                {/* Flow diagram */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '24px 0' }}>
                    {/* App */}
                    <div style={{
                        padding: '16px 20px', borderRadius: 'var(--radius)',
                        border: `2px solid ${step !== 'idle' ? 'var(--accent)' : 'var(--border-bright)'}`,
                        background: step !== 'idle' ? 'var(--accent-glow)' : 'var(--surface-2)',
                        textAlign: 'center', minWidth: 90,
                    }}>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>App</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-bright)', marginTop: 4 }}>
                            {activeKey ? `GET "${activeKey}"` : 'idle'}
                        </div>
                    </div>

                    {/* Arrow 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{
                            color: step === 'check-cache' || step === 'cache-hit' || step === 'populate-cache' ? 'var(--accent)' : 'var(--border-bright)',
                            fontSize: 20,
                        }}>→</span>
                        <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>
                            {step === 'check-cache' ? 'checking...' : step === 'populate-cache' ? 'write' : '1. check'}
                        </span>
                    </div>

                    {/* Cache */}
                    <div style={{
                        padding: '16px 20px', borderRadius: 'var(--radius)', minWidth: 120,
                        border: `2px solid ${step === 'cache-hit' ? 'var(--accent)' : step === 'cache-miss' ? 'var(--danger)' : step === 'populate-cache' ? 'var(--warning)' : 'var(--border-bright)'}`,
                        background: step === 'cache-hit' ? 'var(--accent-glow)' : step === 'cache-miss' ? 'var(--danger-glow)' : step === 'populate-cache' ? 'var(--warning-glow)' : 'var(--surface-2)',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cache</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-bright)', marginTop: 4 }}>
                            {step === 'cache-hit' ? '✓ HIT' : step === 'cache-miss' ? '✗ MISS' : step === 'populate-cache' ? '← write' : `${Object.keys(cache).length} keys`}
                        </div>
                    </div>

                    {/* Arrow 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{
                            color: step === 'fetch-db' ? 'var(--warning)' : 'var(--border-bright)',
                            fontSize: 20,
                        }}>→</span>
                        <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>
                            {step === 'fetch-db' ? 'fetching...' : '2. on miss'}
                        </span>
                    </div>

                    {/* Database */}
                    <div style={{
                        padding: '16px 20px', borderRadius: 'var(--radius)', minWidth: 100,
                        border: `2px solid ${step === 'fetch-db' ? 'var(--warning)' : 'var(--border-bright)'}`,
                        background: step === 'fetch-db' ? 'var(--warning-glow)' : 'var(--surface-2)',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Database</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-bright)', marginTop: 4 }}>
                            {step === 'fetch-db' ? 'querying...' : `${Object.keys(db).length} rows`}
                        </div>
                    </div>
                </div>

                {/* Cache and DB side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>// cache contents</div>
                        {Object.keys(cache).length === 0
                            ? <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>empty</div>
                            : Object.entries(cache).map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                                    <span style={{ color: 'var(--accent)', fontSize: 12 }}>{k}: {v}</span>
                                    <button onClick={() => invalidate(k)} className="btn btn-danger" style={{ padding: '2px 6px', fontSize: 9 }}>✗</button>
                                </div>
                            ))
                        }
                    </div>
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>// database rows</div>
                        {Object.entries(db).map(([k, v]) => (
                            <div key={k} style={{ padding: '3px 0', fontSize: 12, color: cache[k] ? 'var(--text-dim)' : 'var(--text-bright)' }}>
                                {k}: {v} {cache[k] && <span style={{ fontSize: 9, color: 'var(--accent)' }}>(cached)</span>}
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
                            <div key={e.id} className={`log-entry ${e.type === 'hit' ? 'allowed' : e.type === 'miss' ? 'rejected' : ''}`}>
                                {e.msg}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>App checks cache first (fast path)</li>
                        <li>On HIT: return cached value immediately</li>
                        <li>On MISS: fetch from DB → store in cache → return</li>
                        <li>Invalidate button removes stale entries</li>
                        <li>Cache warms up over time with usage</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// trade-offs</h3>
                    <ul>
                        <li>Most common caching pattern in production</li>
                        <li>Only caches data that&apos;s actually requested</li>
                        <li className="con">First request always a miss (cold start)</li>
                        <li className="con">Stale data if DB updates without invalidation</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
