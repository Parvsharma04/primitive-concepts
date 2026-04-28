'use client';

import { useState, useCallback, useRef } from 'react';

interface Service { id: string; name: string; host: string; port: number; healthy: boolean; registeredAt: number; }

export default function ServiceRegistryPage() {
    const [services, setServices] = useState<Service[]>([
        { id: 'svc-1', name: 'auth-service', host: '10.0.1.1', port: 8080, healthy: true, registeredAt: Date.now() },
        { id: 'svc-2', name: 'order-service', host: '10.0.1.2', port: 8081, healthy: true, registeredAt: Date.now() },
    ]);
    const [log, setLog] = useState<string[]>([]);
    const nextId = useRef(3);

    const register = useCallback(() => {
        const names = ['payment-service', 'user-service', 'inventory-service', 'notification-service'];
        const name = names[Math.floor(Math.random() * names.length)];
        const svc: Service = { id: `svc-${nextId.current++}`, name, host: `10.0.1.${nextId.current}`, port: 8080 + nextId.current, healthy: true, registeredAt: Date.now() };
        setServices(prev => [...prev, svc]);
        setLog(prev => [...prev.slice(-15), `REGISTER: ${svc.name} at ${svc.host}:${svc.port}`]);
    }, []);

    const deregister = useCallback((id: string) => {
        const svc = services.find(s => s.id === id);
        setServices(prev => prev.filter(s => s.id !== id));
        if (svc) setLog(prev => [...prev.slice(-15), `DEREGISTER: ${svc.name}`]);
    }, [services]);

    const toggleHealth = useCallback((id: string) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, healthy: !s.healthy } : s));
    }, []);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">coordination</span>
                <h1>Service Registry</h1>
                <p className="subtitle">Central catalog where services register their endpoints for dynamic discovery.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={register} className="sim-button">Register Service</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {services.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--surface-2)', border: `1px solid ${s.healthy ? 'var(--accent)' : 'var(--danger)'}`, borderRadius: 'var(--radius)' }}>
                        <span style={{ color: s.healthy ? 'var(--accent)' : 'var(--danger)', fontSize: 14 }}>{s.healthy ? '●' : '○'}</span>
                        <span style={{ flex: 1, color: 'var(--text-bright)', fontSize: 12 }}>{s.name}</span>
                        <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{s.host}:{s.port}</span>
                        <button onClick={() => toggleHealth(s.id)} style={{ background: 'none', border: 'none', color: 'var(--warning)', cursor: 'pointer', fontSize: 10 }}>toggle</button>
                        <button onClick={() => deregister(s.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 10 }}>✗</button>
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
