'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Phone, Building2, MapPin, Ban } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { motion } from 'framer-motion';

interface ShiftDetails {
    names: string[];
    mode: string;
}

const MODES_CONFIG: Record<string, { label: string; icon: any; bg: string; color: string }> = {
    'phone': { label: 'טלפוני', icon: Phone, bg: '#e0f2fe', color: '#0ea5e9' },
    'offices': { label: 'משרדים', icon: Building2, bg: '#f3e8ff', color: '#8b5cf6' },
    'kirya': { label: 'קריה', icon: MapPin, bg: '#d1fae5', color: '#10b981' },
};

export default function CurrentStatus() {
    const [currentShift, setCurrentShift] = useState<{
        role: string;
        people: string[];  // Changed from person to people
        mode: string;
        icon: React.ReactNode;
        colorClass: string;
    } | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            const now = new Date();
            const hour = now.getHours();

            let queryDate = now;
            let shiftType: 'morning' | 'main' | 'night' = 'main';

            if (hour >= 8 && hour < 20) {
                shiftType = 'main';
            } else {
                shiftType = 'night';
                if (hour < 8) {
                    queryDate = subDays(now, 1);
                }
            }

            try {
                const start = startOfDay(queryDate).toISOString();
                const end = endOfDay(queryDate).toISOString();
                const res = await fetch(`/api/schedule?start=${start}&end=${end}`);
                const data = await res.json();

                if (data && data.length > 0 && data[0].shifts) {
                    const shift = data[0].shifts[shiftType] as ShiftDetails;
                    const names = shift?.names || [];
                    const mode = shift?.mode || 'phone';

                    const modeConfig = MODES_CONFIG[mode] || MODES_CONFIG['phone'];
                    const Icon = modeConfig.icon;

                    setCurrentShift({
                        role: shiftType === 'night' ? 'לילה' : 'יום',
                        people: names,
                        mode: mode,  // Store the mode ID, not the label
                        icon: <Icon size={24} />,
                        colorClass: modeConfig.color
                    });
                } else {
                    setCurrentShift(null);
                }
            } catch (e) {
                console.error("Failed to fetch status", e);
                setCurrentShift(null);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    if (!currentShift) return (
        <div className="card glass widget-container" style={{ minHeight: '200px', alignItems: 'center', justifyContent: 'center' }}>
            <span className="opacity-50">טוען נתונים...</span>
        </div>
    );

    const activeModeConfig = MODES_CONFIG[currentShift.mode];

    return (
        <div className="card glass widget-container" style={{ overflow: 'hidden' }}>
            {/* Widget Header */}
            <div className="widget-header" style={{ padding: '1.5rem 1.5rem 0 1.5rem' }}>
                <div className="icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                    <activeModeConfig.icon size={24} />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>כונן נוכחי</h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        סטטוס: {activeModeConfig.label}
                    </p>
                </div>
            </div>

            {/* Widget Content */}
            <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                        background: activeModeConfig.bg,
                        padding: '1.5rem',
                        borderRadius: '1rem',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ position: 'relative', zIndex: 10 }}>
                        <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                            {currentShift.people.length > 0 ? currentShift.people.join(', ') : 'אין שיבוץ'}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                                background: 'rgba(255,255,255,0.6)',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '999px',
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                color: activeModeConfig.color
                            }}>
                                {currentShift.role}
                            </span>
                            {currentShift.people.length > 1 && (
                                <span style={{ fontSize: '0.875rem', color: '#475569' }}>
                                    (+{currentShift.people.length - 1} נוספים)
                                </span>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
