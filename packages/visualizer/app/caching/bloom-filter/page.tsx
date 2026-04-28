'use client';

import { useState, useCallback, useRef } from 'react';

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
    const [queryResult, setQueryResult] = useState<{ msg: string; type: 'positive' | 'negative' | 'false-positive' } | null>(null);
    const [highlightBits, setHighlightBits] = useState<number[]>([]);
    const [events, setEvents] = useState<{ id: number; msg: string; type: 'add' | 'yes' | 'no' | 'fp' }[]>([]);
    const nextId = useRef(0);

    const addEvent = useCallback((msg: string, type: 'add' | 'yes' | 'no' | 'fp') => {
        setEvents(prev => [...prev.slice(-20), { id: nextId.current++, msg, type }]);
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
        setItems(prev => prev.includes(val) ? prev : [...prev, val]);
        setHighlightBits(hashes);
        setQueryResult(null);
        addEvent(`ADD "${val}" → set bits [${hashes.join(', ')}]`, 'add');
        setInputValue('');
    }, [inputValue, addEvent]);

    const query = useCallback(() => {
        if (!queryValue.trim()) return;
        const val = queryValue.trim();
        const hashes = getHashes(val);
        const mightExist = hashes.every(h => bits[h]);
        setHighlightBits(hashes);
        const actuallyExists = items.includes(val);

        if (mightExist && actuallyExists) {
            setQueryResult({ msg: `"${val}" → PROBABLY IN SET (true positive ✓)`, type: 'positive' });
            addEvent(`QUERY "${val}" → true positive`, 'yes');
        } else if (mightExist && !actuallyExists) {
            setQueryResult({ msg: `"${val}" → PROBABLY IN SET (FALSE POSITIVE! ⚠)`, type: 'false-positive' });
            addEvent(`QUERY "${val}" → FALSE POSITIVE! Bits collided.`, 'fp');
        } else {
            setQueryResult({ msg: `"${val}" → DEFINITELY NOT IN SET ✗`, type: 'negative' });
            addEvent(`QUERY "${val}" → definitely not in set`, 'no');
        }
        setQueryValue('');
    }, [queryValue, bits, items, addEvent]);

    const reset = () => {
        setBits(new Array(FILTER_SIZE).fill(false));
        setItems([]);
        setHighlightBits([]);
        setQueryResult(null);
        setEvents([]);
    };

    const fillRate = (bits.filter(Boolean).length / FILTER_SIZE * 100).toFixed(0);
    const fpProbability = Math.pow(bits.filter(Boolean).length / FILTER_SIZE, HASH_COUNT) * 100;

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">caching</span>
                <h1>Bloom Filter</h1>
                <p className="subtitle">Space-efficient probabilistic set membership — may have false positives, never false negatives</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Filter Size</span>
                    <span className="stat-value">{FILTER_SIZE} bits</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Hash Functions</span>
                    <span className="stat-value accent">{HASH_COUNT}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Items Added</span>
                    <span className="stat-value accent">{items.length}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Fill Rate</span>
                    <span className={`stat-value ${Number(fillRate) > 70 ? 'danger' : Number(fillRate) > 40 ? 'warning' : 'accent'}`}>{fillRate}%</span>
                </div>
                <div className="stat">
                    <span className="stat-label">FP Probability</span>
                    <span className={`stat-value ${fpProbability > 20 ? 'danger' : fpProbability > 5 ? 'warning' : 'accent'}`}>~{fpProbability.toFixed(1)}%</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="item to add" className="sim-input" onKeyDown={e => e.key === 'Enter' && add()} />
                    <button onClick={add} className="btn btn-accent">ADD</button>
                    <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                    <input value={queryValue} onChange={e => setQueryValue(e.target.value)} placeholder="item to query" className="sim-input" onKeyDown={e => e.key === 'Enter' && query()} />
                    <button onClick={query} className="btn">QUERY</button>
                    <button onClick={reset} className="btn" style={{ marginLeft: 'auto' }}>Reset</button>
                </div>

                {/* Bit array visualization */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
                        // bit array ({bits.filter(Boolean).length}/{FILTER_SIZE} bits set)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(FILTER_SIZE, 16)}, 1fr)`, gap: 3 }}>
                        {bits.map((bit, i) => {
                            const isHighlighted = highlightBits.includes(i);
                            return (
                                <div key={i} style={{
                                    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: 3, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)',
                                    background: isHighlighted
                                        ? (bit ? 'var(--accent)' : 'var(--warning)')
                                        : (bit ? 'var(--accent-dim)' : 'var(--surface-2)'),
                                    color: bit ? 'var(--bg)' : 'var(--text-dim)',
                                    border: `1.5px solid ${isHighlighted ? 'var(--text-bright)' : bit ? 'var(--accent-dim)' : 'var(--border)'}`,
                                    transition: 'all 200ms ease',
                                    transform: isHighlighted ? 'scale(1.1)' : 'scale(1)',
                                    boxShadow: isHighlighted ? '0 0 8px var(--accent-glow)' : 'none',
                                }}>
                                    {bit ? '1' : '0'}
                                </div>
                            );
                        })}
                    </div>
                    {highlightBits.length > 0 && (
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 6 }}>
                            Hash positions: [{highlightBits.join(', ')}]
                        </div>
                    )}
                </div>

                {/* Query result */}
                {queryResult && (
                    <div style={{
                        padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: 12,
                        background: queryResult.type === 'positive' ? 'var(--accent-glow)' : queryResult.type === 'false-positive' ? 'var(--warning-glow)' : 'var(--danger-glow)',
                        border: `1px solid ${queryResult.type === 'positive' ? 'var(--accent)' : queryResult.type === 'false-positive' ? 'var(--warning)' : 'var(--danger)'}`,
                        color: queryResult.type === 'positive' ? 'var(--accent)' : queryResult.type === 'false-positive' ? 'var(--warning)' : 'var(--danger)',
                        fontSize: 12, fontWeight: 600,
                    }}>
                        {queryResult.msg}
                    </div>
                )}

                {/* Added items */}
                {items.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        Items in set: {items.map((item, i) => (
                            <span key={item} style={{ color: 'var(--accent)' }}>{item}{i < items.length - 1 ? ', ' : ''}</span>
                        ))}
                    </div>
                )}
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// event log</h3>
                    <div className="log-area">
                        {events.length === 0 && <div className="log-entry">No events yet.</div>}
                        {events.slice(-12).reverse().map(e => (
                            <div key={e.id} className={`log-entry ${e.type === 'yes' || e.type === 'add' ? 'allowed' : e.type === 'no' || e.type === 'fp' ? 'rejected' : ''}`}>
                                {e.msg}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>k hash functions map each item to k bit positions</li>
                        <li>ADD: set all k bits to 1</li>
                        <li>QUERY: check if all k bits are 1</li>
                        <li>If any bit is 0 → DEFINITELY not in set</li>
                        <li>If all bits 1 → MAYBE in set (could be collision)</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// trade-offs</h3>
                    <ul>
                        <li>Extremely space-efficient vs hash sets</li>
                        <li>O(k) add and query, k = number of hashes</li>
                        <li>Used in databases, CDNs, spell checkers</li>
                        <li className="con">Cannot delete items (use Counting Bloom Filter)</li>
                        <li className="con">FP rate grows as filter fills up</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
