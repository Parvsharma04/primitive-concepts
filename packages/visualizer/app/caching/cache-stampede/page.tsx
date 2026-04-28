'use client';

import { useState, useCallback, useRef } from 'react';

interface Request { id: number; status: 'waiting' | 'fetching' | 'served'; servedFrom: string; }

export default function CacheStampedePage() {
    const [cache, setCache] = useState<{ value: string; expiresAt: number } | null>(null);
    const [lock, setLock] = useState(false);
    const [requests, setRequests] = useState<Request[]>([]);
    const [log, setLog] = useState<string[]>([]);
    const [protection, setProtection] = useState(true);
    const nextId = useRef(0);

    const addLog = useCallback((msg: string) => {
        setLog(prev => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    }, []);

    const simulateStampede = useCallback(() => {
        setCache(null); // expire cache
        setLock(false);
        const count = 6;
        const reqs: Request[] = Array.from({ length: count }, () => ({ id: nextId.current++, status: 'waiting' as const, servedFrom: '' }));
        setRequests(reqs);
        addLog(`Cache expired! ${count} concurrent requests incoming...`);

        if (protection) {
            // Only first request fetches, others wait
            const fetcherId = reqs[0].id;
            setLock(true);
            addLog(`Lock acquired by request #${fetcherId} — others will wait`);

            setTimeout(() => {
                const newValue = `data_${Date.now()}`;
                setCache({ value: newValue, expiresAt: Date.now() + 5000 });
                setLock(false);
                setRequests(prev => prev.map(r => ({ ...r, status: 'served', servedFrom: r.id === fetcherId ? 'DB (fetcher)' : 'cache (waited)' })));
                addLog(`Request #${fetcherId} fetched from DB → cache populated → all served`);
            }, 1500);
        } else {
            // All requests hit DB simultaneously
            addLog(`No protection! All ${count} requests hitting DB simultaneously!`);
            setTimeout(() => {
                const newValue = `data_${Date.now()}`;
                setCache({ value: newValue, expiresAt: Date.now() + 5000 });
                setRequests(prev => prev.map(r => ({ ...r, status: 'served', servedFrom: 'DB (redundant)' })));
                addLog(`All ${count} requests independently fetched from DB — wasteful!`);
            }, 1500);
        }
    }, [protection, addLog]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">caching</span>
                <h1>Cache Stampede Protection</h1>
                <p className="subtitle">Prevent thundering herd when a popular cache key expires.</p>
            </div>

            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// how it works</h3>
                <p>When cache expires and many requests arrive simultaneously, without protection all hit the DB. With locking, only one fetches while others wait.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={() => setProtection(true)} className="sim-button" style={{ background: protection ? 'var(--accent-glow)' : undefined }}>With Lock</button>
                <button onClick={() => setProtection(false)} className="sim-button" style={{ background: !protection ? 'var(--danger-glow)' : undefined }}>No Protection</button>
                <button onClick={simulateStampede} className="sim-button">Simulate Stampede</button>
            </div>

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
                {requests.map(r => (
                    <div key={r.id} style={{
                        padding: '6px 10px', borderRadius: 'var(--radius)', fontSize: 11, fontFamily: 'var(--font-mono)',
                        background: r.status === 'served' ? 'var(--accent-glow)' : r.status === 'fetching' ? 'var(--info-glow)' : 'var(--surface-2)',
                        border: `1px solid ${r.status === 'served' ? 'var(--accent)' : 'var(--border)'}`,
                        color: 'var(--text-bright)',
                    }}>
                        #{r.id} {r.status} {r.servedFrom && `(${r.servedFrom})`}
                    </div>
                ))}
            </div>

            <div style={{ fontSize: 12, marginBottom: 16, color: 'var(--text-dim)' }}>
                Cache: {cache ? `"${cache.value}"` : 'EMPTY'} | Lock: {lock ? '🔒 held' : '🔓 free'}
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
