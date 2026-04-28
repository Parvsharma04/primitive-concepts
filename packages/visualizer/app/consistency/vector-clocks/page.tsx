'use client';

import { useState, useCallback } from 'react';

type VClock = Record<string, number>;

const NODES = ['A', 'B', 'C'];

export default function VectorClocksPage() {
  const [clocks, setClocks] = useState<Record<string, VClock>>({
    A: { A: 0, B: 0, C: 0 },
    B: { A: 0, B: 0, C: 0 },
    C: { A: 0, B: 0, C: 0 },
  });
  const [log, setLog] = useState<string[]>([]);
  const [lastEvent, setLastEvent] = useState<{ type: 'local' | 'send'; node: string; from?: string; to?: string } | null>(null);

  const formatClock = (clock: VClock) => `[${NODES.map(n => clock[n]).join(',')}]`;

  const localEvent = useCallback((node: string) => {
    setClocks(prev => {
      const updated = {
        ...prev,
        [node]: { ...prev[node], [node]: prev[node][node] + 1 }
      };
      setLog(prevLog => [
        ...prevLog.slice(-20),
        `${node} local event → ${formatClock(updated[node])}`
      ]);
      setLastEvent({ type: 'local', node });
      return updated;
    });
  }, []);

  const send = useCallback((from: string, to: string) => {
    setClocks(prev => {
      // Sender increments its clock
      const fromClock = { ...prev[from], [from]: prev[from][from] + 1 };

      // Receiver merges clocks (take max of each) then increments
      const toClock = { ...prev[to] };
      NODES.forEach(n => {
        toClock[n] = Math.max(toClock[n], fromClock[n]);
      });
      toClock[to] = toClock[to] + 1;

      const updated = { ...prev, [from]: fromClock, [to]: toClock };
      
      setLog(prevLog => [
        ...prevLog.slice(-20),
        `${from}→${to}: sender=${formatClock(fromClock)} receiver=${formatClock(toClock)}`
      ]);
      setLastEvent({ type: 'send', node: '', from, to });

      return updated;
    });
  }, []);

  const reset = useCallback(() => {
    setClocks({
      A: { A: 0, B: 0, C: 0 },
      B: { A: 0, B: 0, C: 0 },
      C: { A: 0, B: 0, C: 0 },
    });
    setLog([]);
    setLastEvent(null);
  }, []);

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">consistency</span>
        <h1>Vector Clocks</h1>
        <p className="subtitle">
          Track causal ordering across distributed nodes. Each maintains a vector of logical timestamps.
        </p>
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {NODES.map(node => {
            const isHighlighted = lastEvent?.type === 'local' && lastEvent.node === node;
            const isSender = lastEvent?.from === node;
            const isReceiver = lastEvent?.to === node;

            return (
              <div
                key={node}
                style={{
                  padding: 16,
                  background: isHighlighted || isSender || isReceiver 
                    ? 'var(--accent-glow)' 
                    : 'var(--surface-2)',
                  border: `1px solid ${
                    isHighlighted || isSender || isReceiver 
                      ? 'var(--accent)' 
                      : 'var(--border)'
                  }`,
                  borderRadius: 'var(--radius)',
                  textAlign: 'center',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{
                  fontWeight: 600,
                  color: 'var(--accent)',
                  marginBottom: 12,
                  fontSize: 14
                }}>
                  Node {node}
                  {isSender && <span style={{ marginLeft: 8, fontSize: 12 }}>→</span>}
                  {isReceiver && <span style={{ marginLeft: 8, fontSize: 12 }}>←</span>}
                </div>

                <div style={{
                  fontSize: 20,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-bright)',
                  marginBottom: 12,
                  letterSpacing: 1
                }}>
                  [{NODES.map(n => clocks[node][n]).join(', ')}]
                </div>

                <div style={{
                  display: 'flex',
                  gap: 6,
                  fontSize: 10,
                  color: 'var(--text-dim)',
                  justifyContent: 'center',
                  marginBottom: 12
                }}>
                  {NODES.map(n => (
                    <div key={n} style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: 2 }}>{n}:</div>
                      <div style={{
                        color: n === node ? 'var(--accent)' : 'var(--text-dim)',
                        fontWeight: n === node ? 600 : 400
                      }}>
                        {clocks[node][n]}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => localEvent(node)}
                  className="btn btn-accent"
                  style={{ fontSize: 11, padding: '6px 12px', width: '100%' }}
                >
                  Local Event
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 11,
          color: 'var(--text-dim)',
          marginBottom: 8
        }}>
          Send message (syncs vector clocks):
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {NODES.flatMap(from =>
            NODES.filter(to => to !== from).map(to => (
              <button
                key={`${from}-${to}`}
                onClick={() => send(from, to)}
                className="btn"
                style={{ fontSize: 11, padding: '6px 12px' }}
              >
                {from} → {to}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="viz-controls">
        <button onClick={reset} className="btn">
          Reset All Clocks
        </button>
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
            <li>Each node maintains a vector of all node counters</li>
            <li>Local event: increment own counter</li>
            <li>Send message: increment own, send vector</li>
            <li>Receive: merge vectors (take max), then increment own</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Causality tracking in distributed DBs (Dynamo)</li>
            <li>Conflict detection (CRDTs)</li>
            <li>Event ordering in distributed tracing</li>
            <li>Version vectors for replication</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
