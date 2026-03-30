'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
    label: string;
    href: string;
}

interface NavSection {
    title: string;
    href: string;
    items: NavItem[];
}

const NAV: NavSection[] = [
    {
        title: 'Rate Limiting',
        href: '/rate-limiting',
        items: [
            { label: 'Fixed Window Counter', href: '/rate-limiting/fixed-window-counter' },
            { label: 'Sliding Window Log', href: '/rate-limiting/sliding-window-log' },
            { label: 'Sliding Window Counter', href: '/rate-limiting/sliding-window-counter' },
            { label: 'Token Bucket', href: '/rate-limiting/token-bucket' },
            { label: 'Leaky Bucket', href: '/rate-limiting/leaky-bucket' },
        ],
    },
    {
        title: 'Resilience',
        href: '/resilience',
        items: [
            { label: 'Circuit Breaker', href: '/resilience/circuit-breaker' },
            { label: 'Retry with Backoff', href: '/resilience/retry-with-backoff' },
            { label: 'Timeout Wrapper', href: '/resilience/timeout-wrapper' },
            { label: 'Bulkhead', href: '/resilience/bulkhead' },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [openSections, setOpenSections] = useState<Record<string, boolean>>(
        Object.fromEntries(NAV.map(s => [s.title, true]))
    );

    const toggle = (title: string) => {
        setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
    };

    return (
        <nav style={{
            width: 240,
            minWidth: 240,
            borderRight: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <Link href="/" style={{
                padding: '20px 16px',
                borderBottom: '1px solid var(--border)',
                textDecoration: 'none',
                display: 'block',
            }}>
                <div style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--accent)',
                    letterSpacing: -0.5,
                }}>
                    sys-d
                </div>
                <div style={{
                    fontSize: 10,
                    color: 'var(--text-dim)',
                    marginTop: 2,
                }}>
          // distributed systems lab
                </div>
            </Link>

            {/* Navigation */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
                {NAV.map(section => (
                    <div key={section.title} style={{ marginBottom: 4 }}>
                        <button
                            onClick={() => toggle(section.title)}
                            style={{
                                width: '100%',
                                background: 'none',
                                border: 'none',
                                padding: '6px 16px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontFamily: 'var(--font-mono)',
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--text-dim)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                textAlign: 'left',
                            }}
                        >
                            <span style={{
                                display: 'inline-block',
                                transition: 'transform 150ms ease',
                                transform: openSections[section.title] ? 'rotate(90deg)' : 'rotate(0deg)',
                                fontSize: 10,
                            }}>
                                ▶
                            </span>
                            {section.title}
                        </button>

                        {openSections[section.title] && (
                            <div>
                                {section.items.map(item => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            style={{
                                                display: 'block',
                                                padding: '5px 16px 5px 32px',
                                                fontSize: 12,
                                                color: isActive ? 'var(--accent)' : 'var(--text)',
                                                background: isActive ? 'var(--accent-glow)' : 'transparent',
                                                borderRight: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                                                textDecoration: 'none',
                                                transition: 'all 150ms ease',
                                            }}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border)',
                fontSize: 10,
                color: 'var(--text-dim)',
            }}>
                v1.0 · MIT
            </div>
        </nav>
    );
}
