'use client';

import { useState, useCallback } from 'react';

type Role = 'follower' | 'candidate' | 'leader';

interface Node {
  id: string;
  role: Role;
  term: number;
  log: string[];
  votedFor: string | null;
}

export default function SimplifiedRaftPage() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'N1', role: 'leader', term: 1, log: [], votedFor: 'N1' },
    { id: 'N2', role: 'follower', term: 1, log: [], votedFor: 'N1' },
    { id: 'N3', role: 'follower', term: 1, log: [], votedFor: 'N1' },
  ]);
  const [log, setLog] = useState<string[]>(['N1 elected leader (term 1)']);
  const [entryInput, setEntryInput] = useState('');
  const [commitIndex, setCommitIndex] = useState(0);

  const leader = nodes.find(n => n.role === 'leader');

  const appendEntry = useCallback(() => {
    if (!entryInput.trim()) return;
    const entry = entryInput.trim();

    setNodes(prev => {
      const currentLeader = prev.find(n => n.role === 'leader');
      if (!currentLeader) return prev;

      // Leader appends to all nodes (simplified: instant replication)
      const majority = Math.ceil(prev.length / 2);
      const updated = prev.map(n => ({
        ...n,
        log: [...n.log, entry]
      }));

      setCommitIndex(c => c + 1);
      setLog(prevLog => [
        ...prevLog.slice(-20),
        `Leader ${currentLeader.id} → append "${entry}" → replicated to ${prev.length}/${prev.length} → committed`
      ]);

      return updated;
    });

    setEntryInput('');
  }, [entryInput]);

  const triggerElection = useCallback((candidateId: string) => {
    setNodes(prev => {
      const candidate = prev.find(n => n.id === candidateId);
      if (!candidate || candidate.role === 'leader') return prev;

      const newTerm = Math.max(...prev.map(n => n.term)) + 1;
      const majority = Math.ceil(prev.length / 2);

      setLog(prevLog => [
        ...prevLog.slice(-20),
        `${candidateId} starts election (term ${newTerm}) → wins ${majority}/${prev.length} votes → LEADER`
      ]);

      return prev.map(n => ({
        ...n,
        role: n.id === candidateId ? 'leader' as Role : 'follower' as Role,
        term: newTerm,
        votedFor: candidateId,
      }));
    });
  }, []);

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">consensus</span>
        <h1>Simplified Raft</h1>
        <p className="subtitle">
          Leader-based consensus: elect leader → replicate log entries → commit on majority ACK.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">leader</span>
          <span className="stat-value" style={{ color: 'var(--accent)' }}>
            {leader?.id ?? 'NONE'}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">term</span>
          <span className="stat-value">{nodes[0]?.term}</span>
        </div>
        <div className="stat">
          <span className="stat-label">commit index</span>
          <span className="stat-value">{commitIndex}</span>
        </div>
        <div className="stat">
          <span className="stat-label">log entries</span>
          <span className="stat-value">{leader?.log.length ?? 0}</span>
        </div>
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          {nodes.map(n => (
            <div
              key={n.id}
              onClick={() => n.role !== 'leader' && triggerElection(n.id)}
              style={{
                padding: 14,
                textAlign: 'center',
                borderRadius: 'var(--radius)',
                cursor: n.role !== 'leader' ? 'pointer' : 'default',
                background: n.role === 'leader' ? 'var(--accent-glow)' : 'var(--surface-2)',
                border: `1px solid ${n.role === 'leader' ? 'var(--accent)' : 'var(--border)'}`,
                transition: 'all 0.3s'
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 6 }}>
                {n.role === 'leader' ? '👑' : '👤'}
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-bright)', marginBottom: 4 }}>
                {n.id}
              </div>
              <div style={{
                fontSize: 11,
                color: n.role === 'leader' ? 'var(--accent)' : 'var(--text-dim)',
                marginBottom: 8
              }}>
                {n.role} (term {n.term})
              </div>
              <div style={{
                fontSize: 10,
                color: 'var(--text-dim)',
                maxHeight: 60,
                overflow: 'hidden',
                fontFamily: 'var(--font-mono)'
              }}>
                log: [{n.log.slice(-4).join(', ')}]
              </div>
            </div>
          ))}
        </div>

        {/* Log replication visualization */}
        {leader && leader.log.length > 0 && (
          <div style={{
            padding: 12,
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
              Replicated Log (committed entries):
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {leader.log.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    padding: '4px 8px',
                    background: 'var(--accent-glow)',
                    border: '1px solid var(--accent)',
                    borderRadius: 4,
                    fontSize: 10,
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  [{i}] {entry}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="viz-controls">
        <input
          value={entryInput}
          onChange={e => setEntryInput(e.target.value)}
          placeholder="log entry to append"
          className="sim-input"
          onKeyDown={e => e.key === 'Enter' && appendEntry()}
        />
        <button onClick={appendEntry} className="btn btn-accent" disabled={!leader}>
          Append
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>
          Click followers to trigger election
        </span>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>// event log</h3>
        <div className="log-area">
          {log.map((entry, i) => (
            <div key={i} className="log-entry">
              <span style={{ color: 'var(--text-dim)', marginRight: 8 }}>[{String(i + 1).padStart(2, '0')}]</span>
              {entry}
            </div>
          ))}
        </div>
      </div>

      <div className="info-columns" style={{ marginTop: 16 }}>
        <div className="info-panel">
          <h3>How It Works</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Leader elected by majority vote</li>
            <li>All writes go through leader</li>
            <li>Leader replicates entries to followers</li>
            <li>Entry committed once majority ACK</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Key Properties</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Leader election via randomized timeouts</li>
            <li>Log matching: same index+term = same entry</li>
            <li>Safety: committed entries never lost</li>
            <li>Used in: etcd, CockroachDB, TiKV</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
