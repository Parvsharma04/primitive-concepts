'use client';

import { useState, useCallback } from 'react';

type Phase = 'idle' | 'can-commit' | 'pre-commit' | 'do-commit' | 'abort' | 'done';

export default function ThreePhaseCommitPage() {
    const [phase, setPhase] = useState<Phase>('idle');
    const [participants, setParticipants] = useState([
        { id: 'P1', willFail: false, status: 'idle' },
        { id: 'P2', willFail: false, status: 'idle' },
        { id: 'P3', willFail: false, status: 'idle' },
    ]);
    const [log, setLog] = useState<string[]>([]);

    const toggleFail = useCallback((id: string) => {
        if (phase !== 'idle' && phase !== 'done') return;
        setParticipants(prev => prev.map(p => p.id === id ? { ...p, willFail: !p.willFail } : p));
    }, [phase]);

    const start = useCallback(() => {
        setPhase('can-commit');
        setLog(prev => [...prev.slice(-15), 'Phase 1: CAN-COMMIT? → asking all participants']);

        setTimeout(() => {
            const anyFail = participants.some(p => p.willFail);
            setParticipants(prev => prev.map(p => ({ ...p, status: p.willFail ? 'no' : 'yes' })));
            setLog(prev => [...prev.slice(-15), `Votes received: ${participants.map(p => `${p.id}=${p.willFail ? 'NO' : 'YES'}`).join(', ')}`]);

            if (anyFail) {
                setTimeout(() => {
                    setPhase('abort');
                    setParticipants(prev => prev.map(p => ({ ...p, status: 'abort' })));
                    setLog(prev => [...prev.slice(-15), 'ABORT — not all agreed']);
                    setTimeout(() => setPhase('done'), 800);
                }, 800);
            } else {
                setTimeout(() => {
                    setPhase('pre-commit');
                    setParticipants(prev => prev.map(p => ({ ...p, status: 'pre-commit' })));
                    setLog(prev => [...prev.slice(-15), 'Phase 2: PRE-COMMIT → all acknowledged']);

                    setTimeout(() => {
                        setPhase('do-commit');
                        setParticipants(prev => prev.map(p => ({ ...p, status: 'committed' })));
                        setLog(prev => [...prev.slice(-15), 'Phase 3: DO-COMMIT → finalized']);
                        setTimeout(() => setPhase('done'), 800);
                    }, 1000);
                }, 800);
            }
        }, 1000);
    }, [participants]);

    const reset = useCallback(() => {
        setPhase('idle');
        setParticipants(prev => prev.map(p => ({ ...p, status: 'idle' })));
    }, []);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">consensus</span>
                <h1>Three Phase Commit</h1>
                <p className="subtitle">Adds pre-commit phase between voting and committing to reduce coordinator-failure blocking.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={start} className="sim-button" disabled={phase !== 'idle' && phase !== 'done'}>Start 3PC</button>
                <button onClick={reset} className="sim-button">Reset</button>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', alignSelf: 'center' }}>Phase: {phase}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {participants.map(p => (
                    <div key={p.id} onClick={() => toggleFail(p.id)} style={{
                        padding: 12, textAlign: 'center', borderRadius: 'var(--radius)', cursor: 'pointer',
                        background: p.status === 'committed' ? 'var(--accent-glow)' : p.status === 'abort' ? 'var(--danger-glow)' : p.willFail ? 'var(--warning-glow)' : 'var(--surface-2)',
                        border: `1px solid ${p.status === 'committed' ? 'var(--accent)' : p.status === 'abort' ? 'var(--danger)' : 'var(--border)'}`,
                    }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{p.id}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{p.status}</div>
                        <div style={{ fontSize: 10, color: p.willFail ? 'var(--warning)' : 'var(--text-dim)' }}>{p.willFail ? '⚠ will fail' : '✓ ok'}</div>
                    </div>
                ))}
            </div>

            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 150, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
