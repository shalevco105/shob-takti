'use client';

import { getISOWeek } from 'date-fns';
import { motion } from 'framer-motion';
import { Sparkles, Users } from 'lucide-react';

export default function CleaningSchedule() {
    // Simple rotation logic based on week number
    const currentWeek = getISOWeek(new Date());
    // Team 1, 2, 3 cycling
    const teamNumber = (currentWeek % 3) || 3;

    const getTeamName = (num: number) => {
        switch (num) {
            case 1: return 'צוות 1';
            case 2: return 'צוות 2';
            case 3: return 'צוות 3';
            default: return 'צוות 1';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card glass widget-container"
        >
            <div className="widget-header">
                <div className="icon-box" style={{ background: '#fce7f3', color: '#db2777' }}>
                    <Sparkles size={24} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>אחראי ניקיון</h2>
            </div>

            <div className="widget-content gradient-cleaning" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, opacity: 0.9, marginBottom: '0.5rem' }}>השבוע (א-ה)</div>
                <h3 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{getTeamName(teamNumber)}</h3>
            </div>
        </motion.div>
    );
}
