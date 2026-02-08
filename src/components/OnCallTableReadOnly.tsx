'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, subWeeks, addWeeks, endOfWeek } from 'date-fns';
import { ChevronRight, ChevronLeft, Phone, Building2, MapPin, Ban } from 'lucide-react';

interface ShiftDetails {
    names: string[];
    mode: string;
    isHoliday?: boolean;
}

interface ShiftData {
    date: string;
    isHoliday?: boolean;
    shifts: {
        second: ShiftDetails;
        day: ShiftDetails;
        night: ShiftDetails;
    }
}

const MODES = [
    { id: 'phone', label: 'טלפוני', icon: <Phone size={14} />, color: '#0ea5e9', bg: '#e0f2fe' },
    { id: 'offices', label: 'משרדים', icon: <Building2 size={14} />, color: '#8b5cf6', bg: '#f3e8ff' },
    { id: 'kirya', label: 'קריה', icon: <MapPin size={14} />, color: '#10b981', bg: '#d1fae5' },
];

export default function OnCallTableReadOnly() {
    const [currentStart, setCurrentStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 }));
    const [scheduleData, setScheduleData] = useState<Map<string, ShiftData['shifts']>>(new Map());
    const [holidays, setHolidays] = useState<Set<string>>(new Set());
    const [isMobile, setIsMobile] = useState(false);

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentStart, i));

    useEffect(() => {
        fetchSchedule();
    }, [currentStart]);

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const fetchSchedule = async () => {
        try {
            const end = endOfWeek(currentStart, { weekStartsOn: 0 });
            const res = await fetch(`/api/schedule?start=${currentStart.toISOString()}&end=${end.toISOString()}`);
            const data: ShiftData[] = await res.json();

            const map = new Map();
            const holidaySet = new Set<string>();

            data.forEach(item => {
                const d = new Date(item.date);
                const dateKey = format(d, 'yyyy-MM-dd');
                const normalizedShifts = {
                    second: normalizeShift(item.shifts?.second),
                    day: normalizeShift(item.shifts?.day),
                    night: normalizeShift(item.shifts?.night),
                };
                map.set(dateKey, normalizedShifts);

                // Add holidays based on shift data
                if (normalizedShifts.second.isHoliday) holidaySet.add(`${dateKey}-second`);
                if (normalizedShifts.day.isHoliday) holidaySet.add(`${dateKey}-day`);
                if (normalizedShifts.night.isHoliday) holidaySet.add(`${dateKey}-night`);
            });
            setScheduleData(map);
            setHolidays(holidaySet);
        } catch (e) {
            console.error(e);
        }
    };

    const normalizeShift = (val: any): ShiftDetails => {
        if (!val) return { names: [], mode: 'phone', isHoliday: false };
        const base = { isHoliday: val.isHoliday || false };
        if (val.name !== undefined) {
            return { ...base, names: val.name ? [val.name] : [], mode: val.mode || 'phone' };
        }
        if (val.names !== undefined) {
            return { ...base, names: Array.isArray(val.names) ? val.names : [], mode: val.mode || 'phone' };
        }
        return { ...base, names: [], mode: 'phone' };
    };

    const daysHeader = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: '140px repeat(7, 1fr)',
        borderBottom: '1px solid #e2e8f0'
    };

    const shiftTypes = [
        { id: 'second', label: 'משני', bg: '#fff7ed' },
        { id: 'day', label: 'ראשי', bg: '#fefce8' },
        { id: 'night', label: 'לילה', bg: '#eff6ff' },
    ];

    // Render mobile card layout
    const renderMobileCards = () => {
        return weekDays.map((date, dayIndex) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayName = daysHeader[dayIndex];

            return (
                <div key={dayIndex} style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    padding: '1rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    {/* Day header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                        paddingBottom: '0.75rem',
                        borderBottom: '2px solid #f1f5f9'
                    }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>{dayName}</h3>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#881337' }}>{format(date, 'd.M')}</span>
                    </div>

                    {/* Shifts */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {shiftTypes.map((rowType) => {
                            const shiftData = scheduleData.get(dateKey)?.[rowType.id as keyof ShiftData['shifts']] || { names: [], mode: 'phone' };
                            const { names, mode } = shiftData;
                            const activeMode = MODES.find(m => m.id === mode) || MODES[0];
                            const isHoliday = holidays.has(`${dateKey}-${rowType.id}`);

                            return (
                                <div key={rowType.id} style={{
                                    background: rowType.bg,
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid rgba(0,0,0,0.05)'
                                }}>
                                    {/* Shift label */}
                                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>
                                        {rowType.label}
                                    </div>

                                    {/* Names */}
                                    <div style={{
                                        fontWeight: 600,
                                        color: names.length > 0 ? '#334155' : '#94a3b8',
                                        fontSize: '0.9rem',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {names.length > 0 ? names.join(', ') : '-'}
                                    </div>

                                    {/* Mode and Holiday badges - Hidden for 'second' shift */}
                                    {rowType.id !== 'second' && names.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                padding: '0.375rem 0.625rem',
                                                background: activeMode.bg,
                                                color: activeMode.color,
                                                borderRadius: '0.375rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 600
                                            }}>
                                                {activeMode.icon}
                                                <span>{activeMode.label}</span>
                                            </div>
                                            {isHoliday && (
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    padding: '0.375rem 0.625rem',
                                                    background: '#fef3c7',
                                                    color: '#92400e',
                                                    borderRadius: '0.375rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600
                                                }}>
                                                    <span>חג</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>טבלת כוננים</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
                        <button onClick={() => setCurrentStart(prev => subWeeks(prev, 1))} className="btn-icon"><ChevronRight size={20} /></button>
                        <span style={{ padding: '0 0.5rem', fontWeight: 600, minWidth: '100px', textAlign: 'center' }}>
                            {format(currentStart, 'd.M')} - {format(addDays(currentStart, 6), 'd.M')}
                        </span>
                        <button onClick={() => setCurrentStart(prev => addWeeks(prev, 1))} className="btn-icon"><ChevronLeft size={20} /></button>
                    </div>
                </div>
            </div>

            {/* Conditional rendering: Mobile cards or Desktop table */}
            {isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {renderMobileCards()}
                </div>
            ) : (
                <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
                    <div style={{
                        marginBottom: '2rem',
                        borderRadius: '1rem',
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div className="table-header-row" style={gridStyle}>
                            <div className="table-header-cell" style={{ background: '#f8fafc' }}></div>
                            {daysHeader.map((day, i) => <div key={i} className="table-header-cell">{day}</div>)}
                        </div>

                        <div className="table-row" style={gridStyle}>
                            <div className="table-date-cell" style={{ background: '#fff1f2', borderLeft: '1px solid #e2e8f0' }}></div>
                            {weekDays.map((date, i) => <div key={i} className="table-date-cell">{format(date, 'd.M')}</div>)}
                        </div>

                        {[
                            { id: 'second', label: 'משני', bg: '#fff7ed' },
                            { id: 'day', label: 'ראשי', bg: '#fefce8' },
                            { id: 'night', label: 'לילה', bg: '#eff6ff' },
                        ].map((rowType) => (
                            <div key={rowType.id} className="table-row" style={{ ...gridStyle, backgroundColor: rowType.bg }}>
                                <div className="table-cell" style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700,
                                    color: '#475569', padding: '0.25rem 1rem', borderLeft: '1px solid rgba(0,0,0,0.05)'
                                }}>
                                    <span style={{ fontSize: '0.9rem' }}>{rowType.label}</span>
                                </div>

                                {weekDays.map((date, i) => {
                                    const dateKey = format(date, 'yyyy-MM-dd');
                                    const shiftData = scheduleData.get(dateKey)?.[rowType.id as keyof ShiftData['shifts']] || { names: [], mode: 'phone' };
                                    const { names, mode } = shiftData;
                                    const activeMode = MODES.find(m => m.id === mode) || MODES[0];
                                    const isHoliday = holidays.has(`${dateKey}-${rowType.id}`);

                                    return (
                                        <div key={i} className="table-cell" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{
                                                fontWeight: 600,
                                                color: names.length > 0 ? '#334155' : '#94a3b8',
                                                fontSize: '0.9rem',
                                                textAlign: 'center'
                                            }}>
                                                {names.length > 0 ? names.join(', ') : '-'}
                                            </div>

                                            {/* Mode and Holiday badges - Hidden for 'second' shift */}
                                            {rowType.id !== 'second' && names.length > 0 && (
                                                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: activeMode.bg, color: activeMode.color, borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 500 }}>
                                                        {activeMode.icon}
                                                        <span>{activeMode.label}</span>
                                                    </div>
                                                    {isHoliday && (
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: '#fef3c7', color: '#92400e', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600 }}>
                                                            <span>חג</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
