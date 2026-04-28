'use client';

import { useState, useCallback, useRef } from 'react';

interface Message { id: number; payload: string; status: 'queued' | 'processing' | 'done'; }

export default function InMemoryQueuePage() {
    const [queue, setQueue] = useState<Message[]>([]);
    const [processed, setProcessed] = useState<Message[]>([]);
    const [log, setLog] = useState<string[]>([]);
    const nextId = useRef(0);
    const [autoConsume, setAutoConsume] = useState(false);

    const produce = useCallback(() => {
        const msg: Message = { id: nextId.current++, payload: `msg_${nextId.current}`, status: 'queued' };
        setQueue(prev => [...prev, msg]);
        setLog(prev => [...prev.slice(-15), `PRODUCE: ${msg.payload} enqueued`]);
    }, []);

    const consume = useCallback(() => {
        setQueue(prev => {
            if (prev.length === 0) { setLog(l => [...l.slice(-15), 'CONSUME: queue empty']); return prev; }
            const [head, ...rest] = prev;
            setProcessed(p => [...p.slice(-10), { ...head, status: 'done' }]);
            setLog(l => [...l.slice(-15), `CONSUME: ${head.payload} processed`]);
            return rest;
        });
    }, []);

    const produceBurst = useCallback(() => { for (let i = 0; i < 5; i++) setTimeout(produce, i * 100); }, [produce]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">messaging</span>
                <h1>In-Memory Queue</h1>
                <p className="subtitle">FIFO queue — producers enqueue, consumers dequeue in order.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <button onClick={produce} className="sim-button">Produce</button>
                <button onClick={produceBurst} className="sim-button">Produce ×5</button>
                <button onClick={consume} className="sim-button">Consume</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="info-panel">
                    <h3>// queue ({queue.length})</h3>
                    {queue.length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>empty</p> :
                        queue.map(m => <div key={m.id} style={{ fontSize: 11, padding: '2px 0', color: 'var(--info)' }}>← {m.payload}</div>)}
                </div>
                <div className="info-panel">
                    <h3>// processed ({processed.length})</h3>
                    {processed.map(m => <div key={m.id} style={{ fontSize: 11, padding: '2px 0', color: 'var(--accent)' }}>✓ {m.payload}</div>)}
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
