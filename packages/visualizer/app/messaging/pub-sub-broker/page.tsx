'use client';

import { useState, useCallback, useRef } from 'react';

interface Sub { id: string; topic: string; messages: string[]; }

export default function PubSubBrokerPage() {
    const [topics] = useState(['orders', 'payments', 'notifications']);
    const [subscribers, setSubscribers] = useState<Sub[]>([
        { id: 'sub-1', topic: 'orders', messages: [] },
        { id: 'sub-2', topic: 'orders', messages: [] },
        { id: 'sub-3', topic: 'payments', messages: [] },
    ]);
    const [log, setLog] = useState<string[]>([]);
    const msgId = useRef(0);

    const publish = useCallback((topic: string) => {
        const payload = `${topic}_${++msgId.current}`;
        setSubscribers(prev => prev.map(s => s.topic === topic ? { ...s, messages: [...s.messages.slice(-5), payload] } : s));
        setLog(prev => [...prev.slice(-15), `PUBLISH "${payload}" → topic "${topic}" → ${subscribers.filter(s => s.topic === topic).length} subscribers`]);
    }, [subscribers]);

    const addSubscriber = useCallback((topic: string) => {
        const id = `sub-${Date.now()}`;
        setSubscribers(prev => [...prev, { id, topic, messages: [] }]);
        setLog(prev => [...prev.slice(-15), `SUBSCRIBE ${id} → topic "${topic}"`]);
    }, []);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">messaging</span>
                <h1>Pub/Sub Broker</h1>
                <p className="subtitle">Publishers emit events to topics. All subscribers on that topic receive the message.</p>
            </div>

            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>Publish to topic:</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {topics.map(t => (
                        <button key={t} onClick={() => publish(t)} className="sim-button">{t}</button>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>Add subscriber:</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {topics.map(t => (
                        <button key={t} onClick={() => addSubscriber(t)} className="sim-button" style={{ fontSize: 10 }}>+ {t}</button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 16 }}>
                {subscribers.map(s => (
                    <div key={s.id} className="info-panel" style={{ padding: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-bright)' }}>{s.id}</div>
                        <div style={{ fontSize: 10, color: 'var(--info)' }}>topic: {s.topic}</div>
                        {s.messages.map((m, i) => <div key={i} style={{ fontSize: 10, color: 'var(--accent)', padding: '1px 0' }}>← {m}</div>)}
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
