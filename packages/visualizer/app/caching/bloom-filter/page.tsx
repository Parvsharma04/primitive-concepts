'use client';

import { useState, useCallback } from 'react';

const FILTER_SIZE = 32;
const HASH_COUNT = 3;

function hash(str: string, seed: number): number {
    let h = seed;
    for (let i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h % FILTER_SIZE;
}

function getHashes(str: string): number[] {
    return Array.from({ length: HASH_COUNT }, (_, i) => hash(str, i * 137 + 1));
}

export default function BloomFilterPage() {
    const [bits, setBits] = useState<boolean[]>(new Array(FILTER_SIZE).fill(false));
    const [items, setItems] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [queryValue, setQueryValue] = useState('');
    const [queryResult, setQueryResult] = useState<string | null>(null);
    const [highlightBits, setHighlightBits] = useState<number[]>([]);
    const [log, setLog] = useState<string[]>([]);

    const addLog = useCallback((msg: string) => {
        setLog(prev => [...prev.slice(-15), msg]);
    }, []);

    const add = useCallback(() => {
        if (!inputValue.trim()) return;
        const val = inputValue.trim();
        const hashes = getHashes(val);
        setBits(prev => {
            const next = [...prev];
            hashes.forEach(h => { next[h] = true; });
            return next;
        });
        setItems(prev => [...prev, val]);
        setHighlightBits(hashes);
        addLog(`ADD "${val}" → set bits [${hashes.join(', ')}]`);
        setInputValue('');
        setQueryResult(null);
    }, [inputValue, addLog]);

    const query = useCallback(() => {
        if (!queryValue.trim()) return;
        const val = queryValue.trim();
        const hashes = getHashes(val);
        const mightExist = hashes.every(h => bits[h]);
        setHighlightBits(hashes);
        const actuallyExists = items.includes(val);
        if (mightExist) {
            setQueryResult(actuallyExists ? `"${val}" → PROBABLY IN SET (true positive)` : `"${val}" → PROBABLY IN SET (FALSE POSITIVE!)`);
        } else {
            setQueryResult(`"${val}" → DEFINITELY NOT IN SET`);
        }
        addLog(`QUERY "${val}" → bits [${hashes.join(', ')}] → ${mightExist ? 'maybe yes' : 'definitely no'}`);
        setQueryValue('');
    }, [queryValue, bits, items, addLog]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">caching</span>
                <h1>Bloom Filter</h1>
                <p className="subtitle">Probabilistic set membership — may have false positives, never false negatives.</p>
            </div>

            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// how it works</h3>
                <p>{FILTER_SIZE} bits, {HASH_COUNT} hash functions. Add sets bits; query checks all bits. If any bit is 0 → definitely not in set.</p>
            </div>

            {/* Bit array visualization */}
            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginBottom: 16 }}>
                {bits.map((bit, i) => (
                    <div key={i} style={{
                        width: 20, height: 20, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 600,
                        background: highlightBits.includes(i) ? (bit ? 'var(--accent)' : 'var(--warning)') : (bit ? 'var(--accent-dim)' : 'var(--surface-2)'),
                        color: bit ? 'var(--bg)' : 'var(--text-dim)',
                        border: `1px solid ${highlightBits.includes(i) ? 'var(--text-bright)' : 'var(--border)'}`,
                    }}>
                        {bit ? '1' : '0'}
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="item to add" className="sim-input" onKeyDown={e => e.key === 'Enter' && add()} />
                <button onClick={add} className="sim-button">ADD</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input value={queryValue} onChange={e => setQueryValue(e.target.value)} placeholder="item to query" className="sim-input" onKeyDown={e => e.key === 'Enter' && query()} />
                <button onClick={query} className="sim-button">QUERY</button>
            </div>

            {queryResult && <div style={{ fontSize: 12, marginBottom: 16, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', color: queryResult.includes('NOT') ? 'var(--danger)' : queryResult.includes('FALSE') ? 'var(--warning)' : 'var(--accent)' }}>{queryResult}</div>}

            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 16 }}>
                Items added: {items.length > 0 ? items.join(', ') : 'none'} | Fill rate: {((bits.filter(Boolean).length / FILTER_SIZE) * 100).toFixed(0)}%
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
