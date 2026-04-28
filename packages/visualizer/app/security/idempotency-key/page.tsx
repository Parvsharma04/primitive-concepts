'use client';

import { useState, useCallback, useRef } from 'react';

export default function IdempotencyKeyPage() {
    const [store, setStore] = useState<Record<string, { response: string; createdAt: number }>>({});
    const [log, setLog] = useState<string[]>([]);
    const [inputKey, setInputKey] = useState('');
    const nextOp = useRef(0);

    const sendRequest = useCallback(() => {
        const key = inputKey.trim() || `idem-${Math.random().toString(36).slice(2, 8)}`;
        if (store[key]) {
            setLog(prev => [...prev.slice(-15), `⚡ DUPLICATE key="${key}" → returning cached response: "${store[key].response}"`]);
        } else {
            const response = `result_${++nextOp.current}`;
            setStore(prev => ({ ...prev, [key]: { response, createdAt: Date.now() } }));
            setLog(prev => [...prev.slice(-15), `✓ NEW key="${key}" → processed → response: "${response}"`]);
        }
        setInputKey(key); // Keep same key to demo retries
    }, [inputKey, store]);

    const newKey = useCallback(() => {
        setInputKey(`idem-${Math.random().toString(36).slice(2, 8)}`);
    }, []);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">security</span>
                <h1>Idempotency Key</h1>
                <p className="subtitle">Same key = same result. Retry safely without duplicate side effects.</p>
            </div>

            <div className="info-panel" style={{ marginBottom: 16 }}>
                <h3>// how it works</h3>
                <p>Client sends a unique Idempotency-Key header. Server stores the result. Retries with the same key return the cached response without re-executing.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="idempotency key" className="sim-input" style={{ width: 200 }} onKeyDown={e => e.key === 'Enter' && sendRequest()} />
                <button onClick={sendRequest} className="sim-button">Send Request</button>
                <button onClick={newKey} className="sim-button">New Key</button>
            </div>

            <div className="info-panel" style={{ marginBottom: 16 }}>
                <h3>// stored keys ({Object.keys(store).length})</h3>
                {Object.entries(store).map(([k, v]) => (
                    <div key={k} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>
                        <span style={{ color: 'var(--accent)' }}>{k}</span> → {v.response}
                    </div>
                ))}
            </div>

            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 150, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: l.includes('DUPLICATE') ? 'var(--warning)' : 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
