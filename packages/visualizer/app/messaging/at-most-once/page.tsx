'use client';

import { useState, useCallback, useRef } from 'react';

export default function AtMostOncePage() {
    const [sent, setSent] = useState<{ id: number; lost: boolean }[]>([]);
    const [received, setReceived] = useState<number[]>([]);
    const [lossRate, setLossRate] = useState(0.3);
    const [log, setLog] = useState<string[]>([]);
    const nextId = useRef(0);

    const send = useCallback(() => {
        const id = ++nextId.current;
        const lost = Math.random() < lossRate;
        setSent(prev => [...prev.slice(-20), { id, lost }]);
        if (!lost) setReceived(prev => [...prev.slice(-20), id]);
        setLog(prev => [...prev.slice(-15), lost ? `MSG #${id} → LOST (no retry)` : `MSG #${id} → delivered`]);
    }, [lossRate]);

    const sendBurst = useCallback(() => { for (let i = 0; i < 10; i++) setTimeout(send, i * 100); }, [send]);

    const stats = { total: sent.length, lost: sent.filter(s => s.lost).length, delivered: received.length };

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">messaging</span>
                <h1>At-Most-Once Delivery</h1>
                <p className="subtitle">Fire and forget — messages may be lost but are never duplicated.</p>
            </div>

            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// how it works</h3>
                <p>Send without waiting for acknowledgment. If the network drops the message, it&apos;s gone. No retries. Simulated loss rate: {(lossRate * 100).toFixed(0)}%</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={send} className="sim-button">Send Message</button>
                <button onClick={sendBurst} className="sim-button">Send ×10</button>
                <input type="range" min="0" max="80" value={lossRate * 100} onChange={e => setLossRate(Number(e.target.value) / 100)} style={{ width: 100 }} />
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{(lossRate * 100).toFixed(0)}% loss</span>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 12 }}>
                <span>Sent: {stats.total}</span>
                <span style={{ color: 'var(--accent)' }}>Delivered: {stats.delivered}</span>
                <span style={{ color: 'var(--danger)' }}>Lost: {stats.lost}</span>
                <span style={{ color: 'var(--text-dim)' }}>Duplicates: 0 (guaranteed)</span>
            </div>

            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: l.includes('LOST') ? 'var(--danger)' : 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
