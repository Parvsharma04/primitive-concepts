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
    const [events, setEvents] = useState<{ id: number; msg: string; type: 'pub' | 'sub' | 'info' }[]>([]);
    const [lastPublish, setLastPublish] = useState<{ topic: string; payload: string } | null>(null);
    const msgId = useRef(0);
    const eventId = useRef(0);

    const addEvent = useCallback((msg: string, type: 'pub' | 'sub' | 'info') => {
        setEvents(prev => [...prev.slice(-20), { id: eventId.current++, msg, type }]);
    }, []);

    const publish = useCallback((topic: string) => {
        const payload = `${topic}_${++msgId.current}`;
        const count = subscribers.filter(s => s.topic === topic).length;
        setSubscribers(prev => prev.map(s => s.topic === topic ? { ...s, messages: [...s.messages.slice(-6), payload] } : s));
        setLastPublish({ topic, payload });
        addEvent(`PUBLISH "${payload}" → topic "${topic}" → ${count} subscriber(s)`, 'pub');
    }, [subscribers, addEvent]);

    const addSubscriber = useCallback((topic: string) => {
        const id = `sub-${subscribers.length + 1}`;
        setSubscribers(prev => [...prev, { id, topic, messages: [] }]);
        addEvent(`SUBSCRIBE ${id} → topic "${topic}"`, 'sub');
    }, [subscribers.length, addEvent]);

    const removeSubscriber = useCallback((id: string) => {
        setSubscribers(prev => prev.filter(s => s.id !== id));
        addEvent(`UNSUBSCRIBE ${id}`, 'info');
    }, [addEvent]);

    const reset = () => {
        setSubscribers(prev => prev.map(s => ({ ...s, messages: [] })));
        setEvents([]);
        setLastPublish(null);
    };

    const topicColors: Record<string, string> = { orders: 'var(--accent)', payments: 'var(--info)', notifications: 'var(--warning)' };

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">messaging</span>
                <h1>Pub/Sub Broker</h1>
                <p className="subtitle">Publishers emit events to topics — all subscribers on that topic receive a copy of the message</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Topics</span>
                    <span className="stat-value">{topics.length}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Subscribers</span>
                    <span className="stat-value accent">{subscribers.length}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Messages Sent</span>
                    <span className="stat-value warning">{msgId.current}</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    {topics.map(t => (
                        <button key={t} onClick={() => publish(t)} className="btn btn-accent" style={{ borderColor: topicColors[t], color: topicColors[t] }}>
                            Publish → {t}
                        </button>
                    ))}
                    <button onClick={reset} className="btn" style={{ marginLeft: 'auto' }}>Reset</button>
                </div>

                {/* Flow diagram: Publisher → Broker → Subscribers */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '20px 0', marginBottom: 16 }}>
                    <div style={{ padding: '12px 16px', borderRadius: 'var(--radius)', border: '1.5px solid var(--warning)', background: 'var(--warning-glow)', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Publisher</div>
                        <div style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600, marginTop: 2 }}>
                            {lastPublish ? lastPublish.payload : 'idle'}
                        </div>
                    </div>
                    <span style={{ fontSize: 18, color: lastPublish ? 'var(--accent)' : 'var(--border-bright)' }}>→</span>
                    <div style={{ padding: '12px 16px', borderRadius: 'var(--radius)', border: '1.5px solid var(--info)', background: 'var(--info-glow)', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Broker</div>
                        <div style={{ fontSize: 11, color: 'var(--info)', fontWeight: 600, marginTop: 2 }}>
                            {lastPublish ? `topic: ${lastPublish.topic}` : `${topics.length} topics`}
                        </div>
                    </div>
                    <span style={{ fontSize: 18, color: lastPublish ? 'var(--accent)' : 'var(--border-bright)' }}>→</span>
                    <div style={{ padding: '12px 16px', borderRadius: 'var(--radius)', border: '1.5px solid var(--accent)', background: 'var(--accent-glow)', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Subscribers</div>
                        <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 2 }}>
                            {lastPublish ? `${subscribers.filter(s => s.topic === lastPublish.topic).length} received` : `${subscribers.length} total`}
                        </div>
                    </div>
                </div>

                {/* Topic-grouped subscribers */}
                {topics.map(topic => {
                    const topicSubs = subscribers.filter(s => s.topic === topic);
                    return (
                        <div key={topic} style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: topicColors[topic] }}>topic: {topic}</span>
                                <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>({topicSubs.length} subscribers)</span>
                                <button onClick={() => addSubscriber(topic)} className="btn" style={{ padding: '2px 8px', fontSize: 9 }}>+ subscriber</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                                {topicSubs.map(s => (
                                    <div key={s.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-bright)' }}>{s.id}</span>
                                            <button onClick={() => removeSubscriber(s.id)} className="btn btn-danger" style={{ padding: '1px 5px', fontSize: 8 }}>✗</button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {s.messages.length === 0 && <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>no messages</span>}
                                            {s.messages.slice(-4).map((m, i) => (
                                                <span key={i} style={{ fontSize: 9, color: topicColors[topic] }}>← {m}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// event log</h3>
                    <div className="log-area">
                        {events.length === 0 && <div className="log-entry">No events yet.</div>}
                        {events.slice(-12).reverse().map(e => (
                            <div key={e.id} className={`log-entry ${e.type === 'pub' ? 'allowed' : ''}`}>{e.msg}</div>
                        ))}
                    </div>
                </div>
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>Publishers send to a named topic</li>
                        <li>Broker fans out to all topic subscribers</li>
                        <li>Subscribers are decoupled from publishers</li>
                        <li>New subscribers get future messages only</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// trade-offs</h3>
                    <ul>
                        <li>Loose coupling — publishers don&apos;t know consumers</li>
                        <li>Easy to add new subscribers dynamically</li>
                        <li className="con">No replay — missed messages are gone</li>
                        <li className="con">Ordering not guaranteed across subscribers</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
