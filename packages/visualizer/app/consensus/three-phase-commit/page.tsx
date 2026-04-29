'use client';

import { useState, useCallback } from 'react';

type Phase = 'idle' | 'can-commit' | 'pre-commit' | 'do-commit' | 'abort' | 'done';

interface Participant {
  id: string;
  willFail: boolean;
  status: string;
}

export default function ThreePhaseCommitPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'P1', willFail: false, status: 'idle' },
    { id: 'P2', willFail: false, status: 'idle' },
    { id: 'P3', willFail: false, status: 'idle' },
  ]);
  const [log, setLog] = useState<string[]>([]);
  const [txCount, setTxCount] = useState(0);

  const toggleFail = useCallback((id: string) => {
    if (phase !== 'idle' && phase !== 'done') return;
    setParticipants(prev => prev.map(p =>
      p.id === id ? { ...p, willFail: !p.willFail } : p
    ));
  }, [phase]);

  const start = useCallback(() => {
    setTxCount(c => c + 1);
    setPhase('can-commit');
    setLog(prev => [...prev.slice(-20), `── TX #${txCount + 1} ──`]);
    setLog(prev => [...prev.slice(-20), 'Phase 1: CAN-COMMIT? → asking all participants']);

    setTimeout(() => {
      setParticipants(prev => {
        const voted = prev.map(p => ({
          ...p,
          status: p.willFail ? 'NO' : 'YES'
        }));

        const anyFail = voted.some(p => p.status === 'NO');
        setLog(prevLog => [
          ...prevLog.slice(-20),
          `Responses: ${voted.map(v => `${v.id}=${v.status}`).join(', ')}`
        ]);

        if (anyFail) {
          setTimeout(() => {
            setPhase('abort');
            setParticipants(prev2 => prev2.map(p => ({ ...p, status: 'ABORT' })));
            setLog(prevLog => [...prevLog.slice(-20), 'ABORT — not all agreed to commit ✗']);
            setTimeout(() => setPhase('done'), 800);
          }, 800);
        } else {
          setTimeout(() => {
            setPhase('pre-commit');
            setParticipants(prev2 => prev2.map(p => ({ ...p, status: 'PRE-COMMIT' })));
            setLog(prevLog => [...prevLog.slice(-20), 'Phase 2: PRE-COMMIT → all acknowledged, preparing...']);

            setTimeout(() => {
              setPhase('do-commit');
              setParticipants(prev2 => prev2.map(p => ({ ...p, status: 'COMMITTED' })));
              setLog(prevLog => [...prevLog.slice(-20), 'Phase 3: DO-COMMIT → finalized ✓']);
              setTimeout(() => setPhase('done'), 800);
            }, 1000);
          }, 800);
        }

        return voted;
      });
    }, 1000);
  }, [txCount]);

  const reset = useCallback(() => {
    setPhase('idle');
    setParticipants(prev => prev.map(p => ({ ...p, status: 'idle' })));
  }, []);

  const phaseSteps = ['can-commit', 'pre-commit', 'do-commit'];
  const currentStep = phase === 'can-commit' ? 0 
    : phase === 'pre-commit' ? 1 
    : (phase === 'do-commit' || phase === 'done') ? 2 
    : phase === 'abort' ? 0 
    : -1;

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">consensus</span>
        <h1>Three Phase Commit (3PC)</h1>
        <p className="subtitle">
          Non-blocking extension of 2PC: adds pre-commit phase to avoid coordinator-failure blocking.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">phase</span>
          <span className="stat-value" style={{
            color: phase === 'do-commit' || phase === 'done'
              ? 'var(--accent)' 
              : phase === 'abort' 
              ? 'var(--danger)' 
              : 'var(--text-bright)'
          }}>
            {phase.toUpperCase().replace('-', ' ')}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">transactions</span>
          <span className="stat-value">{txCount}</span>
        </div>
      </div>

      {/* Phase progress */}
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
            background: (phase !== 'abort' && i <= currentStep)
              ? 'var(--accent-glow)'
              : phase === 'abort' && i === 0
              ? 'var(--danger-glow)'
              : 'transparent',
            color: (phase !== 'abort' && i <= currentStep)
              ? 'var(--accent)'
              : phase === 'abort' && i === 0
              ? 'var(--danger)'
              : 'var(--text-dim)',
            border: `1px solid ${
              (phase !== 'abort' && i <= currentStep)
                ? 'var(--accent)'
                : phase === 'abort' && i === 0
                ? 'var(--danger)'
                : 'transparent'
            }`,
            transition: 'all 0.3s'
          }}>
            Phase {i + 1}: {step}
          </div>
        ))}
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        <div style={{
          textAlign: 'center',
          padding: 12,
          marginBottom: 12,
          background: 'var(--accent-glow)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius)'
        }}>
          <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>COORDINATOR</div>
        </div>

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
                background: p.status === 'COMMITTED'
                  ? 'var(--accent-glow)'
                  : p.status === 'ABORT'
                  ? 'var(--danger-glow)'
                  : p.status === 'PRE-COMMIT'
                  ? 'var(--info-glow)'
                  : p.willFail
                  ? 'var(--warning-glow)'
                  : 'var(--surface-2)',
                border: `1px solid ${
                  p.status === 'COMMITTED'
                    ? 'var(--accent)'
                    : p.status === 'ABORT'
                    ? 'var(--danger)'
                    : p.status === 'PRE-COMMIT'
                    ? 'var(--info)'
                    : 'var(--border)'
                }`,
                transition: 'all 0.3s'
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 6 }}>
                {p.status === 'COMMITTED' ? '✓' : p.status === 'ABORT' ? '✗' : p.status === 'PRE-COMMIT' ? '◐' : p.willFail ? '⚠' : '○'}
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-bright)', marginBottom: 4 }}>
                {p.id}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {p.status}
              </div>
              {(phase === 'idle' || phase === 'done') && (
                <div style={{ fontSize: 10, color: p.willFail ? 'var(--warning)' : 'var(--text-dim)', marginTop: 4 }}>
                  {p.willFail ? '⚠ will fail' : '✓ ok'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="viz-controls">
        <button onClick={start} className="btn btn-accent" disabled={phase !== 'idle' && phase !== 'done'}>
          Start 3PC
        </button>
        <button onClick={reset} className="btn">Reset</button>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>
          Click participants to toggle failure
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
            <li>Phase 1: CAN-COMMIT? (voting round)</li>
            <li>Phase 2: PRE-COMMIT (prepare to commit)</li>
            <li>Phase 3: DO-COMMIT (finalize)</li>
            <li>If coordinator fails after pre-commit, participants can recover</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>vs 2PC</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>+ Non-blocking on coordinator failure</li>
            <li>+ Participants can timeout and decide</li>
            <li>− Higher latency (3 round trips)</li>
            <li>− More complex, rarely used in practice</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
