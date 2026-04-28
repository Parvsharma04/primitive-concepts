'use client';

import { useState, useCallback } from 'react';

interface Node {
  id: string;
  hasLock: boolean;
  waiting: boolean;
  requestedAt?: number;
}

export default function DistributedLockPage() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'Node-A', hasLock: false, waiting: false },
    { id: 'Node-B', hasLock: false, waiting: false },
    { id: 'Node-C', hasLock: false, waiting: false },
  ]);
  const [lockHolder, setLockHolder] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [queue, setQueue] = useState<string[]>([]);

  const acquire = useCallback((nodeId: string) => {
    setNodes(prev => {
      const current = lockHolder;
      
      if (current) {
        // Lock is held - add to waiting queue
        setQueue(prevQ => [...prevQ, nodeId]);
        setLog(prevLog => [...prevLog.slice(-20), `${nodeId} → BLOCKED (lock held by ${current})`]);
        return prev.map(n => 
          n.id === nodeId ? { ...n, waiting: true, requestedAt: Date.now() } : n
        );
      } else {
        // Lock is free - grant immediately
        setLockHolder(nodeId);
        setLog(prevLog => [...prevLog.slice(-20), `${nodeId} → ACQUIRED lock ✓`]);
        return prev.map(n => 
          n.id === nodeId ? { ...n, hasLock: true, waiting: false } : n
        );
      }
    });
  }, [lockHolder]);

  const release = useCallback(() => {
    const current = lockHolder;
    if (!current) return;

    setQueue(prevQ => {
      const waitingNode = prevQ[0];
      
      if (waitingNode) {
        // Transfer lock to next in queue
        setLockHolder(waitingNode);
        setLog(prevLog => [...prevLog.slice(-20), `${current} RELEASED → ${waitingNode} ACQUIRED ✓`]);
        setNodes(prevNodes => prevNodes.map(n => {
          if (n.id === current) return { ...n, hasLock: false };
          if (n.id === waitingNode) return { ...n, hasLock: true, waiting: false };
          return n;
        }));
      } else {
        // No one waiting - lock becomes free
        setLockHolder(null);
        setLog(prevLog => [...prevLog.slice(-20), `${current} RELEASED → lock free`]);
        setNodes(prevNodes => prevNodes.map(n => 
          n.id === current ? { ...n, hasLock: false } : n
        ));
      }

      return prevQ.slice(1);
    });
  }, [lockHolder]);

  const reset = useCallback(() => {
    setNodes(prev => prev.map(n => ({ ...n, hasLock: false, waiting: false })));
    setLockHolder(null);
    setQueue([]);
    setLog([]);
  }, []);

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">coordination</span>
        <h1>Distributed Lock</h1>
        <p className="subtitle">Mutual exclusion across nodes — only one can hold the lock at a time. Others queue.</p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">lock status</span>
          <span className="stat-value" style={{ color: lockHolder ? 'var(--accent)' : 'var(--text-dim)' }}>
            {lockHolder ? `held by ${lockHolder}` : 'FREE'}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">queue length</span>
          <span className="stat-value">{queue.length}</span>
        </div>
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {nodes.map(n => (
            <div
              key={n.id}
              onClick={() => acquire(n.id)}
              style={{
                padding: 16,
                textAlign: 'center',
                borderRadius: 'var(--radius)',
                background: n.hasLock 
                  ? 'var(--accent-glow)' 
                  : n.waiting 
                  ? 'var(--warning-glow)' 
                  : 'var(--surface-2)',
                border: `1px solid ${
                  n.hasLock 
                    ? 'var(--accent)' 
                    : n.waiting 
                    ? 'var(--warning)' 
                    : 'var(--border)'
                }`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ 
                fontSize: 18, 
                marginBottom: 8,
                opacity: n.hasLock ? 1 : n.waiting ? 0.7 : 0.5 
              }}>
                {n.hasLock ? '🔒' : n.waiting ? '⏳' : '⭕'}
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-bright)', marginBottom: 4 }}>
                {n.id}
              </div>
              <div style={{ 
                fontSize: 11, 
                color: n.hasLock 
                  ? 'var(--accent)' 
                  : n.waiting 
                  ? 'var(--warning)' 
                  : 'var(--text-dim)' 
              }}>
                {n.hasLock ? 'holding lock' : n.waiting ? 'in queue' : 'idle'}
              </div>
            </div>
          ))}
        </div>

        {queue.length > 0 && (
          <div style={{ 
            marginTop: 16, 
            padding: 12, 
            background: 'var(--surface-2)', 
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
              waiting queue (FIFO):
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {queue.map((nodeId, idx) => (
                <div
                  key={`${nodeId}-${idx}`}
                  style={{
                    padding: '4px 10px',
                    background: 'var(--warning-glow)',
                    border: '1px solid var(--warning)',
                    borderRadius: 4,
                    fontSize: 11,
                    color: 'var(--warning)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  #{idx + 1} {nodeId}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="viz-controls">
        <button onClick={release} className="btn btn-accent" disabled={!lockHolder}>
          Release Lock
        </button>
        <button onClick={reset} className="btn">
          Reset
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>
          Click a node to request lock
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
            <li>Lock can be held by at most one node</li>
            <li>Other nodes requesting the lock are queued (FIFO)</li>
            <li>On release, lock transfers to next waiting node</li>
            <li>Prevents race conditions in distributed systems</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Leader election coordination</li>
            <li>Critical section protection</li>
            <li>Distributed transaction control</li>
            <li>Resource access serialization</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
