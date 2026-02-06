'use client';

import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();

    return (
        <header className="app-header" style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
            padding: '1rem 2rem',
            marginBottom: '2rem',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            {/* Right Side: Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.05)'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                </div>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>
                        שו"ב טקטי
                    </h1>
                </div>
            </div>

            {/* Left Side: Navigation */}
            <nav style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '0.25rem',
                borderRadius: '0.75rem',
                display: 'flex',
                gap: '0.25rem',
                backdropFilter: 'blur(10px)'
            }}>
                <NavLink href="/" label="ראשי" active={pathname === '/'} />
                <NavLink href="/constraints" label="עריכה ואילוצים" active={pathname === '/constraints'} />
                <NavLink href="/team" label="ניהול כוננים" active={pathname === '/team'} />
            </nav>
        </header>
    );
}

function NavLink({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
    return (
        <a href={href} style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            background: active ? 'white' : 'transparent',
            color: active ? '#4f46e5' : 'white',
            boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            opacity: active ? 1 : 0.8
        }}
            onMouseEnter={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.opacity = '1';
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.opacity = '0.8';
                }
            }}
        >
            {label}
        </a>
    );
}
