'use client';

import { useState, useEffect, useCallback } from 'react';

interface Node {
  id: string;
  lastHeartbeat: number;
  alive: boolean;
  paused: boolean;
}

const TIMEOUT_MS = 3000;
const HEARTBEAT_INTERVAL = 1000;

export default function HeartbeatMonitorPage() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'Node-A', lastHeartbeat: Date.now(), alive: true, paused: false },
    { id: 'Node-B', lastHeartbeat: Date.now(), alive: true, paused: false },
    { id: 'Node-C', lastHeartbeat: Date.now(), alive: true, paused: false },
  ]);
  const [log, setLog] = useState<string[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      setNodes(prev => prev.map(n => {
        // Send heartbeat if not paused and alive
        if (!n.paused && n.alive) {
          return { ...n, lastHeartbeat: currentTime };
        }

        // Check for timeout if paused and still marked alive
        if (n.paused && n.alive && currentTime - n.lastHeartbeat > TIMEOUT_MS) {
          setLog(prevLog => [
            ...prevLog.slice(-20),
            `⚠ ${n.id} TIMEOUT (${Math.round((currentTime - n.lastHeartbeat) / 1000)}s) — marked DEAD`
          ]);
          return { ...n, alive: false };
        }

        return n;
      }));
    }, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const togglePause = useCallback((id: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id !== id) return n;

      const newPaused = !n.paused;
      const currentTime = Date.now();

      setLog(prevLog => [
        ...prevLog.slice(-20),
        `${id} → ${newPaused ? '⏸ PAUSED (will timeout in 3s)' : '▶ RESUMED heartbeats'}`
      ]);

      return {
        ...n,
        paused: newPaused,
        alive: newPaused ? n.alive : true, // Revive if resuming
        lastHeartbeat: currentTime
      };
    }));
  }, []);

  const reset = useCallback(() => {
    const currentTime = Date.now();
    setNodes(prev => prev.map(n => ({
      ...n,
      alive: true,
      paused: false,
      lastHeartbeat: currentTime
    })));
    setLog([]);
  }, []);

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">coordination</span>
        <h1>Heartbeat Monitor</h1>
        <p className="subtitle">
          Nodes send periodic heartbeats every {HEARTBEAT_INTERVAL / 1000}s. 
          Missing heartbeats for {TIMEOUT_MS / 1000}s marks a node as dead.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">alive nodes</span>
          <span className="stat-value">{nodes.filter(n => n.alive).length}/{nodes.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">paused nodes</span>
          <span className="stat-value">{nodes.filter(n => n.paused).length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">timeout threshold</span>
          <span className="stat-value">{TIMEOUT_MS / 1000}s</span>
        </div>
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {nodes.map(n => {
            const timeSinceHeartbeat = now - n.lastHeartbeat;
            const timeoutProgress = Math.min(timeSinceHeartbeat / TIMEOUT_MS, 1);

            return (
              <div
                key={n.id}
                onClick={() => togglePause(n.id)}
                style={{
                  padding: 16,
                  textAlign: 'center',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  background: !n.alive 
                    ? 'var(--danger-glow)' 
                    : n.paused 
                    ? 'var(--warning-glow)' 
                    : 'var(--surface-2)',
                  border: `1px solid ${
                    !n.alive 
                      ? 'var(--danger)' 
                      : n.paused 
                      ? 'var(--warning)' 
                      : 'var(--accent)'
                  }`,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 8 }}>
                  {!n.alive ? '💀' : n.paused ? '⏸' : '💚'}
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-bright)', marginBottom: 4 }}>
                  {n.id}
                </div>
                <div style={{
                  fontSize: 11,
                  color: !n.alive 
                    ? 'var(--danger)' 
                    : n.paused 
                    ? 'var(--warning)' 
                    : 'var(--accent)',
                  marginBottom: 8
                }}>
                  {!n.alive ? 'DEAD' : n.paused ? 'heartbeats paused' : 'sending heartbeats'}
                </div>

                {n.paused && n.alive && (
                  <>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>
                      timeout in {Math.max(0, Math.ceil((TIMEOUT_MS - timeSinceHeartbeat) / 1000))}s
                    </div>
                    <div style={{
                      height: 4,
                      background: 'var(--border)',
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${timeoutProgress * 100}%`,
                        background: timeoutProgress > 0.8 
                          ? 'var(--danger)' 
                          : 'var(--warning)',
                        transition: 'width 0.5s linear'
                      }} />
                    </div>
                  </>
                )}

                {!n.paused && n.alive && (
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                    last: {Math.round(timeSinceHeartbeat / 1000)}s ago
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="viz-controls">
        <button onClick={reset} className="btn">
          Reset All
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>
          Click a node to pause/resume heartbeats
        </span>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>// event log</h3>
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
            <li>Nodes send periodic heartbeat messages</li>
            <li>Monitor tracks last heartbeat timestamp</li>
            <li>If no heartbeat within timeout window → dead</li>
            <li>Used for failure detection in distributed systems</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Cluster membership (Cassandra, Kafka)</li>
            <li>Health checking (Consul, etcd)</li>
            <li>Session management</li>
            <li>Load balancer health probes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
