'use client';

import { useState, useCallback, useRef } from 'react';

interface Message { id: number; payload: string; }

export default function InMemoryQueuePage() {
    const [queue, setQueue] = useState<Message[]>([]);
    const [processed, setProcessed] = useState<Message[]>([]);
    const [events, setEvents] = useState<{ id: number; msg: string; type: 'produce' | 'consume' | 'info' }[]>([]);
    const nextId = useRef(0);
    const eventId = useRef(0);
    const totalProduced = useRef(0);

    const addEvent = useCallback((msg: string, type: 'produce' | 'consume' | 'info') => {
        setEvents(prev => [...prev.slice(-20), { id: eventId.current++, msg, type }]);
    }, []);

    const produce = useCallback(() => {
        const id = nextId.current++;
        totalProduced.current++;
        const msg: Message = { id, payload: `msg_${id}` };
        setQueue(prev => [...prev, msg]);
        addEvent(`PRODUCE → "${msg.payload}" enqueued`, 'produce');
    }, [addEvent]);

    // Use functional update so consume always sees latest queue state
    const consume = useCallback(() => {
        setQueue(prev => {
            if (prev.length === 0) {
                addEvent('CONSUME → queue empty', 'info');
                return prev;
            }
            const [head, ...rest] = prev;
            setProcessed(p => [...p.slice(-12), head]);
            addEvent(`CONSUME → "${head.payload}" dequeued`, 'consume');
            return rest;
        });
    }, [addEvent]);

    const produceBurst = useCallback(() => {
        for (let i = 0; i < 5; i++) setTimeout(produce, i * 100);
    }, [produce]);

    // Each consume call uses functional update, so sequential timeouts work correctly
    const consumeAll = useCallback(() => {
        for (let i = 0; i < queue.length; i++) setTimeout(consume, i * 150);
    }, [queue.length, consume]);

    const reset = () => { setQueue([]); setProcessed([]); setEvents([]); nextId.current = 0; totalProduced.current = 0; };

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">messaging</span>
                <h1>In-Memory Queue</h1>
                <p className="subtitle">FIFO queue — producers enqueue at the tail, consumers dequeue from the head in strict order</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Queue Depth</span>
                    <span className="stat-value warning">{queue.length}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Produced</span>
                    <span className="stat-value accent">{totalProduced.current}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Consumed</span>
                    <span className="stat-value accent">{processed.length}</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <button onClick={produce} className="btn btn-accent">Produce</button>
                    <button onClick={produceBurst} className="btn">Produce ×5</button>
                    <button onClick={consume} className="btn btn-accent">Consume</button>
                    <button onClick={consumeAll} className="btn">Consume All</button>
                    <button onClick={reset} className="btn" style={{ marginLeft: 'auto' }}>Reset</button>
                </div>

                {/* Queue visualization - horizontal pipe */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>// queue (FIFO — head on left, tail on right)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                        <div style={{ padding: '8px 12px', background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginRight: 8 }}>
                            Consumer ←
                        </div>

                        <div style={{ flex: 1, display: 'flex', gap: 4, overflowX: 'auto', padding: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', minHeight: 50, alignItems: 'center' }}>
                            {queue.length === 0 && <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>empty</span>}
                            {queue.map((m, i) => (
                                <div key={m.id} style={{
                                    padding: '6px 10px', borderRadius: 3, fontSize: 10, fontFamily: 'var(--font-mono)',
                                    background: i === 0 ? 'var(--info-glow)' : 'var(--surface-2)',
                                    border: `1px solid ${i === 0 ? 'var(--info)' : 'var(--border)'}`,
                                    color: 'var(--text-bright)', whiteSpace: 'nowrap',
                                    animation: 'fadeIn 200ms ease',
                                }}>
                                    {m.payload}
                                    {i === 0 && <span style={{ fontSize: 8, color: 'var(--info)', marginLeft: 4 }}>HEAD</span>}
                                </div>
                            ))}
                        </div>

                        <div style={{ padding: '8px 12px', background: 'var(--warning-glow)', border: '1px solid var(--warning)', borderRadius: 'var(--radius)', fontSize: 10, color: 'var(--warning)', fontWeight: 600, marginLeft: 8 }}>
                            → Producer
                        </div>
                    </div>
                </div>

                {/* Processed list */}
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>// processed (last 12)</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {processed.length === 0 && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>none yet</span>}
                    {processed.map(m => (
                        <span key={m.id} style={{ padding: '3px 8px', fontSize: 10, background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: 3, color: 'var(--accent)' }}>
                            ✓ {m.payload}
                        </span>
                    ))}
                </div>
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// event log</h3>
                    <div className="log-area">
                        {events.length === 0 && <div className="log-entry">No events yet.</div>}
                        {events.slice(-12).reverse().map(e => (
                            <div key={e.id} className={`log-entry ${e.type === 'consume' ? 'allowed' : ''}`}>{e.msg}</div>
                        ))}
                    </div>
                </div>
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>Producer appends to tail — O(1)</li>
                        <li>Consumer removes from head — O(1)</li>
                        <li>Strict FIFO: first in, first out</li>
                        <li>Decouples producer/consumer speeds</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// trade-offs</h3>
                    <ul>
                        <li>Simple, low-latency in-process communication</li>
                        <li>Bounded queues provide backpressure</li>
                        <li className="con">Data lost on process crash (volatile)</li>
                        <li className="con">Single consumer — no parallelism</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
