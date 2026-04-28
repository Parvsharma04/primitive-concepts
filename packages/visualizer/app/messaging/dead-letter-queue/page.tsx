'use client';

import { useState, useCallback, useRef } from 'react';

interface Msg { id: number; payload: string; attempts: number; status: 'queued' | 'done' | 'dlq'; }
const MAX_RETRIES = 3;

export default function DeadLetterQueuePage() {
    const [queue, setQueue] = useState<Msg[]>([]);
    const [dlq, setDlq] = useState<Msg[]>([]);
    const [processed, setProcessed] = useState<Msg[]>([]);
    const [failRate, setFailRate] = useState(0.6);
    const [events, setEvents] = useState<{ id: number; msg: string; type: 'produce' | 'success' | 'retry' | 'dlq' }[]>([]);
    const nextId = useRef(0);
    const eventId = useRef(0);

    const addEvent = useCallback((msg: string, type: 'produce' | 'success' | 'retry' | 'dlq') => {
        setEvents(prev => [...prev.slice(-20), { id: eventId.current++, msg, type }]);
    }, []);

    const produce = useCallback(() => {
        const msg: Msg = { id: ++nextId.current, payload: `msg_${nextId.current}`, attempts: 0, status: 'queued' };
        setQueue(prev => [...prev, msg]);
        addEvent(`ENQUEUE → "${msg.payload}"`, 'produce');
    }, [addEvent]);

    const produceBurst = useCallback(() => {
        for (let i = 0; i < 5; i++) setTimeout(produce, i * 100);
    }, [produce]);

    const consume = useCallback(() => {
        setQueue(prev => {
            if (prev.length === 0) { addEvent('CONSUME → queue empty', 'produce'); return prev; }
            const [head, ...rest] = prev;
            const success = Math.random() >= failRate;
            if (success) {
                setProcessed(p => [...p.slice(-10), { ...head, status: 'done' }]);
                addEvent(`✓ "${head.payload}" processed (attempt ${head.attempts + 1})`, 'success');
            } else {
                const newAttempts = head.attempts + 1;
                if (newAttempts >= MAX_RETRIES) {
                    setDlq(d => [...d, { ...head, attempts: newAttempts, status: 'dlq' }]);
                    addEvent(`☠ "${head.payload}" → DLQ (failed ${MAX_RETRIES}× — giving up)`, 'dlq');
                } else {
                    addEvent(`✗ "${head.payload}" failed (${newAttempts}/${MAX_RETRIES}) — re-queuing`, 'retry');
                    return [...rest, { ...head, attempts: newAttempts }];
                }
            }
            return rest;
        });
    }, [failRate, addEvent]);

    const consumeAll = useCallback(() => {
        const count = queue.length;
        for (let i = 0; i < count; i++) setTimeout(consume, i * 200);
    }, [queue.length, consume]);

    const retryFromDlq = useCallback(() => {
        if (dlq.length === 0) return;
        const [head, ...rest] = dlq;
        setDlq(rest);
        setQueue(prev => [...prev, { ...head, attempts: 0, status: 'queued' }]);
        addEvent(`RETRY from DLQ → "${head.payload}" re-queued`, 'produce');
    }, [dlq, addEvent]);

    const reset = () => { setQueue([]); setDlq([]); setProcessed([]); setEvents([]); };

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">messaging</span>
                <h1>Dead Letter Queue</h1>
                <p className="subtitle">Messages that fail {MAX_RETRIES} times are moved to a DLQ for manual inspection and retry</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Queue</span>
                    <span className="stat-value warning">{queue.length}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Processed</span>
                    <span className="stat-value accent">{processed.length}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">DLQ</span>
                    <span className="stat-value danger">{dlq.length}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Fail Rate</span>
                    <span className="stat-value">{(failRate * 100).toFixed(0)}%</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <button onClick={produce} className="btn btn-accent">Produce</button>
                    <button onClick={produceBurst} className="btn">Produce ×5</button>
                    <button onClick={consume} className="btn btn-accent">Consume</button>
                    <button onClick={consumeAll} className="btn">Consume All</button>
                    {dlq.length > 0 && <button onClick={retryFromDlq} className="btn btn-danger">Retry from DLQ</button>}
                    <button onClick={reset} className="btn" style={{ marginLeft: 'auto' }}>Reset</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Fail%</span>
                        {[0.3, 0.5, 0.7, 0.9].map(r => (
                            <button key={r} onClick={() => setFailRate(r)} className="btn" style={{
                                padding: '4px 6px', fontSize: 9,
                                borderColor: failRate === r ? 'var(--accent)' : undefined,
                                color: failRate === r ? 'var(--accent)' : undefined,
                            }}>{(r * 100).toFixed(0)}</button>
                        ))}
                    </div>
                </div>

                {/* Flow: Queue → Processing → Success / DLQ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                    {/* Main Queue */}
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600, marginBottom: 6 }}>// main queue ({queue.length})</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto' }}>
                            {queue.length === 0 && <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>empty</span>}
                            {queue.map((m, i) => (
                                <div key={m.id} style={{
                                    padding: '4px 8px', borderRadius: 3, fontSize: 10, display: 'flex', justifyContent: 'space-between',
                                    background: i === 0 ? 'var(--info-glow)' : 'var(--surface-2)',
                                    border: `1px solid ${i === 0 ? 'var(--info)' : 'var(--border)'}`,
                                }}>
                                    <span style={{ color: 'var(--text-bright)' }}>{m.payload}</span>
                                    <span style={{ color: m.attempts > 0 ? 'var(--warning)' : 'var(--text-dim)' }}>
                                        {m.attempts > 0 ? `retry ${m.attempts}` : 'new'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Processed */}
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 6 }}>// processed ✓ ({processed.length})</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 150, overflowY: 'auto' }}>
                            {processed.length === 0 && <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>none yet</span>}
                            {processed.map(m => (
                                <span key={m.id} style={{ fontSize: 10, color: 'var(--accent)' }}>✓ {m.payload}</span>
                            ))}
                        </div>
                    </div>

                    {/* DLQ */}
                    <div style={{ background: 'var(--bg)', border: `1px solid ${dlq.length > 0 ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600, marginBottom: 6 }}>// dead letter queue ☠ ({dlq.length})</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 150, overflowY: 'auto' }}>
                            {dlq.length === 0 && <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>empty</span>}
                            {dlq.map(m => (
                                <div key={m.id} style={{ fontSize: 10, color: 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>☠ {m.payload}</span>
                                    <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>failed {m.attempts}×</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Max retries indicator */}
                <div style={{ padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', fontSize: 11, color: 'var(--text-dim)', display: 'flex', gap: 16 }}>
                    <span>Max retries: <span style={{ color: 'var(--warning)' }}>{MAX_RETRIES}</span></span>
                    <span>Flow: enqueue → attempt → {`{success: done, fail < ${MAX_RETRIES}: re-queue, fail ≥ ${MAX_RETRIES}: DLQ}`}</span>
                </div>
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// event log</h3>
                    <div className="log-area">
                        {events.length === 0 && <div className="log-entry">No events yet.</div>}
                        {events.slice(-12).reverse().map(e => (
                            <div key={e.id} className={`log-entry ${e.type === 'success' ? 'allowed' : e.type === 'dlq' ? 'rejected' : ''}`}>{e.msg}</div>
                        ))}
                    </div>
                </div>
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>Process message from main queue</li>
                        <li>On failure: re-queue with incremented attempt count</li>
                        <li>After {MAX_RETRIES} failures → move to DLQ</li>
                        <li>DLQ allows manual inspection & retry</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// trade-offs</h3>
                    <ul>
                        <li>Prevents poison messages from blocking queue</li>
                        <li>Preserves failed messages for debugging</li>
                        <li className="con">DLQ needs monitoring and alerting</li>
                        <li className="con">Retry delays slow overall throughput</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
