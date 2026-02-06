'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, RefreshCw, Maximize2, X, User } from 'lucide-react';

interface ScoreData {
    name: string;
    score: number;
    breakdown: {
        weekend: number;
        partial: number;
        midweek: number;
    };
}

export default function JusticeTable() {
    const [scores, setScores] = useState<ScoreData[]>([]);
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedUser, setSelectedUser] = useState<ScoreData | null>(null);
    const [showInfo, setShowInfo] = useState(false);

    const fetchScores = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/scores');
            const data = await res.json();
            setScores(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScores();
        // Refresh every minute to stay synced with table edits
        const interval = setInterval(fetchScores, 60000);
        return () => clearInterval(interval);
    }, []);

    const openModal = () => {
        setIsExpanded(true);
        if (scores.length > 0 && !selectedUser) {
            setSelectedUser(scores[0]);
        }
    };

    return (
        <>
            <div className="card glass" style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="icon-box" style={{ background: '#f0fdf4', color: '#16a34a', width: '2.5rem', height: '2.5rem' }}>
                            <Award size={20} />
                        </div>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937' }}>טבלת צדק</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setShowInfo(true)}
                            className="btn-icon"
                            title="איך החישוב עובד?"
                            style={{ background: '#dbeafe', color: '#1d4ed8' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4" />
                                <path d="M12 8h.01" />
                            </svg>
                        </button>
                        <button
                            onClick={fetchScores}
                            className="btn-icon"
                            disabled={loading}
                            title="רענן ניקוד"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={openModal}
                            className="btn-icon"
                            title="הרחב ופרט"
                        >
                            <Maximize2 size={18} />
                        </button>
                    </div>
                </div>

                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
                    {scores.map((item, index) => (
                        <motion.div
                            key={item.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '0.5rem',
                                background: index < 3 ? 'linear-gradient(to left, rgba(255,255,255,0.8), rgba(255,255,255,0.4))' : 'rgba(255,255,255,0.3)',
                                border: '1px solid rgba(255,255,255,0.5)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{
                                    width: '1.25rem', height: '1.25rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '50%',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'rgba(0,0,0,0.05)',
                                    color: index < 3 ? 'white' : '#64748b'
                                }}>
                                    {index + 1}
                                </span>
                                <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>{item.name}</span>
                            </div>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                                {item.score}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Info Modal */}
            <AnimatePresence>
                {showInfo && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
                            onClick={() => setShowInfo(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="card glass"
                            style={{ position: 'relative', width: '100%', maxWidth: '600px', background: 'white', padding: '2rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 16v-4" />
                                            <path d="M12 8h.01" />
                                        </svg>
                                    </div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>איך החישוב עובד?</h2>
                                </div>
                                <button onClick={() => setShowInfo(false)} className="btn-icon"><X size={24} /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '0.75rem', borderRight: '4px solid #f59e0b' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ background: '#f59e0b', color: 'white', width: '1.5rem', height: '1.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 800 }}>2</span>
                                        סופי שבוע/חגים
                                    </h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                        <strong>2 נקודות</strong> עבור כל משמרת ב:
                                    </p>
                                    <ul style={{ marginTop: '0.5rem', marginRight: '1.5rem', color: '#475569', fontSize: '0.875rem', lineHeight: '1.8' }}>
                                        <li>שישי - יום או לילה</li>
                                        <li>שבת - יום בלבד</li>
                                    </ul>
                                </div>

                                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '0.75rem', borderRight: '4px solid #8b5cf6' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ background: '#8b5cf6', color: 'white', width: '1.5rem', height: '1.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>1.5</span>
                                        חמישי/שבת לילה
                                    </h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                        <strong>1.5 נקודות</strong> עבור כל משמרת ב:
                                    </p>
                                    <ul style={{ marginTop: '0.5rem', marginRight: '1.5rem', color: '#475569', fontSize: '0.875rem', lineHeight: '1.8' }}>
                                        <li>חמישי - לילה בלבד</li>
                                        <li>שבת - לילה בלבד</li>
                                    </ul>
                                </div>

                                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '0.75rem', borderRight: '4px solid #3b82f6' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ background: '#3b82f6', color: 'white', width: '1.5rem', height: '1.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 800 }}>1</span>
                                        חול
                                    </h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                        <strong>נקודה אחת</strong> עבור כל משמרת אחרת
                                    </p>
                                    <ul style={{ marginTop: '0.5rem', marginRight: '1.5rem', color: '#475569', fontSize: '0.875rem', lineHeight: '1.8' }}>
                                        <li>ראשון עד רביעי - יום או לילה</li>
                                        <li>חמישי - יום בלבד</li>
                                    </ul>
                                </div>

                                <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: '#92400e', lineHeight: '1.6' }}>
                                        <strong>💡 למה?</strong> הניקוד משקף את "העומס" של המשמרת - סופי שבוע וחגים קשים יותר, ולכן שווים יותר נקודות
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal */}
            <AnimatePresence>
                {isExpanded && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
                            onClick={() => setIsExpanded(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="card glass"
                            style={{ position: 'relative', width: '100%', maxWidth: '900px', height: '600px', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'white' }}
                        >
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>פירוט ניקוד וכוננויות</h2>
                                <button onClick={() => setIsExpanded(false)} className="btn-icon"><X size={24} /></button>
                            </div>

                            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                                {/* Sidebar */}
                                <div className="custom-scrollbar" style={{ width: '250px', borderLeft: '1px solid #e2e8f0', overflowY: 'auto', padding: '1rem' }}>
                                    {scores.map(user => (
                                        <button
                                            key={user.name}
                                            onClick={() => setSelectedUser(user)}
                                            style={{
                                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '0.75rem 1rem', marginBottom: '0.5rem', borderRadius: '0.5rem',
                                                background: selectedUser?.name === user.name ? '#eff6ff' : 'transparent',
                                                color: selectedUser?.name === user.name ? '#1d4ed8' : '#64748b',
                                                fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                                textAlign: 'right'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <User size={18} />
                                                {user.name}
                                            </div>
                                            <span style={{ fontWeight: 700 }}>{user.score}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Main Content */}
                                <div style={{ flex: 1, padding: '2rem', background: '#f8fafc', overflowY: 'auto' }}>
                                    {selectedUser ? (
                                        <div>
                                            <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', color: '#0f172a' }}>{selectedUser.name}</h3>


                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                                <div className="card" style={{ padding: '1.5rem', background: 'white', borderTop: '4px solid #f59e0b', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                                    <h4 style={{ color: '#64748b', fontWeight: 600, marginBottom: '0.5rem', minHeight: '2rem', display: 'flex', alignItems: 'center' }}>חגים/סופי שבוע (2)</h4>
                                                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1rem', minHeight: '2.5rem' }}>שישי יום/לילה, שבת יום</p>
                                                    <p style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a' }}>{selectedUser.breakdown.weekend}</p>
                                                </div>

                                                <div className="card" style={{ padding: '1.5rem', background: 'white', borderTop: '4px solid #8b5cf6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                                    <h4 style={{ color: '#64748b', fontWeight: 600, marginBottom: '0.5rem', minHeight: '2rem', display: 'flex', alignItems: 'center' }}>חמישי/שבת לילה (1.5)</h4>
                                                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1rem', minHeight: '2.5rem' }}>חמישי לילה, שבת לילה</p>
                                                    <p style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a' }}>{selectedUser.breakdown.partial}</p>
                                                </div>

                                                <div className="card" style={{ padding: '1.5rem', background: 'white', borderTop: '4px solid #3b82f6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                                    <h4 style={{ color: '#64748b', fontWeight: 600, marginBottom: '0.5rem', minHeight: '2rem', display: 'flex', alignItems: 'center' }}>אמצע שבוע (1)</h4>
                                                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1rem', minHeight: '2.5rem' }}>כל שאר המשמרות</p>
                                                    <p style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a' }}>{selectedUser.breakdown.midweek}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                            בחר כונן לצפייה בפרטים
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
