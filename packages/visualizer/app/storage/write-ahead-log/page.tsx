'use client';

import { useState, useCallback } from 'react';

interface WALEntry { lsn: number; op: string; applied: boolean; }

export default function WriteAheadLogPage() {
    const [wal, setWal] = useState<WALEntry[]>([]);
    const [store, setStore] = useState<Record<string, string>>({});
    const [inputKey, setInputKey] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [crashed, setCrashed] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    const write = useCallback(() => {
        if (!inputKey.trim() || crashed) return;
        const op = `SET ${inputKey.trim()} = "${inputValue.trim()}"`;
        const entry: WALEntry = { lsn: wal.length, op, applied: false };
        setWal(prev => [...prev, entry]);
        setLog(prev => [...prev.slice(-15), `WAL: logged "${op}" (LSN ${entry.lsn})`]);

        // Apply after logging
        setTimeout(() => {
            setStore(prev => ({ ...prev, [inputKey.trim()]: inputValue.trim() }));
            setWal(prev => prev.map((e, i) => i === entry.lsn ? { ...e, applied: true } : e));
            setLog(prev => [...prev.slice(-15), `APPLY: "${op}" → store updated`]);
        }, 300);
        setInputKey(''); setInputValue('');
    }, [inputKey, inputValue, wal.length, crashed]);

    const simulateCrash = useCallback(() => {
        setCrashed(true);
        setStore({});
        setWal(prev => prev.map(e => ({ ...e, applied: false })));
        setLog(prev => [...prev.slice(-15), '💥 CRASH — store lost, WAL preserved']);
    }, []);

    const recover = useCallback(() => {
        const recovered: Record<string, string> = {};
        wal.forEach(e => {
            const match = e.op.match(/SET (\S+) = "(.*)"/);
            if (match) recovered[match[1]] = match[2];
        });
        setStore(recovered);
        setWal(prev => prev.map(e => ({ ...e, applied: true })));
        setCrashed(false);
        setLog(prev => [...prev.slice(-15), `RECOVER: replayed ${wal.length} WAL entries → store restored`]);
    }, [wal]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">storage</span>
                <h1>Write Ahead Log</h1>
                <p className="subtitle">Log before applying — enables crash recovery by replaying the WAL.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="key" className="sim-input" onKeyDown={e => e.key === 'Enter' && write()} />
                <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="value" className="sim-input" onKeyDown={e => e.key === 'Enter' && write()} />
                <button onClick={write} className="sim-button" disabled={crashed}>Write</button>
                <button onClick={simulateCrash} className="sim-button" style={{ borderColor: 'var(--danger)' }}>Crash 💥</button>
                <button onClick={recover} className="sim-button" disabled={!crashed} style={{ borderColor: 'var(--accent)' }}>Recover</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="info-panel" style={{ padding: 8 }}>
                    <h3 style={{ fontSize: 11 }}>// WAL ({wal.length} entries)</h3>
                    {wal.map(e => <div key={e.lsn} style={{ fontSize: 10, color: e.applied ? 'var(--accent)' : 'var(--warning)', padding: '2px 0' }}>[{e.lsn}] {e.op} {e.applied ? '✓' : '○'}</div>)}
                </div>
                <div className="info-panel" style={{ padding: 8 }}>
                    <h3 style={{ fontSize: 11 }}>// store {crashed && '(CRASHED)'}</h3>
                    {Object.keys(store).length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: 10 }}>{crashed ? '💥 lost' : 'empty'}</p> :
                        Object.entries(store).map(([k, v]) => <div key={k} style={{ fontSize: 10, color: 'var(--text-dim)' }}>{k}: &quot;{v}&quot;</div>)}
                </div>
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
