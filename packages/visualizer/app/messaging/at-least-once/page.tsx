'use client';

import { useState, useCallback, useRef } from 'react';

interface MessageState {
    id: number;
    attempts: number;
    status: 'retrying' | 'delivered';
}

export default function AtLeastOncePage() {
    const [events, setEvents] = useState<{ id: number; msg: string; type: 'send' | 'retry' | 'ack' }[]>([]);
    const [stats, setStats] = useState({ sent: 0, totalAttempts: 0, duplicates: 0 });
    const [lossRate, setLossRate] = useState(0.5);
    const [messages, setMessages] = useState<MessageState[]>([]);
    const nextId = useRef(0);
    const eventId = useRef(0);

    const addEvent = useCallback((msg: string, type: 'send' | 'retry' | 'ack') => {
        setEvents(prev => [...prev.slice(-20), { id: eventId.current++, msg, type }]);
    }, []);

    const send = useCallback(() => {
        const id = ++nextId.current;
        const msgState: MessageState = { id, attempts: 0, status: 'retrying' };
        setMessages(prev => [...prev.slice(-8), msgState]);
        addEvent(`MSG #${id} → sending...`, 'send');

        const tryDeliver = (attempt: number) => {
            const success = Math.random() >= lossRate;

            if (success) {
                const dupes = attempt - 1; // first attempt isn't a duplicate
                setStats(prev => ({
                    sent: prev.sent + 1,
                    totalAttempts: prev.totalAttempts + attempt,
                    duplicates: prev.duplicates + dupes,
                }));
                setMessages(prev => prev.map(m => m.id === id ? { ...m, attempts: attempt, status: 'delivered' } : m));
                addEvent(`MSG #${id} → ✓ ACK (attempt ${attempt})${dupes > 0 ? ` — consumer saw ${dupes} duplicate(s)` : ''}`, 'ack');
            } else {
                setMessages(prev => prev.map(m => m.id === id ? { ...m, attempts: attempt } : m));
                addEvent(`MSG #${id} → ✗ no ACK (attempt ${attempt}), retrying...`, 'retry');
                setTimeout(() => tryDeliver(attempt + 1), 400);
            }
        };

        setTimeout(() => tryDeliver(1), 200);
    }, [lossRate, addEvent]);

    const sendBurst = useCallback(() => {
        for (let i = 0; i < 5; i++) setTimeout(send, i * 300);
    }, [send]);

    const reset = () => {
        setEvents([]);
        setStats({ sent: 0, totalAttempts: 0, duplicates: 0 });
        setMessages([]);
        nextId.current = 0;
    };

    const avgAttempts = stats.sent > 0 ? (stats.totalAttempts / stats.sent).toFixed(1) : '—';

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">messaging</span>
                <h1>At-Least-Once Delivery</h1>
                <p className="subtitle">Retry until acknowledged — messages are never lost but consumer may see duplicates</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Delivered</span>
                    <span className="stat-value accent">{stats.sent}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Avg Attempts</span>
                    <span className="stat-value warning">{avgAttempts}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Duplicate Deliveries</span>
                    <span className="stat-value danger">{stats.duplicates}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Loss Rate</span>
                    <span className="stat-value">{(lossRate * 100).toFixed(0)}%</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <button onClick={send} className="btn btn-accent">Send Message</button>
                    <button onClick={sendBurst} className="btn">Send ×5</button>
                    <button onClick={reset} className="btn">Reset</button>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Network Loss</span>
                        {[0.3, 0.5, 0.7].map(r => (
                            <button key={r} onClick={() => setLossRate(r)} className="btn" style={{
                                padding: '4px 8px', fontSize: 10,
                                borderColor: lossRate === r ? 'var(--accent)' : undefined,
                                color: lossRate === r ? 'var(--accent)' : undefined,
                            }}>{(r * 100)}%</button>
                        ))}
                    </div>
                </div>

                {/* Message attempt visualization */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>// delivery attempts per message</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {messages.length === 0 && <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>Send a message to see retry behavior</span>}
                        {messages.map(m => (
                            <div key={m.id} style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                                background: m.status === 'delivered' ? 'var(--accent-glow)' : 'var(--surface-2)',
                                border: `1px solid ${m.status === 'delivered' ? 'var(--accent)' : 'var(--warning)'}`,
                                borderRadius: 'var(--radius)', transition: 'all 300ms ease',
                            }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-bright)', minWidth: 55 }}>MSG #{m.id}</span>
                                {/* Each attempt shown as a dot */}
                                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                                    {Array.from({ length: m.attempts }, (_, i) => {
                                        const isFinal = i === m.attempts - 1;
                                        const isSuccess = isFinal && m.status === 'delivered';
                                        return (
                                            <div key={i} style={{
                                                width: 18, height: 18, borderRadius: '50%', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600,
                                                background: isSuccess ? 'var(--accent)' : 'var(--danger)',
                                                color: 'var(--bg)',
                                            }}>
                                                {isSuccess ? '✓' : '✗'}
                                            </div>
                                        );
                                    })}
                                    {m.status === 'retrying' && (
                                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--warning)', animation: 'pulse 1s infinite' }} />
                                    )}
                                </div>
                                <span style={{ fontSize: 10, color: m.status === 'delivered' ? 'var(--accent)' : 'var(--warning)', whiteSpace: 'nowrap' }}>
                                    {m.status === 'delivered' ? `done in ${m.attempts}` : 'retrying...'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {stats.duplicates > 0 && (
                    <div style={{ padding: '8px 12px', background: 'var(--warning-glow)', border: '1px solid var(--warning)', borderRadius: 'var(--radius)', fontSize: 11, color: 'var(--warning)' }}>
                        ⚠ Consumer received {stats.duplicates} duplicate(s) — must implement idempotency (e.g., dedup by message ID)
                    </div>
                )}
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// event log</h3>
                    <div className="log-area">
                        {events.length === 0 && <div className="log-entry">No events yet.</div>}
                        {events.slice(-12).reverse().map(e => (
                            <div key={e.id} className={`log-entry ${e.type === 'ack' ? 'allowed' : e.type === 'retry' ? 'rejected' : ''}`}>{e.msg}</div>
                        ))}
                    </div>
                </div>
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>Producer sends → waits for consumer ACK</li>
                        <li>No ACK within timeout → resend same message</li>
                        <li>Repeat until ACK received (infinite retries)</li>
                        <li>Consumer may process same msg multiple times</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// consumer must be idempotent</h3>
                    <ul>
                        <li>Track processed message IDs (dedup table)</li>
                        <li>Use idempotency keys for side effects</li>
                        <li>Database upserts instead of inserts</li>
                        <li className="con">Higher avg latency = 1/(1−lossRate) attempts</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
