import Link from 'next/link';

const patterns = [
    { name: 'JWT Validation', href: '/security/jwt-validation', desc: 'Decode and verify JSON Web Tokens. Validate signature, expiry, issuer, and claims without shared state.' },
    { name: 'API Key Validation', href: '/security/api-key-validation', desc: 'Authenticate requests via API keys. Simple, stateless auth for service-to-service communication.' },
    { name: 'Idempotency Key', href: '/security/idempotency-key', desc: 'Deduplicate requests using a unique key. Safely retry operations without causing duplicate side effects.' },
    { name: 'HMAC Verification', href: '/security/hmac-verification', desc: 'Verify message integrity and authenticity using a shared secret. Detect tampering in webhooks and APIs.' },
];

export default function SecurityPage() {
    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">security</span>
                <h1>Security Patterns</h1>
                <p className="subtitle">Authentication, integrity verification, and safe request handling for distributed services.</p>
            </div>
            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// concept</h3>
                <p>Security in distributed systems involves verifying identity (authn), integrity (HMAC), and ensuring safe retries (idempotency) — all without centralized coordination.</p>
            </div>
            <div className="cards-grid">
                {patterns.map(p => (<Link key={p.href} href={p.href} className="concept-card"><h3>{p.name}</h3><p>{p.desc}</p></Link>))}
            </div>
        </div>
    );
}
