'use client';

import { useState, useCallback } from 'react';

const NODES = ['A', 'B', 'C'];

interface NodeState {
  increments: number;
  decrements: number;
}

export default function CRDTCountersPage() {
  const [nodes, setNodes] = useState<Record<string, NodeState>>({
    A: { increments: 0, decrements: 0 },
    B: { increments: 0, decrements: 0 },
    C: { increments: 0, decrements: 0 },
  });
  const [log, setLog] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState<{ node: string; type: 'inc' | 'dec' } | null>(null);

  const totalValue = Object.values(nodes).reduce(
    (sum, n) => sum + n.increments - n.decrements,
    0
  );

  const increment = useCallback((node: string) => {
    setNodes(prev => {
      const updated = {
        ...prev,
        [node]: { ...prev[node], increments: prev[node].increments + 1 }
      };
      setLog(prevLog => [
        ...prevLog.slice(-20),
        `${node} INCREMENT → local inc=${updated[node].increments}`
      ]);
      setLastAction({ node, type: 'inc' });
      return updated;
    });
  }, []);

  const decrement = useCallback((node: string) => {
    setNodes(prev => {
      const updated = {
        ...prev,
        [node]: { ...prev[node], decrements: prev[node].decrements + 1 }
      };
      setLog(prevLog => [
        ...prevLog.slice(-20),
        `${node} DECREMENT → local dec=${updated[node].decrements}`
      ]);
      setLastAction({ node, type: 'dec' });
      return updated;
    });
  }, []);

  const merge = useCallback(() => {
    const allIncs = Object.values(nodes).reduce((s, n) => s + n.increments, 0);
    const allDecs = Object.values(nodes).reduce((s, n) => s + n.decrements, 0);
    
    setLog(prev => [
      ...prev.slice(-20),
      `MERGE → all nodes converge to: ${allIncs} - ${allDecs} = ${totalValue}`
    ]);
    setLastAction(null);
  }, [nodes, totalValue]);

  const reset = useCallback(() => {
    setNodes({
      A: { increments: 0, decrements: 0 },
      B: { increments: 0, decrements: 0 },
      C: { increments: 0, decrements: 0 },
    });
    setLog([]);
    setLastAction(null);
  }, []);

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">consistency</span>
        <h1>CRDT Counters</h1>
        <p className="subtitle">
          PN-Counter (Positive-Negative): each node tracks increments and decrements. Merging is commutative.
        </p>
      </div>

      <div style={{
        textAlign: 'center',
        marginBottom: 24,
        padding: 20,
        background: 'var(--surface-2)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
          Global Counter Value
        </div>
        <div style={{
          fontSize: 36,
          fontWeight: 700,
          color: totalValue >= 0 ? 'var(--accent)' : 'var(--danger)',
          fontFamily: 'var(--font-mono)'
        }}>
          {totalValue >= 0 ? '+' : ''}{totalValue}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
          Σ increments − Σ decrements = {
            Object.values(nodes).reduce((s, n) => s + n.increments, 0)
          } − {
            Object.values(nodes).reduce((s, n) => s + n.decrements, 0)
          } = {totalValue}
        </div>
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {NODES.map(node => {
            const isHighlighted = lastAction?.node === node;
            const nodeValue = nodes[node].increments - nodes[node].decrements;

            return (
              <div
                key={node}
                style={{
                  padding: 16,
                  background: isHighlighted ? 'var(--accent-glow)' : 'var(--surface-2)',
                  border: `1px solid ${isHighlighted ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  textAlign: 'center',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{
                  fontWeight: 600,
                  color: 'var(--text-bright)',
                  marginBottom: 12,
                  fontSize: 14
                }}>
                  Node {node}
                </div>

                <div style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: nodeValue >= 0 ? 'var(--accent)' : 'var(--danger)',
                  marginBottom: 12,
                  fontFamily: 'var(--font-mono)'
                }}>
                  {nodeValue >= 0 ? '+' : ''}{nodeValue}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  marginBottom: 12,
                  fontSize: 12
                }}>
                  <div>
                    <div style={{ color: 'var(--accent)', fontWeight: 600 }}>
                      +{nodes[node].increments}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                      increments
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--danger)', fontWeight: 600 }}>
                      −{nodes[node].decrements}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                      decrements
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  <button
                    onClick={() => increment(node)}
                    className="btn btn-accent"
                    style={{ fontSize: 11, padding: '6px 12px', flex: 1 }}
                  >
                    +1
                  </button>
                  <button
                    onClick={() => decrement(node)}
                    className="btn"
                    style={{
                      fontSize: 11,
                      padding: '6px 12px',
                      flex: 1,
                      background: 'var(--danger-glow)',
                      borderColor: 'var(--danger)',
                      color: 'var(--danger)'
                    }}
                  >
                    −1
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="viz-controls">
        <button onClick={merge} className="btn btn-accent">
          Merge (sync all)
        </button>
        <button onClick={reset} className="btn">
          Reset
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>
          CRDTs converge without coordination
        </span>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>// operation log</h3>
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
            <li>Each node maintains separate inc/dec counters</li>
            <li>Operations are commutative (order doesn't matter)</li>
            <li>Merging: take sum of all increments − sum of all decrements</li>
            <li>Eventual consistency without coordination</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Distributed counters (Redis CRDT, Riak)</li>
            <li>Shopping cart quantities</li>
            <li>Social media likes/reactions</li>
            <li>Collaborative editing metadata</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
