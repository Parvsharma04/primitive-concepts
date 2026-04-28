'use client';

import { useState, useCallback } from 'react';

interface Instance {
  id: string;
  host: string;
  healthy: boolean;
}

interface Service {
  name: string;
  instances: Instance[];
}

export default function ServiceDiscoveryPage() {
  const [services] = useState<Service[]>([
    {
      name: 'auth-service',
      instances: [
        { id: 'a1', host: '10.0.1.1:8080', healthy: true },
        { id: 'a2', host: '10.0.1.2:8080', healthy: true },
        { id: 'a3', host: '10.0.1.3:8080', healthy: false }
      ]
    },
    {
      name: 'order-service',
      instances: [
        { id: 'o1', host: '10.0.2.1:8081', healthy: true },
        { id: 'o2', host: '10.0.2.2:8081', healthy: true }
      ]
    },
    {
      name: 'payment-service',
      instances: [
        { id: 'p1', host: '10.0.3.1:8082', healthy: true }
      ]
    }
  ]);
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const discover = useCallback((serviceName: string) => {
    const svc = services.find(s => s.name === serviceName);
    
    if (!svc) {
      setQueryResult(`❌ Service "${serviceName}" not found`);
      setSelectedInstance(null);
      setLog(prev => [...prev.slice(-20), `QUERY "${serviceName}" → NOT FOUND`]);
      return;
    }

    const healthyInstances = svc.instances.filter(i => i.healthy);

    if (healthyInstances.length === 0) {
      setQueryResult(`⚠ No healthy instances for "${serviceName}"`);
      setSelectedInstance(null);
      setLog(prev => [...prev.slice(-20), `QUERY "${serviceName}" → 0/${svc.instances.length} healthy`]);
      return;
    }

    // Random load balancing
    const chosen = healthyInstances[Math.floor(Math.random() * healthyInstances.length)];
    setQueryResult(`✓ ${serviceName} → ${chosen.host}`);
    setSelectedInstance(chosen.id);
    setLog(prev => [
      ...prev.slice(-20),
      `DISCOVER "${serviceName}" → ${chosen.host} (${healthyInstances.length}/${svc.instances.length} available)`
    ]);
  }, [services]);

  const totalInstances = services.reduce((sum, s) => sum + s.instances.length, 0);
  const healthyInstances = services.reduce(
    (sum, s) => sum + s.instances.filter(i => i.healthy).length,
    0
  );

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">coordination</span>
        <h1>Service Discovery</h1>
        <p className="subtitle">
          Query the registry to find healthy instances of a service. Client-side load balancing.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">services</span>
          <span className="stat-value">{services.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">total instances</span>
          <span className="stat-value">{totalInstances}</span>
        </div>
        <div className="stat">
          <span className="stat-label">healthy</span>
          <span className="stat-value" style={{ color: 'var(--accent)' }}>
            {healthyInstances}/{totalInstances}
          </span>
        </div>
      </div>

      <div className="viz-controls" style={{ marginBottom: 16 }}>
        {services.map(s => (
          <button
            key={s.name}
            onClick={() => discover(s.name)}
            className="btn btn-accent"
          >
            Query {s.name}
          </button>
        ))}
      </div>

      {queryResult && (
        <div style={{
          padding: 12,
          background: 'var(--accent-glow)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius)',
          fontSize: 13,
          marginBottom: 16,
          color: 'var(--text-bright)',
          fontFamily: 'var(--font-mono)'
        }}>
          {queryResult}
        </div>
      )}

      <div className="viz-container" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {services.map(s => (
            <div
              key={s.name}
              style={{
                padding: 12,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)'
              }}
            >
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--accent)',
                marginBottom: 8,
                paddingBottom: 8,
                borderBottom: '1px solid var(--border)'
              }}>
                {s.name}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {s.instances.map(inst => (
                  <div
                    key={inst.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 6px',
                      background: inst.id === selectedInstance 
                        ? 'var(--accent-glow)' 
                        : 'transparent',
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    <span style={{ color: inst.healthy ? 'var(--accent)' : 'var(--danger)' }}>
                      {inst.healthy ? '●' : '○'}
                    </span>
                    <span style={{ color: 'var(--text-dim)', flex: 1 }}>
                      {inst.host}
                    </span>
                    {inst.id === selectedInstance && (
                      <span style={{ color: 'var(--accent)', fontSize: 10 }}>← selected</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="info-panel">
        <h3>// discovery log</h3>
        <div className="log-area">
          {log.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
              No queries yet
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
            <li>Services register instances in a central registry</li>
            <li>Clients query to find healthy instances</li>
            <li>Random selection provides simple load balancing</li>
            <li>Unhealthy instances are filtered out automatically</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Microservices architecture (Consul, Eureka)</li>
            <li>Kubernetes service discovery</li>
            <li>DNS-based discovery (SRV records)</li>
            <li>Client-side load balancing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
