'use client';

import { useState, useCallback } from 'react';

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
  const [lastResult, setLastResult] = useState<'valid' | 'invalid' | null>(null);

  const sign = useCallback(() => {
    if (!message.trim()) return;
    const sig = simpleHMAC(message.trim(), secret);
    setSignature(sig);
    setLastResult(null);
    setLog(prev => [...prev.slice(-20), `SIGN: HMAC("${message.trim().slice(0, 30)}${message.length > 30 ? '...' : ''}") = ${sig}`]);
  }, [message, secret]);

  const verify = useCallback(() => {
    if (!message.trim() || !signature) return;
    const expected = simpleHMAC(message.trim(), secret);
    const valid = expected === signature;
    setLastResult(valid ? 'valid' : 'invalid');
    setLog(prev => [
      ...prev.slice(-20),
      valid
        ? `✓ VALID: computed=${expected} matches signature=${signature}`
        : `✗ INVALID: computed=${expected} ≠ signature=${signature} — MESSAGE TAMPERED!`
    ]);
  }, [message, signature, secret]);

  const tamper = useCallback(() => {
    if (!message) return;
    setMessage(prev => prev + ' [tampered]');
    setLastResult(null);
    setLog(prev => [...prev.slice(-20), '⚠ Message modified! Signature now invalid.']);
  }, [message]);

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">security</span>
        <h1>HMAC Verification</h1>
        <p className="subtitle">
          Sign messages with a shared secret. Verify integrity by recomputing the HMAC.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">signature</span>
          <span className="stat-value" style={{ fontFamily: 'var(--font-mono)' }}>
            {signature || '-'}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">status</span>
          <span className="stat-value" style={{
            color: lastResult === 'valid' ? 'var(--accent)' : lastResult === 'invalid' ? 'var(--danger)' : 'var(--text-dim)'
          }}>
            {lastResult === 'valid' ? '✓ VALID' : lastResult === 'invalid' ? '✗ TAMPERED' : 'pending'}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Enter message to sign..."
            className="sim-input"
            style={{ width: '100%' }}
          />
        </div>
        <div className="viz-controls">
          <button onClick={sign} className="btn btn-accent">Sign</button>
          <button onClick={verify} className="btn" disabled={!signature}>Verify</button>
          <button onClick={tamper} className="btn" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} disabled={!signature}>
            Tamper Message
          </button>
        </div>
      </div>

      {signature && (
        <div className="viz-container" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{
              padding: 12,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)'
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>Message:</div>
              <div style={{ fontSize: 12, color: 'var(--text-bright)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                {message}
              </div>
            </div>
            <div style={{
              padding: 12,
              background: 'var(--surface-2)',
              border: `1px solid ${lastResult === 'valid' ? 'var(--accent)' : lastResult === 'invalid' ? 'var(--danger)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)'
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>Secret:</div>
              <div style={{ fontSize: 11, color: 'var(--info)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                {secret}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>Signature:</div>
              <div style={{ fontSize: 14, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {signature}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="info-panel">
        <h3>// verification log</h3>
        <div className="log-area">
          {log.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>No operations yet</div>
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
            <li>HMAC = Hash(secret + message)</li>
            <li>Sender computes HMAC, attaches to message</li>
            <li>Receiver recomputes HMAC with shared secret</li>
            <li>Match → message intact; mismatch → tampered</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Webhook signature verification (Stripe, GitHub)</li>
            <li>API request authentication</li>
            <li>JWT signature (HS256)</li>
            <li>Message integrity in transit</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
