'use client';

import { useState, useCallback, useRef } from 'react';

interface MessageResult { id: number; lost: boolean; }

export default function AtMostOncePage() {
    const [sent, setSent] = useState<MessageResult[]>([]);
    const [lossRate, setLossRate] = useState(0.3);
    const [events, setEvents] = useState<{ id: number; msg: string; type: 'delivered' | 'lost' }[]>([]);
    const nextId = useRef(0);
    const eventId = useRef(0);

    const addEvent = useCallback((msg: string, type: 'delivered' | 'lost') => {
        setEvents(prev => [...prev.slice(-20), { id: eventId.current++, msg, type }]);
    }, []);

    const send = useCallback(() => {
        const id = ++nextId.current;
        const lost = Math.random() < lossRate;
        setSent(prev => [...prev.slice(-30), { id, lost }]);
        if (lost) {
            addEvent(`MSG #${id} → ✗ LOST (no retry — fire and forget)`, 'lost');
        } else {
            addEvent(`MSG #${id} → ✓ delivered on first attempt`, 'delivered');
        }
    }, [lossRate, addEvent]);

    const sendBurst = useCallback(() => { for (let i = 0; i < 10; i++) setTimeout(send, i * 80); }, [send]);
    const reset = () => { setSent([]); setEvents([]); };

    const stats = { total: sent.length, lost: sent.filter(s => s.lost).length, delivered: sent.filter(s => !s.lost).length };
    const deliveryRate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(0) : '—';

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">messaging</span>
                <h1>At-Most-Once Delivery</h1>
                <p className="subtitle">Fire and forget — messages may be lost but are never duplicated. Zero retries.</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Total Sent</span>
                    <span className="stat-value">{stats.total}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Delivered</span>
                    <span className="stat-value accent">{stats.delivered}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Lost</span>
                    <span className="stat-value danger">{stats.lost}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Delivery Rate</span>
                    <span className="stat-value warning">{deliveryRate}%</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Duplicates</span>
                    <span className="stat-value accent">0 (guaranteed)</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <button onClick={send} className="btn btn-accent">Send Message</button>
                    <button onClick={sendBurst} className="btn">Send ×10</button>
                    <button onClick={reset} className="btn">Reset</button>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Loss Rate</span>
                        {[0.1, 0.3, 0.5, 0.7].map(r => (
                            <button key={r} onClick={() => setLossRate(r)} className="btn" style={{
                                padding: '4px 8px', fontSize: 10,
                                borderColor: lossRate === r ? 'var(--accent)' : undefined,
                                color: lossRate === r ? 'var(--accent)' : undefined,
                            }}>{(r * 100).toFixed(0)}%</button>
                        ))}
                    </div>
                </div>

                {/* Message stream visualization */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>// message stream (recent 30)</div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {sent.length === 0 && <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>No messages sent yet</span>}
                        {sent.map(m => (
                            <div key={m.id} style={{
                                width: 24, height: 24, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 8, fontWeight: 600,
                                background: m.lost ? 'var(--danger-glow)' : 'var(--accent-glow)',
                                border: `1px solid ${m.lost ? 'var(--danger)' : 'var(--accent)'}`,
                                color: m.lost ? 'var(--danger)' : 'var(--accent)',
                                animation: 'fadeIn 200ms ease',
                            }} title={m.lost ? `MSG #${m.id} — LOST` : `MSG #${m.id} — delivered`}>
                                {m.lost ? '✗' : '✓'}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comparison with at-least-once */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>✓ Guarantee</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>No duplicate processing — each message delivered at most once. Consumer logic stays simple.</div>
                    </div>
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600, marginBottom: 4 }}>✗ Risk</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Messages can be permanently lost. No retry mechanism. Acceptable only for non-critical data.</div>
                    </div>
                </div>
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// event log</h3>
                    <div className="log-area">
                        {events.length === 0 && <div className="log-entry">No events yet.</div>}
                        {events.slice(-12).reverse().map(e => (
                            <div key={e.id} className={`log-entry ${e.type === 'delivered' ? 'allowed' : 'rejected'}`}>{e.msg}</div>
                        ))}
                    </div>
                </div>
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>Send message once — never retry</li>
                        <li>If network drops it, it&apos;s permanently gone</li>
                        <li>Consumer never sees duplicates</li>
                        <li>Fastest delivery semantics (no ACK wait)</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// use cases</h3>
                    <ul>
                        <li>Metrics/telemetry (losing some is OK)</li>
                        <li>Real-time gaming (stale data is useless)</li>
                        <li>UDP-based protocols, log shipping</li>
                        <li className="con">Never use for financial transactions</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
