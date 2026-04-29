'use client';

import { useState, useCallback } from 'react';

type Phase = 'idle' | 'prepare' | 'commit' | 'abort' | 'done';

interface Participant {
  id: string;
  vote: 'yes' | 'no' | 'pending';
  status: Phase;
  willFail: boolean;
}

export default function TwoPhaseCommitPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'P1', vote: 'pending', status: 'idle', willFail: false },
    { id: 'P2', vote: 'pending', status: 'idle', willFail: false },
    { id: 'P3', vote: 'pending', status: 'idle', willFail: false },
  ]);
  const [log, setLog] = useState<string[]>([]);
  const [txCount, setTxCount] = useState(0);

  const toggleFail = useCallback((id: string) => {
    if (phase !== 'idle' && phase !== 'done') return;
    setParticipants(prev => prev.map(p =>
      p.id === id ? { ...p, willFail: !p.willFail } : p
    ));
  }, [phase]);

  const startTransaction = useCallback(() => {
    setPhase('prepare');
    setTxCount(c => c + 1);
    setLog(prev => [...prev.slice(-20), `── TX #${txCount + 1} ──`]);
    setLog(prev => [...prev.slice(-20), 'COORDINATOR: Phase 1 → PREPARE sent to all participants']);

    // Phase 1: Gather votes
    setTimeout(() => {
      setParticipants(prev => {
        const voted = prev.map(p => ({
          ...p,
          vote: (p.willFail ? 'no' : 'yes') as 'yes' | 'no',
          status: 'prepare' as Phase
        }));

        const allYes = voted.every(v => v.vote === 'yes');
        setLog(prevLog => [
          ...prevLog.slice(-20),
          `Votes: ${voted.map(v => `${v.id}=${v.vote}`).join(', ')}`
        ]);

        // Phase 2: Commit or Abort
        setTimeout(() => {
          if (allYes) {
            setPhase('commit');
            setParticipants(prev2 => prev2.map(p => ({ ...p, status: 'commit' as Phase })));
            setLog(prevLog => [...prevLog.slice(-20), 'COORDINATOR: Phase 2 → COMMIT (all voted YES) ✓']);
          } else {
            setPhase('abort');
            setParticipants(prev2 => prev2.map(p => ({ ...p, status: 'abort' as Phase })));
            setLog(prevLog => [...prevLog.slice(-20), 'COORDINATOR: Phase 2 → ABORT (not all agreed) ✗']);
          }
          setTimeout(() => setPhase('done'), 800);
        }, 1000);

        return voted;
      });
    }, 1000);
  }, [txCount]);

  const reset = useCallback(() => {
    setPhase('idle');
    setParticipants(prev => prev.map(p => ({ ...p, vote: 'pending' as const, status: 'idle' as Phase })));
  }, []);

  const phaseSteps = ['prepare', 'commit/abort'];
  const currentStep = phase === 'prepare' ? 0 : (phase === 'commit' || phase === 'abort' || phase === 'done') ? 1 : -1;

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">consensus</span>
        <h1>Two Phase Commit (2PC)</h1>
        <p className="subtitle">
          Atomic distributed transactions: Phase 1 (Prepare/Vote) → Phase 2 (Commit or Abort).
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">phase</span>
          <span className="stat-value" style={{
            color: phase === 'commit' ? 'var(--accent)' : phase === 'abort' ? 'var(--danger)' : 'var(--text-bright)'
          }}>
            {phase.toUpperCase()}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">transactions</span>
          <span className="stat-value">{txCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">participants</span>
          <span className="stat-value">{participants.length}</span>
        </div>
      </div>

      {/* Phase progress bar */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 16,
        padding: '8px 12px',
        background: 'var(--surface-2)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)'
      }}>
        {phaseSteps.map((step, i) => (
          <div key={step} style={{
            flex: 1,
            padding: '6px 8px',
            textAlign: 'center',
            fontSize: 11,
            borderRadius: 4,
            background: i <= currentStep ? 'var(--accent-glow)' : 'transparent',
            color: i <= currentStep ? 'var(--accent)' : 'var(--text-dim)',
            border: `1px solid ${i <= currentStep ? 'var(--accent)' : 'transparent'}`,
            transition: 'all 0.3s'
          }}>
            Phase {i + 1}: {step}
          </div>
        ))}
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        {/* Coordinator */}
        <div style={{
          textAlign: 'center',
          padding: 12,
          marginBottom: 12,
          background: 'var(--accent-glow)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius)'
        }}>
          <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>COORDINATOR</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
            {phase === 'idle' || phase === 'done' ? 'waiting' : phase === 'prepare' ? 'collecting votes...' : 'decision sent'}
          </div>
        </div>

        <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 11, marginBottom: 12 }}>
          ↓ {phase === 'prepare' ? 'PREPARE?' : phase === 'commit' ? 'COMMIT!' : phase === 'abort' ? 'ABORT!' : '...'} ↓
        </div>

        {/* Participants */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {participants.map(p => (
            <div
              key={p.id}
              onClick={() => toggleFail(p.id)}
              style={{
                padding: 14,
                textAlign: 'center',
                borderRadius: 'var(--radius)',
                cursor: (phase === 'idle' || phase === 'done') ? 'pointer' : 'default',
                background: p.status === 'commit'
                  ? 'var(--accent-glow)'
                  : p.status === 'abort'
                  ? 'var(--danger-glow)'
                  : p.willFail
                  ? 'var(--warning-glow)'
                  : 'var(--surface-2)',
                border: `1px solid ${
                  p.status === 'commit'
                    ? 'var(--accent)'
                    : p.status === 'abort'
                    ? 'var(--danger)'
                    : p.willFail
                    ? 'var(--warning)'
                    : 'var(--border)'
                }`,
                transition: 'all 0.3s'
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 6 }}>
                {p.status === 'commit' ? '✓' : p.status === 'abort' ? '✗' : p.willFail ? '⚠' : '○'}
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-bright)', marginBottom: 4 }}>
                {p.id}
              </div>
              <div style={{
                fontSize: 11,
                color: p.vote === 'yes' ? 'var(--accent)' : p.vote === 'no' ? 'var(--danger)' : 'var(--text-dim)'
              }}>
                vote: {p.vote}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                {(phase === 'idle' || phase === 'done') && (p.willFail ? '⚠ will vote NO' : '✓ will vote YES')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="viz-controls">
        <button
          onClick={startTransaction}
          className="btn btn-accent"
          disabled={phase !== 'idle' && phase !== 'done'}
        >
          Start Transaction
        </button>
        <button onClick={reset} className="btn">
          Reset
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>
          Click participants to toggle failure (before starting)
        </span>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>// transaction log</h3>
        <div className="log-area">
          {log.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>No transactions yet</div>
          ) : (
            log.map((entry, i) => (
              <div key={i} className="log-entry">
                <span style={{ color: 'var(--text-dim)', marginRight: 8 }}>[{String(i + 1).padStart(2, '0')}]</span>
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
            <li>Phase 1: Coordinator asks all to prepare (vote)</li>
            <li>If ALL vote YES → Phase 2: COMMIT</li>
            <li>If ANY votes NO → Phase 2: ABORT</li>
            <li>Blocking protocol: coordinator failure blocks all</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Tradeoffs</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>+ Atomic: all-or-nothing guarantee</li>
            <li>− Blocking: coordinator is single point of failure</li>
            <li>− Latency: 2 round trips minimum</li>
            <li>Used in: distributed databases, XA transactions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
