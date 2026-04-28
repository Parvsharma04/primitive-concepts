'use client';

import { useState, useCallback } from 'react';

interface Instance { id: string; host: string; healthy: boolean; }
interface Service { name: string; instances: Instance[]; }

export default function ServiceDiscoveryPage() {
    const [services] = useState<Service[]>([
        { name: 'auth-service', instances: [{ id: 'a1', host: '10.0.1.1:8080', healthy: true }, { id: 'a2', host: '10.0.1.2:8080', healthy: true }, { id: 'a3', host: '10.0.1.3:8080', healthy: false }] },
        { name: 'order-service', instances: [{ id: 'o1', host: '10.0.2.1:8081', healthy: true }, { id: 'o2', host: '10.0.2.2:8081', healthy: true }] },
    ]);
    const [queryResult, setQueryResult] = useState<string | null>(null);
    const [log, setLog] = useState<string[]>([]);

    const discover = useCallback((serviceName: string) => {
        const svc = services.find(s => s.name === serviceName);
        if (!svc) { setQueryResult('Service not found'); return; }
        const healthy = svc.instances.filter(i => i.healthy);
        if (healthy.length === 0) { setQueryResult('No healthy instances'); setLog(prev => [...prev.slice(-15), `DISCOVER "${serviceName}" → no healthy instances!`]); return; }
        const chosen = healthy[Math.floor(Math.random() * healthy.length)];
        setQueryResult(`${serviceName} → ${chosen.host}`);
        setLog(prev => [...prev.slice(-15), `DISCOVER "${serviceName}" → ${chosen.host} (${healthy.length} healthy)`]);
    }, [services]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">coordination</span>
                <h1>Service Discovery</h1>
                <p className="subtitle">Query the registry to find healthy instances of a service.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {services.map(s => (
                    <button key={s.name} onClick={() => discover(s.name)} className="sim-button">Discover {s.name}</button>
                ))}
            </div>

            {queryResult && <div style={{ padding: '8px 12px', background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', fontSize: 12, marginBottom: 16, color: 'var(--accent)' }}>{queryResult}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {services.map(s => (
                    <div key={s.name} className="info-panel" style={{ padding: 8 }}>
                        <h3 style={{ fontSize: 11 }}>// {s.name}</h3>
                        {s.instances.map(i => (
                            <div key={i.id} style={{ fontSize: 11, padding: '2px 0', color: i.healthy ? 'var(--accent)' : 'var(--danger)' }}>
                                {i.healthy ? '●' : '○'} {i.host}
                            </div>
                        ))}
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
