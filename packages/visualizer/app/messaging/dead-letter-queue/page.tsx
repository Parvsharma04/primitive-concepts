'use client';

import { useState, useCallback, useRef } from 'react';

interface Msg { id: number; payload: string; attempts: number; status: 'queued' | 'processing' | 'done' | 'dlq'; }
const MAX_RETRIES = 3;

export default function DeadLetterQueuePage() {
    const [queue, setQueue] = useState<Msg[]>([]);
    const [dlq, setDlq] = useState<Msg[]>([]);
    const [processed, setProcessed] = useState<Msg[]>([]);
    const [failRate, setFailRate] = useState(0.6);
    const [log, setLog] = useState<string[]>([]);
    const nextId = useRef(0);

    const produce = useCallback(() => {
        const msg: Msg = { id: ++nextId.current, payload: `msg_${nextId.current}`, attempts: 0, status: 'queued' };
        setQueue(prev => [...prev, msg]);
        setLog(prev => [...prev.slice(-15), `ENQUEUE: ${msg.payload}`]);
    }, []);

    const consume = useCallback(() => {
        setQueue(prev => {
            if (prev.length === 0) return prev;
            const [head, ...rest] = prev;
            const success = Math.random() >= failRate;
            if (success) {
                setProcessed(p => [...p.slice(-10), { ...head, status: 'done' }]);
                setLog(l => [...l.slice(-15), `✓ ${head.payload} processed (attempt ${head.attempts + 1})`]);
            } else {
                const newAttempts = head.attempts + 1;
                if (newAttempts >= MAX_RETRIES) {
                    setDlq(d => [...d, { ...head, attempts: newAttempts, status: 'dlq' }]);
                    setLog(l => [...l.slice(-15), `✗ ${head.payload} → DLQ after ${MAX_RETRIES} failures`]);
                } else {
                    setLog(l => [...l.slice(-15), `✗ ${head.payload} failed (attempt ${newAttempts}/${MAX_RETRIES}), re-queuing`]);
                    return [...rest, { ...head, attempts: newAttempts }];
                }
            }
            return rest;
        });
    }, [failRate]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">messaging</span>
                <h1>Dead Letter Queue</h1>
                <p className="subtitle">Messages that fail {MAX_RETRIES} times are moved to the DLQ for inspection.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <button onClick={produce} className="sim-button">Produce</button>
                <button onClick={consume} className="sim-button">Consume</button>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', alignSelf: 'center' }}>Fail rate: {(failRate * 100).toFixed(0)}%</span>
                <input type="range" min="0" max="90" value={failRate * 100} onChange={e => setFailRate(Number(e.target.value) / 100)} style={{ width: 80 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="info-panel" style={{ padding: 8 }}>
                    <h3 style={{ fontSize: 11 }}>// queue ({queue.length})</h3>
                    {queue.map(m => <div key={m.id} style={{ fontSize: 10, color: 'var(--info)' }}>{m.payload} (att:{m.attempts})</div>)}
                </div>
                <div className="info-panel" style={{ padding: 8 }}>
                    <h3 style={{ fontSize: 11 }}>// processed ({processed.length})</h3>
                    {processed.map(m => <div key={m.id} style={{ fontSize: 10, color: 'var(--accent)' }}>✓ {m.payload}</div>)}
                </div>
                <div className="info-panel" style={{ padding: 8 }}>
                    <h3 style={{ fontSize: 11, color: 'var(--danger)' }}>// DLQ ({dlq.length})</h3>
                    {dlq.map(m => <div key={m.id} style={{ fontSize: 10, color: 'var(--danger)' }}>☠ {m.payload}</div>)}
                </div>
            </div>

            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 150, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
