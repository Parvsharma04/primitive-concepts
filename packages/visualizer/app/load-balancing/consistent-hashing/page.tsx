'use client';

import { useState, useCallback } from 'react';

const RING_SIZE = 360;

function hashStr(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % RING_SIZE;
}

interface Node { name: string; position: number; }

export default function ConsistentHashingPage() {
    const [nodes, setNodes] = useState<Node[]>([
        { name: 'Node-A', position: hashStr('Node-A') },
        { name: 'Node-B', position: hashStr('Node-B') },
        { name: 'Node-C', position: hashStr('Node-C') },
    ]);
    const [keys, setKeys] = useState<{ key: string; position: number; assignedTo: string }[]>([]);
    const [inputKey, setInputKey] = useState('');
    const [inputNode, setInputNode] = useState('');
    const [log, setLog] = useState<string[]>([]);

    const findNode = useCallback((pos: number, nodeList: Node[]): string => {
        const sorted = [...nodeList].sort((a, b) => a.position - b.position);
        for (const n of sorted) if (n.position >= pos) return n.name;
        return sorted[0]?.name ?? 'none';
    }, []);

    const addKey = useCallback(() => {
        if (!inputKey.trim()) return;
        const key = inputKey.trim();
        const pos = hashStr(key);
        const assignedTo = findNode(pos, nodes);
        setKeys(prev => [...prev, { key, position: pos, assignedTo }]);
        setLog(prev => [...prev.slice(-15), `Key "${key}" → pos ${pos} → ${assignedTo}`]);
        setInputKey('');
    }, [inputKey, nodes, findNode]);

    const addNode = useCallback(() => {
        const name = inputNode.trim() || `Node-${String.fromCharCode(65 + nodes.length)}`;
        const pos = hashStr(name);
        const newNodes = [...nodes, { name, position: pos }];
        setNodes(newNodes);
        // Reassign keys
        setKeys(prev => prev.map(k => ({ ...k, assignedTo: findNode(k.position, newNodes) })));
        setLog(prev => [...prev.slice(-15), `Added ${name} at position ${pos} — keys reassigned`]);
        setInputNode('');
    }, [inputNode, nodes, findNode]);

    const removeNode = useCallback((name: string) => {
        const newNodes = nodes.filter(n => n.name !== name);
        setNodes(newNodes);
        setKeys(prev => prev.map(k => ({ ...k, assignedTo: findNode(k.position, newNodes) })));
        setLog(prev => [...prev.slice(-15), `Removed ${name} — keys reassigned`]);
    }, [nodes, findNode]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">load balancing</span>
                <h1>Consistent Hashing</h1>
                <p className="subtitle">Map keys to a ring — adding/removing nodes only moves a fraction of keys.</p>
            </div>

            {/* Ring visualization */}
            <div style={{ position: 'relative', width: 240, height: 240, margin: '0 auto 24px', border: '2px solid var(--border)', borderRadius: '50%' }}>
                {nodes.map(n => {
                    const angle = (n.position / RING_SIZE) * 360 - 90;
                    const rad = (angle * Math.PI) / 180;
                    const x = 120 + 100 * Math.cos(rad);
                    const y = 120 + 100 * Math.sin(rad);
                    return <div key={n.name} style={{ position: 'absolute', left: x - 6, top: y - 6, width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)', }} title={`${n.name} (${n.position})`} />;
                })}
                {keys.map(k => {
                    const angle = (k.position / RING_SIZE) * 360 - 90;
                    const rad = (angle * Math.PI) / 180;
                    const x = 120 + 75 * Math.cos(rad);
                    const y = 120 + 75 * Math.sin(rad);
                    return <div key={k.key} style={{ position: 'absolute', left: x - 4, top: y - 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--info)', }} title={`${k.key} → ${k.assignedTo}`} />;
                })}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="key to hash" className="sim-input" onKeyDown={e => e.key === 'Enter' && addKey()} />
                <button onClick={addKey} className="sim-button">Add Key</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input value={inputNode} onChange={e => setInputNode(e.target.value)} placeholder="node name" className="sim-input" onKeyDown={e => e.key === 'Enter' && addNode()} />
                <button onClick={addNode} className="sim-button">Add Node</button>
            </div>

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
                {nodes.map(n => (
                    <span key={n.name} style={{ padding: '4px 8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 11, cursor: 'pointer', color: 'var(--accent)' }} onClick={() => removeNode(n.name)} title="Click to remove">
                        {n.name} ({n.position}) ✗
                    </span>
                ))}
            </div>

            <div className="info-panel">
                <h3>// assignments</h3>
                <div style={{ maxHeight: 150, overflow: 'auto' }}>
                    {keys.map((k, i) => <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>{k.key} (pos {k.position}) → {k.assignedTo}</div>)}
                </div>
            </div>
        </div>
    );
}
