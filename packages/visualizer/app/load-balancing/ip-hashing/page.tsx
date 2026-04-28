'use client';

import { useState, useCallback } from 'react';

const SERVERS = ['Server A', 'Server B', 'Server C', 'Server D'];

function hashIP(ip: string): number {
    let h = 0;
    for (let i = 0; i < ip.length; i++) h = (h * 31 + ip.charCodeAt(i)) >>> 0;
    return h % SERVERS.length;
}

export default function IPHashingPage() {
    const [requests, setRequests] = useState<{ ip: string; server: string }[]>([]);
    const [counts, setCounts] = useState<number[]>(new Array(SERVERS.length).fill(0));
    const [inputIP, setInputIP] = useState('');
    const [log, setLog] = useState<string[]>([]);

    const send = useCallback(() => {
        const ip = inputIP.trim() || `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        const idx = hashIP(ip);
        setRequests(prev => [...prev.slice(-20), { ip, server: SERVERS[idx] }]);
        setCounts(prev => prev.map((c, i) => i === idx ? c + 1 : c));
        setLog(prev => [...prev.slice(-15), `${ip} → hash=${hashIP(ip)} → ${SERVERS[idx]}`]);
        setInputIP('');
    }, [inputIP]);

    const sendRandom = useCallback(() => {
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                const ip = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
                const idx = hashIP(ip);
                setRequests(prev => [...prev.slice(-20), { ip, server: SERVERS[idx] }]);
                setCounts(prev => prev.map((c, j) => j === idx ? c + 1 : c));
                setLog(prev => [...prev.slice(-15), `${ip} → ${SERVERS[idx]}`]);
            }, i * 100);
        }
    }, []);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">load balancing</span>
                <h1>IP Hashing</h1>
                <p className="subtitle">Hash client IP to deterministically route to the same server — session affinity without shared state.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input value={inputIP} onChange={e => setInputIP(e.target.value)} placeholder="IP (or random)" className="sim-input" onKeyDown={e => e.key === 'Enter' && send()} />
                <button onClick={send} className="sim-button">Send</button>
                <button onClick={sendRandom} className="sim-button">Random Burst (6)</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                {SERVERS.map((s, i) => (
                    <div key={i} style={{ padding: '12px', textAlign: 'center', borderRadius: 'var(--radius)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 12 }}>{s}</div>
                        <div style={{ fontSize: 20, color: 'var(--accent)', marginTop: 4 }}>{counts[i]}</div>
                    </div>
                ))}
            </div>

            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
