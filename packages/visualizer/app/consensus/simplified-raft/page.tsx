'use client';

import { useState, useCallback } from 'react';

type Role = 'follower' | 'candidate' | 'leader';
interface Node { id: string; role: Role; term: number; log: string[]; votedFor: string | null; }

export default function SimplifiedRaftPage() {
    const [nodes, setNodes] = useState<Node[]>([
        { id: 'N1', role: 'leader', term: 1, log: [], votedFor: 'N1' },
        { id: 'N2', role: 'follower', term: 1, log: [], votedFor: 'N1' },
        { id: 'N3', role: 'follower', term: 1, log: [], votedFor: 'N1' },
    ]);
    const [log, setLog] = useState<string[]>(['N1 elected leader (term 1)']);
    const [entryInput, setEntryInput] = useState('');

    const leader = nodes.find(n => n.role === 'leader');

    const appendEntry = useCallback(() => {
        if (!leader || !entryInput.trim()) return;
        const entry = entryInput.trim();
        setNodes(prev => prev.map(n => ({ ...n, log: [...n.log, entry] })));
        setLog(prev => [...prev.slice(-15), `Leader ${leader.id} → append "${entry}" → replicated to majority → committed`]);
        setEntryInput('');
    }, [leader, entryInput]);

    const triggerElection = useCallback((candidateId: string) => {
        const newTerm = Math.max(...nodes.map(n => n.term)) + 1;
        const majority = Math.ceil(nodes.length / 2);
        setNodes(prev => prev.map(n => ({
            ...n,
            role: n.id === candidateId ? 'leader' : 'follower',
            term: newTerm,
            votedFor: candidateId,
        })));
        setLog(prev => [...prev.slice(-15), `${candidateId} starts election (term ${newTerm}) → wins ${majority}/${nodes.length} votes → LEADER`]);
    }, [nodes]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">consensus</span>
                <h1>Simplified Raft</h1>
                <p className="subtitle">Leader-based: elect leader → replicate log → commit on majority ACK.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {nodes.map(n => (
                    <div key={n.id} onClick={() => n.role !== 'leader' && triggerElection(n.id)} style={{
                        padding: 12, textAlign: 'center', borderRadius: 'var(--radius)', cursor: n.role !== 'leader' ? 'pointer' : 'default',
                        background: n.role === 'leader' ? 'var(--accent-glow)' : 'var(--surface-2)',
                        border: `1px solid ${n.role === 'leader' ? 'var(--accent)' : 'var(--border)'}`,
                    }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{n.id}</div>
                        <div style={{ fontSize: 11, color: n.role === 'leader' ? 'var(--accent)' : 'var(--text-dim)' }}>{n.role} (term {n.term})</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>log: [{n.log.slice(-3).join(', ')}]</div>
                    </div>
                ))}
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>Click a follower to trigger election. Append entries via leader.</p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input value={entryInput} onChange={e => setEntryInput(e.target.value)} placeholder="log entry" className="sim-input" onKeyDown={e => e.key === 'Enter' && appendEntry()} />
                <button onClick={appendEntry} className="sim-button" disabled={!leader}>Append</button>
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
