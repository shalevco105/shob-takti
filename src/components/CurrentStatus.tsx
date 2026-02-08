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
        people: string[];
        secondPeople: string[];
        mode: string;
        icon: React.ReactNode;
        color: string;
    } | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            const now = new Date();
            const hour = now.getHours();

            let queryDate = now;
            let shiftType: 'day' | 'night' = (hour >= 8 && hour < 20) ? 'day' : 'night';

            if (hour < 8) {
                queryDate = subDays(now, 1);
            }

            try {
                const dateKey = format(queryDate, 'yyyy-MM-dd');
                const start = `${dateKey}T00:00:00Z`;
                const end = `${dateKey}T23:59:59Z`;
                const res = await fetch(`/api/schedule?start=${start}&end=${end}`);
                const data = await res.json();

                if (data && data.length > 0 && data[0].shifts) {
                    const shifts = data[0].shifts;
                    const mainShift = shifts[shiftType] as ShiftDetails;
                    const secondShift = shifts.second as ShiftDetails;

                    const mode = mainShift?.mode || 'phone';
                    const modeConfig = MODES_CONFIG[mode] || MODES_CONFIG['phone'];
                    const Icon = modeConfig.icon;

                    setCurrentShift({
                        role: shiftType === 'night' ? 'לילה' : 'ראשי',
                        people: mainShift?.names || [],
                        secondPeople: secondShift?.names || [],
                        mode: mode,
                        icon: <Icon size={20} />,
                        color: modeConfig.color
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
        <div className="card glass widget-container" style={{ minHeight: '160px', alignItems: 'center', justifyContent: 'center' }}>
            <span className="opacity-50" style={{ fontSize: '0.875rem' }}>טוען נתונים...</span>
        </div>
    );

    const activeModeConfig = MODES_CONFIG[currentShift.mode];

    return (
        <div className="card glass widget-container" style={{ padding: '1.25rem', gap: '1rem', background: '#fff' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        background: activeModeConfig.bg,
                        color: activeModeConfig.color,
                        padding: '0.5rem',
                        borderRadius: '0.75rem',
                        display: 'flex'
                    }}>
                        <activeModeConfig.icon size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.125rem' }}>כונן נוכחי</h2>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                            סטטוס: {activeModeConfig.label}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
                        {currentShift.people.length > 0 ? currentShift.people.join(', ') : 'אין שיבוץ'}
                    </h3>
                </div>

                {currentShift.secondPeople.length > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        background: '#f8fafc',
                        borderRadius: '0.5rem',
                        border: '1px solid #f1f5f9',
                        width: 'fit-content'
                    }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>כונן משני:</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>
                            {currentShift.secondPeople.join(', ')}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
