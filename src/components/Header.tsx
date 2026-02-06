'use client';

import { usePathname } from 'next/navigation';
import { Menu, X, LogIn, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from './LoginModal';

export default function Header() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const { isAuthenticated, username, logout } = useAuth();

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <header className="app-header" style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
            padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
            marginBottom: '2rem',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative'
        }}>
            {/* Right Side: Title + Hamburger (mobile) or just Title (desktop) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Mobile: Hamburger Button */}
                {isMobile && (
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            minWidth: '40px',
                            minHeight: '40px'
                        }}
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                )}

                {/* Desktop: Icon */}
                {!isMobile && (
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                    </div>
                )}

                <div>
                    <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>
                        שו"ב טקטי
                    </h1>
                </div>
            </div>

            {/* Desktop Navigation */}
            {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

                    {/* Desktop Auth */}
                    {isAuthenticated ? (
                        <>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem'
                            }}>
                                <User size={16} />
                                <span>{username}</span>
                            </div>
                            <button
                                onClick={logout}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: 'white',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    minHeight: '36px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            >
                                <LogOut size={16} />
                                התנתק
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setShowLoginModal(true)}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: 'white',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                minHeight: '36px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        >
                            <LogIn size={16} />
                            התחבר
                        </button>
                    )}
                </div>
            )}

            {/* Mobile Menu Dropdown */}
            {isMobile && isMobileMenuOpen && (
                <nav style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.5rem',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    borderRadius: '0.75rem',
                    padding: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)',
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                }}>
                    <NavLink href="/" label="ראשי" active={pathname === '/'} onClick={() => setIsMobileMenuOpen(false)} />
                    <NavLink href="/constraints" label="עריכה ואילוצים" active={pathname === '/constraints'} onClick={() => setIsMobileMenuOpen(false)} />
                    <NavLink href="/team" label="ניהול כוננים" active={pathname === '/team'} onClick={() => setIsMobileMenuOpen(false)} />

                    {/* Divider */}
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '0.25rem 0' }} />

                    {/* Mobile Auth */}
                    {isAuthenticated ? (
                        <>
                            <div style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                background: 'rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                color: 'white'
                            }}>
                                <User size={16} />
                                <span>{username}</span>
                            </div>
                            <button
                                onClick={() => {
                                    logout();
                                    setIsMobileMenuOpen(false);
                                }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    textAlign: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <LogOut size={16} />
                                התנתק
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => {
                                setShowLoginModal(true);
                                setIsMobileMenuOpen(false);
                            }}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                textAlign: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <LogIn size={16} />
                            התחבר
                        </button>
                    )}
                </nav>
            )}

            {/* Login Modal */}
            {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
        </header>
    );
}

function NavLink({ href, label, active = false, onClick }: { href: string; label: string; active?: boolean; onClick?: () => void }) {
    return (
        <a href={href} onClick={onClick} style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            background: active ? 'white' : 'transparent',
            color: active ? '#4f46e5' : 'white',
            boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            opacity: active ? 1 : 0.8,
            display: 'block',
            textAlign: 'center'
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
