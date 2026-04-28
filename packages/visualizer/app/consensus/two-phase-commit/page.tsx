'use client';

import { useState, useCallback } from 'react';

type Phase = 'idle' | 'prepare' | 'commit' | 'abort' | 'done';
interface Participant { id: string; vote: 'yes' | 'no' | 'pending'; status: Phase; willFail: boolean; }

export default function TwoPhaseCommitPage() {
    const [phase, setPhase] = useState<Phase>('idle');
    const [participants, setParticipants] = useState<Participant[]>([
        { id: 'P1', vote: 'pending', status: 'idle', willFail: false },
        { id: 'P2', vote: 'pending', status: 'idle', willFail: false },
        { id: 'P3', vote: 'pending', status: 'idle', willFail: false },
    ]);
    const [log, setLog] = useState<string[]>([]);

    const toggleFail = useCallback((id: string) => {
        setParticipants(prev => prev.map(p => p.id === id ? { ...p, willFail: !p.willFail } : p));
    }, []);

    const startTransaction = useCallback(() => {
        setPhase('prepare');
        setLog(prev => [...prev.slice(-15), 'COORDINATOR: Phase 1 — sending PREPARE to all']);

        setTimeout(() => {
            const votes = participants.map(p => ({ ...p, vote: (p.willFail ? 'no' : 'yes') as 'yes' | 'no', status: 'prepare' as Phase }));
            setParticipants(votes);
            const allYes = votes.every(v => v.vote === 'yes');
            setLog(prev => [...prev.slice(-15), `Votes: ${votes.map(v => `${v.id}=${v.vote}`).join(', ')}`]);

            setTimeout(() => {
                if (allYes) {
                    setPhase('commit');
                    setParticipants(prev => prev.map(p => ({ ...p, status: 'commit' })));
                    setLog(prev => [...prev.slice(-15), 'COORDINATOR: Phase 2 — COMMIT (all voted yes)']);
                } else {
                    setPhase('abort');
                    setParticipants(prev => prev.map(p => ({ ...p, status: 'abort' })));
                    setLog(prev => [...prev.slice(-15), 'COORDINATOR: Phase 2 — ABORT (at least one voted no)']);
                }
                setTimeout(() => setPhase('done'), 1000);
            }, 1000);
        }, 1000);
    }, [participants]);

    const reset = useCallback(() => {
        setPhase('idle');
        setParticipants(prev => prev.map(p => ({ ...p, vote: 'pending', status: 'idle' })));
        setLog(prev => [...prev.slice(-15), '--- RESET ---']);
    }, []);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">consensus</span>
                <h1>Two Phase Commit</h1>
                <p className="subtitle">Phase 1: Prepare (vote). Phase 2: Commit or Abort based on votes.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={startTransaction} className="sim-button" disabled={phase !== 'idle' && phase !== 'done'}>Start Transaction</button>
                <button onClick={reset} className="sim-button">Reset</button>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', alignSelf: 'center' }}>Phase: {phase}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {participants.map(p => (
                    <div key={p.id} onClick={() => phase === 'idle' && toggleFail(p.id)} style={{
                        padding: 12, textAlign: 'center', borderRadius: 'var(--radius)', cursor: phase === 'idle' ? 'pointer' : 'default',
                        background: p.status === 'commit' ? 'var(--accent-glow)' : p.status === 'abort' ? 'var(--danger-glow)' : p.willFail ? 'var(--warning-glow)' : 'var(--surface-2)',
                        border: `1px solid ${p.status === 'commit' ? 'var(--accent)' : p.status === 'abort' ? 'var(--danger)' : 'var(--border)'}`,
                    }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{p.id}</div>
                        <div style={{ fontSize: 11, color: p.vote === 'yes' ? 'var(--accent)' : p.vote === 'no' ? 'var(--danger)' : 'var(--text-dim)' }}>vote: {p.vote}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{p.willFail ? '⚠ will vote NO' : '✓ will vote YES'}</div>
                    </div>
                ))}
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 16 }}>Click participants to toggle failure (before starting).</p>

            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 150, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
