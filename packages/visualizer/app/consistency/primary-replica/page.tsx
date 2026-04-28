'use client';

import { useState, useCallback, useEffect } from 'react';

interface Replica {
  id: string;
  data: string;
  version: number;
  synced: boolean;
  syncing: boolean;
}

export default function PrimaryReplicaPage() {
  const [primary, setPrimary] = useState({ data: 'initial_value', version: 0 });
  const [replicas, setReplicas] = useState<Replica[]>([
    { id: 'Replica-1', data: 'initial_value', version: 0, synced: true, syncing: false },
    { id: 'Replica-2', data: 'initial_value', version: 0, synced: true, syncing: false },
    { id: 'Replica-3', data: 'initial_value', version: 0, synced: true, syncing: false },
  ]);
  const [log, setLog] = useState<string[]>([]);
  const [writeCount, setWriteCount] = useState(0);

  const write = useCallback(() => {
    const newVersion = primary.version + 1;
    const newData = `data_v${newVersion}`;

    setPrimary({ data: newData, version: newVersion });
    setReplicas(prev => prev.map(r => ({ ...r, synced: false, syncing: false })));
    setLog(prev => [
      ...prev.slice(-20),
      `WRITE → primary: "${newData}" (v${newVersion}) — replicas now stale`
    ]);
    setWriteCount(c => c + 1);

    // Simulate async replication with staggered delays
    const delays = [500, 1000, 1500];
    replicas.forEach((r, i) => {
      setTimeout(() => {
        setReplicas(prevReps => prevReps.map(rep =>
          rep.id === r.id ? { ...rep, syncing: true } : rep
        ));
      }, delays[i] - 200);

      setTimeout(() => {
        setReplicas(prevReps => prevReps.map(rep =>
          rep.id === r.id
            ? { ...rep, data: newData, version: newVersion, synced: true, syncing: false }
            : rep
        ));
        setLog(prevLog => [
          ...prevLog.slice(-20),
          `REPLICATE → ${r.id} synced to v${newVersion}`
        ]);
      }, delays[i]);
    });
  }, [primary.version, replicas]);

  const read = useCallback((replicaId: string) => {
    setReplicas(prev => prev.map(r => {
      if (r.id === replicaId) {
        const staleness = primary.version - r.version;
        setLog(prevLog => [
          ...prevLog.slice(-20),
          `READ ${replicaId} → "${r.data}" (v${r.version}) ${
            r.synced ? '✓ fresh' : `⚠ stale by ${staleness} version(s)`
          }`
        ]);
      }
      return r;
    }));
  }, [primary.version]);

  const syncedCount = replicas.filter(r => r.synced).length;

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">consistency</span>
        <h1>Primary-Replica Replication</h1>
        <p className="subtitle">
          Writes go to primary, then replicate asynchronously. Reads from replicas may be stale.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">primary version</span>
          <span className="stat-value">{primary.version}</span>
        </div>
        <div className="stat">
          <span className="stat-label">writes</span>
          <span className="stat-value">{writeCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">synced replicas</span>
          <span className="stat-value" style={{ color: syncedCount === 3 ? 'var(--accent)' : 'var(--warning)' }}>
            {syncedCount}/{replicas.length}
          </span>
        </div>
      </div>

      <div className="viz-controls" style={{ marginBottom: 16 }}>
        <button onClick={write} className="btn btn-accent">
          Write to Primary
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>
          Increments version and replicates asynchronously
        </span>
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        <div style={{
          marginBottom: 16,
          padding: 16,
          background: 'var(--accent-glow)',
          border: '2px solid var(--accent)',
          borderRadius: 'var(--radius)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--accent)',
            marginBottom: 8,
            letterSpacing: 1
          }}>
            PRIMARY
          </div>
          <div style={{
            fontSize: 16,
            color: 'var(--text-bright)',
            fontFamily: 'var(--font-mono)',
            marginBottom: 4
          }}>
            {primary.data}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            version {primary.version}
          </div>
        </div>

        <div style={{
          fontSize: 11,
          color: 'var(--text-dim)',
          marginBottom: 8,
          textAlign: 'center'
        }}>
          ↓ asynchronous replication ↓
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {replicas.map(r => (
            <div
              key={r.id}
              onClick={() => read(r.id)}
              style={{
                padding: 14,
                textAlign: 'center',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                background: r.syncing 
                  ? 'var(--info-glow)' 
                  : r.synced 
                  ? 'var(--surface-2)' 
                  : 'var(--warning-glow)',
                border: `1px solid ${
                  r.syncing 
                    ? 'var(--info)' 
                    : r.synced 
                    ? 'var(--border)' 
                    : 'var(--warning)'
                }`,
                transition: 'all 0.3s'
              }}
            >
              <div style={{
                fontWeight: 600,
                color: 'var(--text-bright)',
                fontSize: 12,
                marginBottom: 8
              }}>
                {r.id}
              </div>
              <div style={{
                fontSize: 13,
                color: 'var(--text-dim)',
                fontFamily: 'var(--font-mono)',
                marginBottom: 6
              }}>
                {r.data}
              </div>
              <div style={{
                fontSize: 10,
                color: 'var(--text-dim)',
                marginBottom: 8
              }}>
                v{r.version}
                {primary.version > r.version && (
                  <span style={{ color: 'var(--warning)', marginLeft: 4 }}>
                    (−{primary.version - r.version})
                  </span>
                )}
              </div>
              <div style={{
                fontSize: 10,
                color: r.syncing 
                  ? 'var(--info)' 
                  : r.synced 
                  ? 'var(--accent)' 
                  : 'var(--warning)'
              }}>
                {r.syncing ? '⏳ syncing...' : r.synced ? '✓ synced' : '⚠ stale'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 16 }}>
        Click a replica to read from it
      </p>

      <div className="info-panel">
        <h3>// replication log</h3>
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
            <li>All writes go to designated primary node</li>
            <li>Primary replicates changes to replicas asynchronously</li>
            <li>Reads can happen from any replica</li>
            <li>Replica reads may be stale (eventual consistency)</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>MySQL/PostgreSQL read replicas</li>
            <li>MongoDB replica sets</li>
            <li>Redis replication</li>
            <li>Read-heavy workloads with stale-read tolerance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
