'use client';

import { useState, useCallback, useRef } from 'react';

export default function AtLeastOncePage() {
    const [log, setLog] = useState<string[]>([]);
    const [stats, setStats] = useState({ sent: 0, deliveries: 0, duplicates: 0 });
    const [lossRate, setLossRate] = useState(0.5);
    const nextId = useRef(0);

    const send = useCallback(() => {
        const id = ++nextId.current;
        let attempts = 0;
        const tryDeliver = () => {
            attempts++;
            const success = Math.random() >= lossRate;
            if (success) {
                setStats(prev => ({ sent: prev.sent + 1, deliveries: prev.deliveries + attempts, duplicates: prev.duplicates + (attempts - 1) }));
                setLog(prev => [...prev.slice(-15), `MSG #${id} → delivered after ${attempts} attempt(s)${attempts > 1 ? ` (${attempts - 1} duplicate(s))` : ''}`]);
            } else {
                setLog(prev => [...prev.slice(-15), `MSG #${id} → attempt ${attempts} failed, retrying...`]);
                setTimeout(tryDeliver, 300);
            }
        };
        tryDeliver();
    }, [lossRate]);

    const sendBurst = useCallback(() => { for (let i = 0; i < 5; i++) setTimeout(send, i * 200); }, [send]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">messaging</span>
                <h1>At-Least-Once Delivery</h1>
                <p className="subtitle">Retry until acknowledged — messages never lost, but may be delivered multiple times.</p>
            </div>

            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// how it works</h3>
                <p>If no ACK received, retry. Guarantees delivery but consumer must handle duplicates (idempotency). Loss rate: {(lossRate * 100).toFixed(0)}%</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={send} className="sim-button">Send Message</button>
                <button onClick={sendBurst} className="sim-button">Send ×5</button>
                <input type="range" min="0" max="80" value={lossRate * 100} onChange={e => setLossRate(Number(e.target.value) / 100)} style={{ width: 100 }} />
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{(lossRate * 100).toFixed(0)}% loss</span>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 12 }}>
                <span>Messages: {stats.sent}</span>
                <span style={{ color: 'var(--accent)' }}>Total deliveries: {stats.deliveries}</span>
                <span style={{ color: 'var(--warning)' }}>Duplicates: {stats.duplicates}</span>
            </div>

            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 250, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: l.includes('failed') ? 'var(--warning)' : 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
