'use client';

import { useState, useCallback, useEffect } from 'react';

interface Node {
  id: string;
  priority: number;
  alive: boolean;
  isLeader: boolean;
  lastSeen: number;
}

export default function LeaderElectionPage() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'Node-1', priority: 1, alive: true, isLeader: false, lastSeen: Date.now() },
    { id: 'Node-2', priority: 2, alive: true, isLeader: false, lastSeen: Date.now() },
    { id: 'Node-3', priority: 3, alive: true, isLeader: true, lastSeen: Date.now() },
  ]);
  const [log, setLog] = useState<string[]>([]);
  const [electionCount, setElectionCount] = useState(0);

  const runElection = useCallback(() => {
    setNodes(prev => {
      const aliveNodes = prev.filter(n => n.alive);
      
      if (aliveNodes.length === 0) {
        setLog(prevLog => [...prevLog.slice(-20), '⚠ NO ALIVE NODES — no leader elected']);
        return prev.map(n => ({ ...n, isLeader: false }));
      }

      const leader = aliveNodes.reduce((max, n) => 
        n.priority > max.priority ? n : max, 
        aliveNodes[0]
      );

      setLog(prevLog => [
        ...prevLog.slice(-20), 
        `ELECTION #${electionCount + 1} → ${leader.id} elected (priority=${leader.priority})`
      ]);
      setElectionCount(c => c + 1);

      return prev.map(n => ({
        ...n,
        isLeader: n.id === leader.id && n.alive
      }));
    });
  }, [electionCount]);

  const toggleNode = useCallback((id: string) => {
    setNodes(prev => {
      const node = prev.find(n => n.id === id)!;
      const newAlive = !node.alive;
      
      setLog(prevLog => [
        ...prevLog.slice(-20),
        `${id} → ${newAlive ? '✓ JOINED' : '✗ FAILED'}`
      ]);

      const updated = prev.map(n => 
        n.id === id 
          ? { ...n, alive: newAlive, isLeader: false, lastSeen: Date.now() }
          : n
      );

      // Auto-run election after state update
      setTimeout(() => runElection(), 100);

      return updated;
    });
  }, [runElection]);

  const leader = nodes.find(n => n.isLeader);

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">coordination</span>
        <h1>Leader Election</h1>
        <p className="subtitle">Elect the highest-priority alive node as leader. Bully algorithm simulation.</p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">current leader</span>
          <span className="stat-value" style={{ color: leader ? 'var(--accent)' : 'var(--text-dim)' }}>
            {leader ? leader.id : 'NONE'}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">alive nodes</span>
          <span className="stat-value">{nodes.filter(n => n.alive).length}/{nodes.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">elections</span>
          <span className="stat-value">{electionCount}</span>
        </div>
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {nodes.map(n => (
            <div
              key={n.id}
              onClick={() => toggleNode(n.id)}
              style={{
                padding: 16,
                textAlign: 'center',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                background: !n.alive 
                  ? 'var(--danger-glow)' 
                  : n.isLeader 
                  ? 'var(--accent-glow)' 
                  : 'var(--surface-2)',
                border: `1px solid ${
                  !n.alive 
                    ? 'var(--danger)' 
                    : n.isLeader 
                    ? 'var(--accent)' 
                    : 'var(--border)'
                }`,
                opacity: n.alive ? 1 : 0.6,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>
                {!n.alive ? '💀' : n.isLeader ? '👑' : '👤'}
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-bright)', marginBottom: 4 }}>
                {n.id}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 8 }}>
                priority: {n.priority}
              </div>
              <div style={{
                fontSize: 11,
                color: !n.alive 
                  ? 'var(--danger)' 
                  : n.isLeader 
                  ? 'var(--accent)' 
                  : 'var(--text-dim)'
              }}>
                {!n.alive ? 'dead' : n.isLeader ? 'LEADER' : 'follower'}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 16,
          padding: 12,
          background: 'var(--surface-2)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
            Algorithm: Bully (highest priority wins)
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-bright)' }}>
            Click nodes to toggle alive/dead • Elections run automatically
          </div>
        </div>
      </div>

      <div className="viz-controls">
        <button onClick={runElection} className="btn btn-accent">
          Run Election
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>
          or click nodes to simulate failures
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
            <li>Each node has a priority (higher = more preferred)</li>
            <li>Only alive nodes participate in election</li>
            <li>Node with highest priority becomes leader</li>
            <li>If leader fails, re-election happens automatically</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Distributed coordination (ZooKeeper, etcd)</li>
            <li>Database master election</li>
            <li>Cluster management</li>
            <li>Consensus protocols (Raft, Paxos)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
