'use client';

import { useState, useCallback } from 'react';

interface Node {
  id: string;
  value: string;
  version: number;
  participated: boolean;
}

export default function ReadWriteQuorumPage() {
  const N = 5;
  const [W, setW] = useState(3);
  const [R, setR] = useState(3);
  const [nodes, setNodes] = useState<Node[]>(
    Array.from({ length: 5 }, (_, i) => ({
      id: `N${i + 1}`,
      value: 'v0',
      version: 0,
      participated: false
    }))
  );
  const [log, setLog] = useState<string[]>([]);
  const [writeHighlight, setWriteHighlight] = useState<number[]>([]);
  const [readHighlight, setReadHighlight] = useState<number[]>([]);

  const strongConsistency = W + R > N;

  const write = useCallback(() => {
    const newVersion = Math.max(...nodes.map(n => n.version)) + 1;
    const newValue = `v${newVersion}`;

    // Randomly select W nodes
    const indices = Array.from({ length: N }, (_, i) => i);
    const shuffled = indices.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, W);

    setWriteHighlight(selected);
    setReadHighlight([]);

    setNodes(prev => prev.map((n, i) =>
      selected.includes(i)
        ? { ...n, value: newValue, version: newVersion, participated: true }
        : { ...n, participated: false }
    ));

    setLog(prev => [
      ...prev.slice(-20),
      `WRITE "${newValue}" → nodes [${selected.map(i => `N${i + 1}`).join(', ')}] (W=${W}/${N})`
    ]);
  }, [N, W, nodes]);

  const read = useCallback(() => {
    // Randomly select R nodes
    const indices = Array.from({ length: N }, (_, i) => i);
    const shuffled = indices.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, R);

    setReadHighlight(selected);
    setWriteHighlight([]);

    const readNodes = selected.map(i => nodes[i]);
    const latest = readNodes.reduce((max, n) => (n.version > max.version ? n : max), readNodes[0]);

    setNodes(prev => prev.map((n, i) => ({ ...n, participated: selected.includes(i) })));

    setLog(prev => [
      ...prev.slice(-20),
      `READ from [${selected.map(i => `N${i + 1}`).join(', ')}] → latest: "${latest.value}" v${latest.version} (R=${R}/${N})`
    ]);
  }, [N, R, nodes]);

  const reset = useCallback(() => {
    setNodes(
      Array.from({ length: 5 }, (_, i) => ({
        id: `N${i + 1}`,
        value: 'v0',
        version: 0,
        participated: false
      }))
    );
    setLog([]);
    setWriteHighlight([]);
    setReadHighlight([]);
  }, []);

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">consistency</span>
        <h1>Read/Write Quorum</h1>
        <p className="subtitle">
          N={N}, W={W}, R={R} •{' '}
          {strongConsistency ? (
            <span style={{ color: 'var(--accent)' }}>✓ Strong consistency (W+R &gt; N)</span>
          ) : (
            <span style={{ color: 'var(--warning)' }}>⚠ Eventual consistency (W+R ≤ N)</span>
          )}
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">total nodes (N)</span>
          <span className="stat-value">{N}</span>
        </div>
        <div className="stat">
          <span className="stat-label">write quorum (W)</span>
          <span className="stat-value">{W}</span>
        </div>
        <div className="stat">
          <span className="stat-label">read quorum (R)</span>
          <span className="stat-value">{R}</span>
        </div>
        <div className="stat">
          <span className="stat-label">W + R</span>
          <span className="stat-value" style={{ color: strongConsistency ? 'var(--accent)' : 'var(--warning)' }}>
            {W + R} {strongConsistency ? '> N' : '≤ N'}
          </span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 16,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <button onClick={write} className="btn btn-accent">
          Write
        </button>
        <button onClick={read} className="btn btn-accent">
          Read
        </button>
        <button onClick={reset} className="btn">
          Reset
        </button>

        <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
          <label style={{
            fontSize: 11,
            color: 'var(--text-dim)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            W:
            <input
              type="range"
              min="1"
              max={N}
              value={W}
              onChange={e => setW(Number(e.target.value))}
              className="sim-input"
              style={{ width: 80 }}
            />
            <span style={{ color: 'var(--text-bright)', minWidth: 20 }}>{W}</span>
          </label>
          <label style={{
            fontSize: 11,
            color: 'var(--text-dim)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            R:
            <input
              type="range"
              min="1"
              max={N}
              value={R}
              onChange={e => setR(Number(e.target.value))}
              className="sim-input"
              style={{ width: 80 }}
            />
            <span style={{ color: 'var(--text-bright)', minWidth: 20 }}>{R}</span>
          </label>
        </div>
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {nodes.map((n, i) => {
            const isWriteNode = writeHighlight.includes(i);
            const isReadNode = readHighlight.includes(i);

            return (
              <div
                key={i}
                style={{
                  padding: 14,
                  textAlign: 'center',
                  borderRadius: 'var(--radius)',
                  background: isWriteNode
                    ? 'var(--accent-glow)'
                    : isReadNode
                    ? 'var(--info-glow)'
                    : 'var(--surface-2)',
                  border: `1px solid ${
                    isWriteNode
                      ? 'var(--accent)'
                      : isReadNode
                      ? 'var(--info)'
                      : 'var(--border)'
                  }`,
                  transition: 'all 0.3s'
                }}
              >
                <div style={{
                  fontWeight: 600,
                  fontSize: 12,
                  color: 'var(--text-bright)',
                  marginBottom: 8
                }}>
                  {n.id}
                </div>
                <div style={{
                  fontSize: 14,
                  color: 'var(--accent)',
                  marginBottom: 6,
                  fontFamily: 'var(--font-mono)'
                }}>
                  {n.value}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                  version {n.version}
                </div>
                {n.participated && (
                  <div style={{
                    marginTop: 6,
                    fontSize: 10,
                    color: isWriteNode ? 'var(--accent)' : 'var(--info)'
                  }}>
                    {isWriteNode ? '✓ wrote' : isReadNode ? '✓ read' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: 16,
          padding: 12,
          background: strongConsistency ? 'var(--accent-glow)' : 'var(--warning-glow)',
          border: `1px solid ${strongConsistency ? 'var(--accent)' : 'var(--warning)'}`,
          borderRadius: 'var(--radius)',
          fontSize: 11,
          color: strongConsistency ? 'var(--accent)' : 'var(--warning)'
        }}>
          {strongConsistency ? (
            <>
              <strong>Strong consistency:</strong> W + R = {W + R} &gt; N = {N}. Read quorum always overlaps with write quorum, guaranteeing latest value is read.
            </>
          ) : (
            <>
              <strong>Eventual consistency:</strong> W + R = {W + R} ≤ N = {N}. Read and write quorums may not overlap, stale reads possible.
            </>
          )}
        </div>
      </div>

      <div className="info-panel">
        <h3>// quorum log</h3>
        <div className="log-area">
          {log.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
              No operations yet
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
            <li>Write succeeds when W nodes acknowledge</li>
            <li>Read queries R nodes and returns latest version</li>
            <li>If W + R &gt; N: read/write sets overlap → strong consistency</li>
            <li>Tune W and R for consistency vs availability tradeoffs</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Cassandra, DynamoDB (tunable consistency)</li>
            <li>Riak KV</li>
            <li>Distributed key-value stores</li>
            <li>CAP theorem tradeoffs (Dynamo paper)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
