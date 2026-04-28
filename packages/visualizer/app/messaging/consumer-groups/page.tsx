'use client';

import { useState, useCallback, useRef } from 'react';

interface Consumer { id: string; partitions: number[]; messages: number; }

// Range-based partition assignment (like Kafka's RangeAssignor)
function assignPartitions(consumerCount: number, partitionCount: number): number[][] {
    const assignments: number[][] = Array.from({ length: consumerCount }, () => []);
    for (let p = 0; p < partitionCount; p++) {
        assignments[p % consumerCount].push(p);
    }
    return assignments;
}

export default function ConsumerGroupsPage() {
    const [partitionCount] = useState(6);
    const [consumers, setConsumers] = useState<Consumer[]>(() => {
        const assignments = assignPartitions(3, 6);
        return [
            { id: 'C1', partitions: assignments[0], messages: 0 },
            { id: 'C2', partitions: assignments[1], messages: 0 },
            { id: 'C3', partitions: assignments[2], messages: 0 },
        ];
    });
    const [events, setEvents] = useState<{ id: number; msg: string; type: 'produce' | 'rebalance' | 'info' }[]>([]);
    const [lastPartition, setLastPartition] = useState<number | null>(null);
    const [lastConsumer, setLastConsumer] = useState<string | null>(null);
    const msgId = useRef(0);
    const eventId = useRef(0);

    const addEvent = useCallback((msg: string, type: 'produce' | 'rebalance' | 'info') => {
        setEvents(prev => [...prev.slice(-20), { id: eventId.current++, msg, type }]);
    }, []);

    // Produce uses functional update to always read fresh consumer state
    const produce = useCallback(() => {
        const partition = Math.floor(Math.random() * partitionCount);
        setConsumers(prev => {
            const consumer = prev.find(c => c.partitions.includes(partition));
            if (!consumer) return prev;
            setLastPartition(partition);
            setLastConsumer(consumer.id);
            addEvent(`MSG #${++msgId.current} → P${partition} → ${consumer.id}`, 'produce');
            return prev.map(c => c.id === consumer.id ? { ...c, messages: c.messages + 1 } : c);
        });
    }, [partitionCount, addEvent]);

    const produceBurst = useCallback(() => {
        for (let i = 0; i < 12; i++) setTimeout(produce, i * 100);
    }, [produce]);

    const addConsumer = useCallback(() => {
        setConsumers(prev => {
            if (prev.length >= partitionCount) {
                addEvent(`Cannot add — consumers (${prev.length}) ≥ partitions (${partitionCount})`, 'info');
                return prev;
            }
            const newCount = prev.length + 1;
            const assignments = assignPartitions(newCount, partitionCount);
            const newConsumers = prev.map((c, i) => ({ ...c, partitions: assignments[i] }));
            newConsumers.push({ id: `C${newCount}`, partitions: assignments[newCount - 1], messages: 0 });
            addEvent(`REBALANCE → ${newCount} consumers, partitions redistributed: ${assignments.map((a, i) => `C${i + 1}=[${a}]`).join(' ')}`, 'rebalance');
            return newConsumers;
        });
    }, [partitionCount, addEvent]);

    const removeConsumer = useCallback(() => {
        setConsumers(prev => {
            if (prev.length <= 1) return prev;
            const newCount = prev.length - 1;
            const removed = prev[prev.length - 1];
            const assignments = assignPartitions(newCount, partitionCount);
            const newConsumers = prev.slice(0, newCount).map((c, i) => ({ ...c, partitions: assignments[i] }));
            addEvent(`${removed.id} left → REBALANCE → ${newCount} consumers: ${assignments.map((a, i) => `C${i + 1}=[${a}]`).join(' ')}`, 'rebalance');
            return newConsumers;
        });
    }, [partitionCount, addEvent]);

    const reset = () => {
        setConsumers(prev => {
            const assignments = assignPartitions(prev.length, partitionCount);
            return prev.map((c, i) => ({ ...c, partitions: assignments[i], messages: 0 }));
        });
        setEvents([]);
        setLastPartition(null);
        setLastConsumer(null);
    };

    const totalMessages = consumers.reduce((s, c) => s + c.messages, 0);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">messaging</span>
                <h1>Consumer Groups</h1>
                <p className="subtitle">Partitions are distributed across consumers in a group — enabling parallel, ordered processing</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Partitions</span>
                    <span className="stat-value">{partitionCount}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Consumers</span>
                    <span className="stat-value accent">{consumers.length}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Total Messages</span>
                    <span className="stat-value warning">{totalMessages}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Partitions/Consumer</span>
                    <span className="stat-value">{(partitionCount / consumers.length).toFixed(1)}</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <button onClick={produce} className="btn btn-accent">Produce</button>
                    <button onClick={produceBurst} className="btn">Produce ×12</button>
                    <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                    <button onClick={addConsumer} className="btn">+ Consumer</button>
                    <button onClick={removeConsumer} className="btn btn-danger">− Consumer</button>
                    <button onClick={reset} className="btn" style={{ marginLeft: 'auto' }}>Reset</button>
                </div>

                {/* Partition → Consumer mapping */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>// partition → consumer assignment (RangeAssignor)</div>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                        {Array.from({ length: partitionCount }, (_, i) => {
                            const owner = consumers.find(c => c.partitions.includes(i));
                            const isActive = i === lastPartition;
                            return (
                                <div key={i} style={{
                                    flex: 1, padding: '10px 8px', borderRadius: 'var(--radius)', textAlign: 'center',
                                    background: isActive ? 'var(--accent-glow)' : 'var(--surface-2)',
                                    border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                                    transition: 'all var(--transition)',
                                }}>
                                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-bright)' }}>P{i}</div>
                                    <div style={{ fontSize: 9, color: 'var(--info)', marginTop: 2 }}>{owner?.id || 'unassigned'}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Consumer cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(consumers.length, 6)}, 1fr)`, gap: 12 }}>
                        {consumers.map(c => {
                            const isActive = c.id === lastConsumer;
                            return (
                                <div key={c.id} style={{
                                    padding: '14px 12px', borderRadius: 'var(--radius)', textAlign: 'center',
                                    background: isActive ? 'var(--accent-glow)' : 'var(--surface-2)',
                                    border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                                    transition: 'all var(--transition)',
                                }}>
                                    <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 14 }}>{c.id}</div>
                                    <div style={{ fontSize: 10, color: 'var(--info)', marginTop: 4 }}>
                                        owns: [{c.partitions.map(p => `P${p}`).join(', ')}]
                                    </div>
                                    <div style={{ fontSize: 20, color: 'var(--accent)', marginTop: 8, fontWeight: 600 }}>{c.messages}</div>
                                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>messages</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// event log</h3>
                    <div className="log-area">
                        {events.length === 0 && <div className="log-entry">No events yet.</div>}
                        {events.slice(-12).reverse().map(e => (
                            <div key={e.id} className={`log-entry ${e.type === 'produce' ? 'allowed' : e.type === 'rebalance' ? 'rejected' : ''}`}>{e.msg}</div>
                        ))}
                    </div>
                </div>
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>Each partition assigned to exactly one consumer</li>
                        <li>Assignment: partition % consumerCount (round-robin)</li>
                        <li>Adding/removing consumers triggers rebalance</li>
                        <li>Max useful consumers = partition count</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// trade-offs</h3>
                    <ul>
                        <li>Horizontal scaling of consumption</li>
                        <li>Order preserved within each partition</li>
                        <li className="con">Rebalance causes brief processing pause</li>
                        <li className="con">Extra consumers beyond partition count sit idle</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
