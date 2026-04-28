'use client';

import { useState, useCallback, useRef } from 'react';

interface Service {
  id: string;
  name: string;
  host: string;
  port: number;
  healthy: boolean;
  registeredAt: number;
}

export default function ServiceRegistryPage() {
  const [services, setServices] = useState<Service[]>([
    { id: 'svc-1', name: 'auth-service', host: '10.0.1.1', port: 8080, healthy: true, registeredAt: Date.now() - 120000 },
    { id: 'svc-2', name: 'order-service', host: '10.0.1.2', port: 8081, healthy: true, registeredAt: Date.now() - 90000 },
    { id: 'svc-3', name: 'payment-service', host: '10.0.1.3', port: 8082, healthy: false, registeredAt: Date.now() - 60000 },
  ]);
  const [log, setLog] = useState<string[]>([]);
  const nextId = useRef(4);

  const serviceNames = [
    'user-service',
    'inventory-service',
    'notification-service',
    'analytics-service',
    'search-service',
    'cache-service'
  ];

  const register = useCallback(() => {
    const name = serviceNames[Math.floor(Math.random() * serviceNames.length)];
    const id = `svc-${nextId.current}`;
    const host = `10.0.${Math.floor(nextId.current / 256)}.${nextId.current % 256}`;
    const port = 8080 + nextId.current;

    const newService: Service = {
      id,
      name,
      host,
      port,
      healthy: true,
      registeredAt: Date.now()
    };

    nextId.current++;
    setServices(prev => [...prev, newService]);
    setLog(prev => [...prev.slice(-20), `✓ REGISTER: ${name} at ${host}:${port}`]);
  }, []);

  const deregister = useCallback((id: string) => {
    setServices(prev => {
      const svc = prev.find(s => s.id === id);
      if (svc) {
        setLog(prevLog => [...prevLog.slice(-20), `✗ DEREGISTER: ${svc.name} (${svc.host}:${svc.port})`]);
      }
      return prev.filter(s => s.id !== id);
    });
  }, []);

  const toggleHealth = useCallback((id: string) => {
    setServices(prev => prev.map(s => {
      if (s.id !== id) return s;
      const newHealthy = !s.healthy;
      setLog(prevLog => [
        ...prevLog.slice(-20),
        `${newHealthy ? '✓' : '⚠'} ${s.name} → ${newHealthy ? 'HEALTHY' : 'UNHEALTHY'}`
      ]);
      return { ...s, healthy: newHealthy };
    }));
  }, []);

  const healthyCount = services.filter(s => s.healthy).length;

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">coordination</span>
        <h1>Service Registry</h1>
        <p className="subtitle">
          Central catalog where services register their network endpoints for dynamic discovery.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">registered</span>
          <span className="stat-value">{services.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">healthy</span>
          <span className="stat-value" style={{ color: 'var(--accent)' }}>
            {healthyCount}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">unhealthy</span>
          <span className="stat-value" style={{ color: 'var(--danger)' }}>
            {services.length - healthyCount}
          </span>
        </div>
      </div>

      <div className="viz-controls" style={{ marginBottom: 16 }}>
        <button onClick={register} className="btn btn-accent">
          Register Service
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>
          Randomly registers a new service instance
        </span>
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        {services.length === 0 ? (
          <div style={{
            padding: 40,
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: 12
          }}>
            No services registered yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {services.map(s => {
              const age = Math.floor((Date.now() - s.registeredAt) / 1000);
              
              return (
                <div
                  key={s.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr auto auto auto',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    background: 'var(--surface-2)',
                    border: `1px solid ${s.healthy ? 'var(--accent)' : 'var(--danger)'}`,
                    borderRadius: 'var(--radius)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontSize: 14,
                      color: s.healthy ? 'var(--accent)' : 'var(--danger)'
                    }}>
                      {s.healthy ? '●' : '○'}
                    </span>
                  </div>

                  <div>
                    <div style={{
                      color: 'var(--text-bright)',
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 2
                    }}>
                      {s.name}
                    </div>
                    <div style={{
                      color: 'var(--text-dim)',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {s.host}:{s.port}
                    </div>
                  </div>

                  <div style={{
                    fontSize: 10,
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {age}s ago
                  </div>

                  <button
                    onClick={() => toggleHealth(s.id)}
                    className="btn"
                    style={{
                      fontSize: 10,
                      padding: '4px 10px',
                      background: 'var(--warning-glow)',
                      borderColor: 'var(--warning)',
                      color: 'var(--warning)'
                    }}
                  >
                    toggle health
                  </button>

                  <button
                    onClick={() => deregister(s.id)}
                    className="btn"
                    style={{
                      fontSize: 10,
                      padding: '4px 10px',
                      background: 'var(--danger-glow)',
                      borderColor: 'var(--danger)',
                      color: 'var(--danger)'
                    }}
                  >
                    ✗ remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="info-panel">
        <h3>// registry events</h3>
        <div className="log-area">
          {log.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
              No events yet
            </div>
          ) : (
            log.map((entry, i) => (
              <div key={i} className="log-entry">
                <span style={{ color: 'var(--text-dim)', marginRight: 8 }}>
                  [{String(i + 1).padStart(2, '0')}]
                </span>
                {entry}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="info-columns" style={{ marginTop: 16 }}>
        <div className="info-panel">
          <h3>How It Works</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Services register on startup with host:port</li>
            <li>Registry maintains catalog of all instances</li>
            <li>Health checks monitor service availability</li>
            <li>Clients query registry for service locations</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Consul, Eureka, ZooKeeper, etcd</li>
            <li>Kubernetes service mesh</li>
            <li>Dynamic scaling and deployment</li>
            <li>Service-to-service communication</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
