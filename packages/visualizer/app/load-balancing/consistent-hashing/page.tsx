'use client';

import { useState, useCallback, useRef } from 'react';

const RING_SIZE = 360;

function hashStr(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % RING_SIZE;
}

interface RingNode { name: string; position: number; color: string; }

const COLORS = ['var(--accent)', 'var(--info)', 'var(--warning)', 'var(--danger)', '#aa44ff'];

export default function ConsistentHashingPage() {
    const [nodes, setNodes] = useState<RingNode[]>([
        { name: 'Node-A', position: hashStr('Node-A'), color: COLORS[0] },
        { name: 'Node-B', position: hashStr('Node-B'), color: COLORS[1] },
        { name: 'Node-C', position: hashStr('Node-C'), color: COLORS[2] },
    ]);
    const [keys, setKeys] = useState<{ key: string; position: number; assignedTo: string }[]>([]);
    const [inputKey, setInputKey] = useState('');
    const [inputNode, setInputNode] = useState('');
    const [events, setEvents] = useState<{ id: number; msg: string; type: 'key' | 'node-add' | 'node-rm' | 'reassign' }[]>([]);
    const [lastKey, setLastKey] = useState<{ key: string; position: number; assignedTo: string } | null>(null);
    const nextId = useRef(0);

    const findNode = useCallback((pos: number, nodeList: RingNode[]): string => {
        const sorted = [...nodeList].sort((a, b) => a.position - b.position);
        for (const n of sorted) if (n.position >= pos) return n.name;
        return sorted[0]?.name ?? 'none';
    }, []);

    const addEvent = useCallback((msg: string, type: 'key' | 'node-add' | 'node-rm' | 'reassign') => {
        setEvents(prev => [...prev.slice(-20), { id: nextId.current++, msg, type }]);
    }, []);

    const addKey = useCallback(() => {
        if (!inputKey.trim()) return;
        const key = inputKey.trim();
        const pos = hashStr(key);
        const assignedTo = findNode(pos, nodes);
        const newKey = { key, position: pos, assignedTo };
        setKeys(prev => [...prev, newKey]);
        setLastKey(newKey);
        addEvent(`Key "${key}" → pos ${pos} → ${assignedTo}`, 'key');
        setInputKey('');
    }, [inputKey, nodes, findNode, addEvent]);

    const addNode = useCallback(() => {
        const name = inputNode.trim() || `Node-${String.fromCharCode(65 + nodes.length)}`;
        if (nodes.find(n => n.name === name)) return;
        const pos = hashStr(name);
        const color = COLORS[nodes.length % COLORS.length];
        const newNodes = [...nodes, { name, position: pos, color }];
        setNodes(newNodes);

        // Reassign keys and track how many moved
        let moved = 0;
        setKeys(prev => prev.map(k => {
            const newAssign = findNode(k.position, newNodes);
            if (newAssign !== k.assignedTo) moved++;
            return { ...k, assignedTo: newAssign };
        }));
        addEvent(`Added ${name} at pos ${pos}`, 'node-add');
        if (keys.length > 0) addEvent(`${moved}/${keys.length} keys reassigned (${((moved / keys.length) * 100).toFixed(0)}% moved)`, 'reassign');
        setInputNode('');
    }, [inputNode, nodes, findNode, addEvent, keys.length]);

    const removeNode = useCallback((name: string) => {
        const newNodes = nodes.filter(n => n.name !== name);
        setNodes(newNodes);
        let moved = 0;
        setKeys(prev => prev.map(k => {
            const newAssign = findNode(k.position, newNodes);
            if (newAssign !== k.assignedTo) moved++;
            return { ...k, assignedTo: newAssign };
        }));
        addEvent(`Removed ${name}`, 'node-rm');
        if (keys.length > 0) addEvent(`${moved}/${keys.length} keys reassigned`, 'reassign');
    }, [nodes, findNode, addEvent, keys.length]);

    const reset = () => {
        setKeys([]);
        setEvents([]);
        setLastKey(null);
    };

    // Ring rendering helpers
    const ringRadius = 110;
    const centerX = 140;
    const centerY = 140;

    const posToXY = (pos: number, r: number) => {
        const angle = ((pos / RING_SIZE) * 360 - 90) * (Math.PI / 180);
        return { x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) };
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">load balancing</span>
                <h1>Consistent Hashing</h1>
                <p className="subtitle">Map keys to a hash ring — adding/removing nodes only redistributes a minimal fraction of keys</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Nodes</span>
                    <span className="stat-value accent">{nodes.length}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Keys</span>
                    <span className="stat-value warning">{keys.length}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Ring Size</span>
                    <span className="stat-value">{RING_SIZE}</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="key to hash" className="sim-input" onKeyDown={e => e.key === 'Enter' && addKey()} />
                    <button onClick={addKey} className="btn btn-accent">Add Key</button>
                    <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                    <input value={inputNode} onChange={e => setInputNode(e.target.value)} placeholder="node name" className="sim-input" onKeyDown={e => e.key === 'Enter' && addNode()} />
                    <button onClick={addNode} className="btn">Add Node</button>
                    <button onClick={reset} className="btn" style={{ marginLeft: 'auto' }}>Clear Keys</button>
                </div>

                <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
                    {/* Ring SVG */}
                    <div style={{ flexShrink: 0 }}>
                        <svg width={centerX * 2} height={centerY * 2} style={{ display: 'block' }}>
                            {/* Ring circle */}
                            <circle cx={centerX} cy={centerY} r={ringRadius} fill="none" stroke="var(--border-bright)" strokeWidth="2" />

                            {/* Node arcs showing ownership ranges */}
                            {nodes.length > 0 && (() => {
                                const sorted = [...nodes].sort((a, b) => a.position - b.position);
                                return sorted.map((node, i) => {
                                    const startAngle = ((node.position / RING_SIZE) * 360 - 90) * (Math.PI / 180);
                                    const nextNode = sorted[(i + 1) % sorted.length];
                                    const endAngle = ((nextNode.position / RING_SIZE) * 360 - 90) * (Math.PI / 180);
                                    const startX = centerX + (ringRadius + 8) * Math.cos(startAngle);
                                    const startY = centerY + (ringRadius + 8) * Math.sin(startAngle);
                                    const endX = centerX + (ringRadius + 8) * Math.cos(endAngle);
                                    const endY = centerY + (ringRadius + 8) * Math.sin(endAngle);
                                    const largeArc = ((nextNode.position - node.position + RING_SIZE) % RING_SIZE) > RING_SIZE / 2 ? 1 : 0;
                                    return (
                                        <path key={node.name + '-arc'} d={`M ${startX} ${startY} A ${ringRadius + 8} ${ringRadius + 8} 0 ${largeArc} 1 ${endX} ${endY}`}
                                            fill="none" stroke={node.color} strokeWidth="3" opacity="0.3" />
                                    );
                                });
                            })()}

                            {/* Keys on ring */}
                            {keys.map(k => {
                                const { x, y } = posToXY(k.position, ringRadius - 20);
                                const node = nodes.find(n => n.name === k.assignedTo);
                                return (
                                    <circle key={k.key} cx={x} cy={y} r={4} fill={node?.color || 'var(--text-dim)'} opacity="0.8">
                                        <title>{k.key} → {k.assignedTo}</title>
                                    </circle>
                                );
                            })}

                            {/* Nodes on ring */}
                            {nodes.map(n => {
                                const { x, y } = posToXY(n.position, ringRadius);
                                return (
                                    <g key={n.name}>
                                        <circle cx={x} cy={y} r={10} fill={n.color} stroke="var(--bg)" strokeWidth="2" style={{ cursor: 'pointer' }} onClick={() => removeNode(n.name)}>
                                            <title>Click to remove {n.name}</title>
                                        </circle>
                                        <text x={x} y={y + 22} textAnchor="middle" fill="var(--text-dim)" fontSize="9" fontFamily="var(--font-mono)">{n.name}</text>
                                    </g>
                                );
                            })}

                            {/* Last key indicator */}
                            {lastKey && (() => {
                                const { x, y } = posToXY(lastKey.position, ringRadius - 20);
                                return <circle cx={x} cy={y} r={7} fill="none" stroke="var(--text-bright)" strokeWidth="1.5" strokeDasharray="3 2" />;
                            })()}
                        </svg>
                    </div>

                    {/* Right panel */}
                    <div style={{ flex: 1 }}>
                        {/* Node list */}
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>// nodes (click ring nodes to remove)</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                            {nodes.map(n => (
                                <button key={n.name} onClick={() => removeNode(n.name)} className="btn" style={{
                                    padding: '4px 10px', fontSize: 10,
                                    borderColor: n.color, color: n.color,
                                }}>
                                    {n.name} (pos {n.position}) ✗
                                </button>
                            ))}
                        </div>

                        {/* Key assignments */}
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>// key assignments</div>
                        <div className="log-area" style={{ maxHeight: 150 }}>
                            {keys.length === 0 && <div className="log-entry">No keys added yet.</div>}
                            {keys.map((k, i) => {
                                const node = nodes.find(n => n.name === k.assignedTo);
                                return (
                                    <div key={i} className="log-entry" style={{ color: node?.color || 'var(--text-dim)' }}>
                                        {k.key} (pos {k.position}) → {k.assignedTo}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// event log</h3>
                    <div className="log-area">
                        {events.length === 0 && <div className="log-entry">No events yet.</div>}
                        {events.slice(-12).reverse().map(e => (
                            <div key={e.id} className={`log-entry ${e.type === 'reassign' ? 'rejected' : 'allowed'}`}>
                                {e.msg}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>Hash nodes and keys onto a circular ring</li>
                        <li>Each key is assigned to the next node clockwise</li>
                        <li>Adding a node only steals keys from its neighbor</li>
                        <li>Removing a node only moves its keys to the next</li>
                        <li>Only ~K/N keys move on topology change</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// trade-offs</h3>
                    <ul>
                        <li>Minimal key redistribution on changes</li>
                        <li>Used in DynamoDB, Cassandra, CDNs</li>
                        <li className="con">Uneven distribution without virtual nodes</li>
                        <li className="con">Hash function quality matters a lot</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
