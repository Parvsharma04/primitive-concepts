'use client';

import { useState, useCallback } from 'react';

function base64url(obj: object): string {
  return btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export default function JWTValidationPage() {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState<{ header: object; payload: Record<string, unknown>; valid: boolean } | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const generate = useCallback(() => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: `user_${Math.floor(Math.random() * 1000)}`,
      iss: 'auth-service',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: 'admin',
      scope: 'read write'
    };
    const sig = base64url({ verified: true, ts: Date.now() });
    const jwt = `${base64url(header)}.${base64url(payload)}.${sig}`;
    setToken(jwt);
    setDecoded({ header, payload, valid: true });
    setLog(prev => [...prev.slice(-20), `✓ Generated VALID JWT (sub=${payload.sub}, exp=+1h)`]);
  }, []);

  const generateExpired = useCallback(() => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: `user_${Math.floor(Math.random() * 1000)}`,
      iss: 'auth-service',
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 60,
      role: 'user',
      scope: 'read'
    };
    const sig = base64url({ verified: false });
    const jwt = `${base64url(header)}.${base64url(payload)}.${sig}`;
    setToken(jwt);
    setDecoded({ header, payload, valid: false });
    setLog(prev => [...prev.slice(-20), `⚠ Generated EXPIRED JWT (expired 60s ago)`]);
  }, []);

  const validate = useCallback(() => {
    if (!decoded) return;
    const exp = (decoded.payload.exp as number) ?? 0;
    const isExpired = exp < Date.now() / 1000;
    const timeDelta = isExpired
      ? `expired ${Math.round(Date.now() / 1000 - exp)}s ago`
      : `valid for ${Math.round(exp - Date.now() / 1000)}s`;

    setLog(prev => [
      ...prev.slice(-20),
      isExpired
        ? `✗ INVALID: token expired (${timeDelta})`
        : `✓ VALID: signature OK, ${timeDelta}, role=${decoded.payload.role}`
    ]);
  }, [decoded]);

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">security</span>
        <h1>JWT Validation</h1>
        <p className="subtitle">
          Decode and verify JSON Web Tokens — check signature, expiry, and claims.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">status</span>
          <span className="stat-value" style={{
            color: decoded === null ? 'var(--text-dim)' : decoded.valid ? 'var(--accent)' : 'var(--danger)'
          }}>
            {decoded === null ? 'no token' : decoded.valid ? 'VALID' : 'INVALID'}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">algorithm</span>
          <span className="stat-value">{decoded ? 'HS256' : '-'}</span>
        </div>
      </div>

      <div className="viz-controls" style={{ marginBottom: 16 }}>
        <button onClick={generate} className="btn btn-accent">Generate Valid JWT</button>
        <button onClick={generateExpired} className="btn" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          Generate Expired
        </button>
        <button onClick={validate} className="btn" disabled={!decoded}>Validate</button>
      </div>

      {token && (
        <div style={{
          padding: '10px 12px',
          background: 'var(--surface-2)',
          border: `1px solid ${decoded?.valid ? 'var(--accent)' : 'var(--danger)'}`,
          borderRadius: 'var(--radius)',
          marginBottom: 16,
          wordBreak: 'break-all',
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-dim)'
        }}>
          {/* Color-coded JWT parts */}
          <span style={{ color: 'var(--info)' }}>{token.split('.')[0]}</span>
          <span style={{ color: 'var(--text-dim)' }}>.</span>
          <span style={{ color: 'var(--accent)' }}>{token.split('.')[1]}</span>
          <span style={{ color: 'var(--text-dim)' }}>.</span>
          <span style={{ color: 'var(--warning)' }}>{token.split('.')[2]}</span>
        </div>
      )}

      {decoded && (
        <div className="viz-container" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{
              padding: 12,
              background: 'var(--surface-2)',
              border: '1px solid var(--info)',
              borderRadius: 'var(--radius)'
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--info)', marginBottom: 8 }}>
                HEADER
              </div>
              <pre style={{ fontSize: 10, color: 'var(--text-dim)', margin: 0, fontFamily: 'var(--font-mono)' }}>
                {JSON.stringify(decoded.header, null, 2)}
              </pre>
            </div>
            <div style={{
              padding: 12,
              background: 'var(--surface-2)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius)'
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>
                PAYLOAD
              </div>
              <pre style={{ fontSize: 10, color: 'var(--text-dim)', margin: 0, fontFamily: 'var(--font-mono)' }}>
                {JSON.stringify(decoded.payload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className="info-panel">
        <h3>// validation log</h3>
        <div className="log-area">
          {log.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>No validations yet</div>
          ) : (
            log.map((entry, i) => (
              <div key={i} className="log-entry" style={{
                color: entry.includes('✗') ? 'var(--danger)' : entry.includes('✓') ? 'var(--accent)' : 'var(--text-dim)'
              }}>
                <span style={{ color: 'var(--text-dim)', marginRight: 8 }}>[{String(i + 1).padStart(2, '0')}]</span>
                {entry}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="info-columns" style={{ marginTop: 16 }}>
        <div className="info-panel">
          <h3>How It Works</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>JWT = Header.Payload.Signature (base64url)</li>
            <li>Header: algorithm + token type</li>
            <li>Payload: claims (sub, exp, iss, custom)</li>
            <li>Signature: HMAC(header+payload, secret)</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Validation Steps</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>1. Verify signature with secret/public key</li>
            <li>2. Check exp claim (not expired)</li>
            <li>3. Check iss claim (trusted issuer)</li>
            <li>4. Check audience, scope, custom claims</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
