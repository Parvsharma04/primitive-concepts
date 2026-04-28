'use client';

import { useState, useCallback } from 'react';

const VALID_KEYS: Record<string, { name: string; permissions: string[] }> = {
    'sk_live_abc123': { name: 'Frontend App', permissions: ['read'] },
    'sk_live_xyz789': { name: 'Admin Service', permissions: ['read', 'write', 'delete'] },
};

export default function APIKeyValidationPage() {
    const [inputKey, setInputKey] = useState('');
    const [log, setLog] = useState<string[]>([]);

    const validate = useCallback(() => {
        const key = inputKey.trim();
        if (!key) return;
        const entry = VALID_KEYS[key];
        if (entry) {
            setLog(prev => [...prev.slice(-15), `✓ VALID: "${entry.name}" — permissions: [${entry.permissions.join(', ')}]`]);
        } else {
            setLog(prev => [...prev.slice(-15), `✗ INVALID: key "${key}" not recognized — 401 Unauthorized`]);
        }
        setInputKey('');
    }, [inputKey]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">security</span>
                <h1>API Key Validation</h1>
                <p className="subtitle">Authenticate requests by matching the provided key against a registry of valid keys.</p>
            </div>

            <div className="info-panel" style={{ marginBottom: 16 }}>
                <h3>// valid keys</h3>
                {Object.entries(VALID_KEYS).map(([key, val]) => (
                    <div key={key} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>
                        <span style={{ color: 'var(--accent)' }}>{key}</span> → {val.name} [{val.permissions.join(', ')}]
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="Enter API key" className="sim-input" style={{ width: 250 }} onKeyDown={e => e.key === 'Enter' && validate()} />
                <button onClick={validate} className="sim-button">Validate</button>
            </div>

            <div className="info-panel">
                <h3>// validation log</h3>
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: l.includes('✗') ? 'var(--danger)' : 'var(--accent)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
