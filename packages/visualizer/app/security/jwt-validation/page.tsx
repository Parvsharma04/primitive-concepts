'use client';

import { useState, useCallback } from 'react';

function base64url(obj: object): string {
    return btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export default function JWTValidationPage() {
    const [log, setLog] = useState<string[]>([]);
    const [token, setToken] = useState('');
    const [decoded, setDecoded] = useState<{ header: object; payload: object; valid: boolean } | null>(null);

    const generate = useCallback(() => {
        const header = { alg: 'HS256', typ: 'JWT' };
        const payload = { sub: 'user_123', iss: 'auth-service', exp: Math.floor(Date.now() / 1000) + 3600, role: 'admin' };
        const sig = base64url({ verified: true });
        const jwt = `${base64url(header)}.${base64url(payload)}.${sig}`;
        setToken(jwt);
        setDecoded({ header, payload, valid: true });
        setLog(prev => [...prev.slice(-10), 'Generated valid JWT (HS256, exp: +1h)']);
    }, []);

    const generateExpired = useCallback(() => {
        const header = { alg: 'HS256', typ: 'JWT' };
        const payload = { sub: 'user_456', iss: 'auth-service', exp: Math.floor(Date.now() / 1000) - 60, role: 'user' };
        const sig = base64url({ verified: false });
        const jwt = `${base64url(header)}.${base64url(payload)}.${sig}`;
        setToken(jwt);
        setDecoded({ header, payload, valid: false });
        setLog(prev => [...prev.slice(-10), '⚠ Generated EXPIRED JWT']);
    }, []);

    const validate = useCallback(() => {
        if (!decoded) return;
        const exp = (decoded.payload as { exp?: number }).exp ?? 0;
        const isExpired = exp < Date.now() / 1000;
        setLog(prev => [...prev.slice(-10), isExpired ? '✗ INVALID: token expired' : '✓ VALID: signature OK, not expired']);
    }, [decoded]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">security</span>
                <h1>JWT Validation</h1>
                <p className="subtitle">Decode and verify JSON Web Tokens — check signature, expiry, and claims.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <button onClick={generate} className="sim-button">Generate Valid JWT</button>
                <button onClick={generateExpired} className="sim-button">Generate Expired</button>
                <button onClick={validate} className="sim-button" disabled={!decoded}>Validate</button>
            </div>

            {token && <div style={{ fontSize: 10, padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 12, wordBreak: 'break-all', color: 'var(--text-dim)' }}>{token}</div>}

            {decoded && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div className="info-panel" style={{ padding: 8 }}>
                        <h3 style={{ fontSize: 11, color: 'var(--info)' }}>// header</h3>
                        <pre style={{ fontSize: 10, color: 'var(--text-dim)' }}>{JSON.stringify(decoded.header, null, 2)}</pre>
                    </div>
                    <div className="info-panel" style={{ padding: 8 }}>
                        <h3 style={{ fontSize: 11, color: 'var(--accent)' }}>// payload</h3>
                        <pre style={{ fontSize: 10, color: 'var(--text-dim)' }}>{JSON.stringify(decoded.payload, null, 2)}</pre>
                    </div>
                </div>
            )}

            <div className="info-panel">
                <h3>// validation log</h3>
                <div style={{ maxHeight: 150, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: l.includes('✗') ? 'var(--danger)' : l.includes('✓') ? 'var(--accent)' : 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
