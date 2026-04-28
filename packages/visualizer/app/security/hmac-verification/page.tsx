'use client';

import { useState, useCallback } from 'react';

// Simple hash for demo purposes (not cryptographic)
function simpleHMAC(message: string, secret: string): string {
    let hash = 0;
    const combined = secret + ':' + message;
    for (let i = 0; i < combined.length; i++) {
        hash = ((hash << 5) - hash + combined.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
}

export default function HMACVerificationPage() {
    const [secret] = useState('my-secret-key-2024');
    const [message, setMessage] = useState('');
    const [signature, setSignature] = useState('');
    const [log, setLog] = useState<string[]>([]);

    const sign = useCallback(() => {
        if (!message.trim()) return;
        const sig = simpleHMAC(message.trim(), secret);
        setSignature(sig);
        setLog(prev => [...prev.slice(-15), `SIGN: HMAC("${message.trim()}") = ${sig}`]);
    }, [message, secret]);

    const verify = useCallback(() => {
        if (!message.trim() || !signature) return;
        const expected = simpleHMAC(message.trim(), secret);
        const valid = expected === signature;
        setLog(prev => [...prev.slice(-15), valid
            ? `✓ VALID: computed=${expected} matches provided=${signature}`
            : `✗ INVALID: computed=${expected} ≠ provided=${signature} — TAMPERED!`
        ]);
    }, [message, signature, secret]);

    const tamper = useCallback(() => {
        setMessage(prev => prev + ' (tampered)');
        setLog(prev => [...prev.slice(-15), '⚠ Message tampered! Signature no longer matches.']);
    }, []);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">security</span>
                <h1>HMAC Verification</h1>
                <p className="subtitle">Sign messages with a shared secret. Verify integrity by recomputing the HMAC.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <input value={message} onChange={e => setMessage(e.target.value)} placeholder="message body" className="sim-input" />
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={sign} className="sim-button">Sign</button>
                    <button onClick={verify} className="sim-button" disabled={!signature}>Verify</button>
                    <button onClick={tamper} className="sim-button" style={{ borderColor: 'var(--danger)' }} disabled={!signature}>Tamper Message</button>
                </div>
            </div>

            {signature && (
                <div style={{ fontSize: 11, marginBottom: 16, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Signature: </span>
                    <span style={{ color: 'var(--accent)' }}>{signature}</span>
                    <span style={{ color: 'var(--text-dim)' }}> | Secret: </span>
                    <span style={{ color: 'var(--info)' }}>{secret}</span>
                </div>
            )}

            <div className="info-panel">
                <h3>// verification log</h3>
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: l.includes('✗') ? 'var(--danger)' : l.includes('✓') ? 'var(--accent)' : 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
