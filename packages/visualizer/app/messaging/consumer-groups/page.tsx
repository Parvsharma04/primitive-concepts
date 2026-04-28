'use client';

import { useState, useCallback, useRef } from 'react';

interface Consumer { id: string; partitions: number[]; messages: number; }

export default function ConsumerGroupsPage() {
    const [partitionCount] = useState(6);
    const [consumers, setConsumers] = useState<Consumer[]>([
        { id: 'C1', partitions: [0, 1], messages: 0 },
        { id: 'C2', partitions: [2, 3], messages: 0 },
        { id: 'C3', partitions: [4, 5], messages: 0 },
    ]);
    const [log, setLog] = useState<string[]>([]);
    const msgId = useRef(0);

    const rebalance = useCallback((consumerList: Consumer[]) => {
        const partitions = Array.from({ length: partitionCount }, (_, i) => i);
        return consumerList.map((c, i) => ({
            ...c,
            partitions: partitions.filter((_, pi) => pi % consumerList.length === i),
        }));
    }, [partitionCount]);

    const produce = useCallback(() => {
        const partition = Math.floor(Math.random() * partitionCount);
        const consumer = consumers.find(c => c.partitions.includes(partition));
        if (consumer) {
            setConsumers(prev => prev.map(c => c.id === consumer.id ? { ...c, messages: c.messages + 1 } : c));
            setLog(prev => [...prev.slice(-15), `MSG #${++msgId.current} → partition ${partition} → ${consumer.id}`]);
        }
    }, [consumers, partitionCount]);

    const addConsumer = useCallback(() => {
        const id = `C${consumers.length + 1}`;
        const newList = rebalance([...consumers, { id, partitions: [], messages: 0 }]);
        setConsumers(newList);
        setLog(prev => [...prev.slice(-15), `${id} joined — rebalanced`]);
    }, [consumers, rebalance]);

    const removeConsumer = useCallback(() => {
        if (consumers.length <= 1) return;
        const removed = consumers[consumers.length - 1];
        const newList = rebalance(consumers.slice(0, -1));
        setConsumers(newList);
        setLog(prev => [...prev.slice(-15), `${removed.id} left — rebalanced`]);
    }, [consumers, rebalance]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">messaging</span>
                <h1>Consumer Groups</h1>
                <p className="subtitle">Partitions are distributed across consumers in a group for parallel processing.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <button onClick={produce} className="sim-button">Produce Message</button>
                <button onClick={addConsumer} className="sim-button">Add Consumer</button>
                <button onClick={removeConsumer} className="sim-button">Remove Consumer</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginBottom: 16 }}>
                {consumers.map(c => (
                    <div key={c.id} className="info-panel" style={{ padding: 8, textAlign: 'center' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 13 }}>{c.id}</div>
                        <div style={{ fontSize: 10, color: 'var(--info)' }}>partitions: [{c.partitions.join(',')}]</div>
                        <div style={{ fontSize: 16, color: 'var(--accent)', marginTop: 4 }}>{c.messages}</div>
                    </div>
                ))}
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
