'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { format, addDays, startOfWeek, subWeeks, addWeeks, endOfWeek } from 'date-fns';
import { ChevronRight, ChevronLeft, Phone, Building2, MapPin, Ban, Save } from 'lucide-react';

interface ShiftDetails {
    names: string[];  // Changed from single name to array
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

export default function OnCallTable() {
    const [currentStart, setCurrentStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 }));
    const [scheduleData, setScheduleData] = useState<Map<string, ShiftData['shifts']>>(new Map());
    const [teamMembers, setTeamMembers] = useState<string[]>([]);
    const [constraints, setConstraints] = useState<Map<string, Record<string, { day: boolean; night: boolean }>>>(new Map());
    const [holidays, setHolidays] = useState<Set<string>>(new Set());
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [moreMenuPos, setMoreMenuPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentStart, i));

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    useEffect(() => {
        fetchSchedule();
        fetchConstraints();
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

    const fetchTeamMembers = async () => {
        try {
            const res = await fetch('/api/team-members');
            const data = await res.json();
            setTeamMembers(data.map((m: any) => m.name));
        } catch (e) {
            console.error(e);
        }
    };

    const fetchConstraints = async () => {
        try {
            const end = endOfWeek(currentStart, { weekStartsOn: 0 });
            const res = await fetch(`/api/constraints?start=${currentStart.toISOString()}&end=${end.toISOString()}`);
            const data = await res.json();

            const map = new Map<string, Record<string, { day: boolean; night: boolean }>>();
            data.forEach((item: any) => {
                const dateKey = new Date(item.date).toISOString().split('T')[0];
                map.set(dateKey, item.constraints || {});
            });
            setConstraints(map);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSchedule = async () => {
        try {
            const end = endOfWeek(currentStart, { weekStartsOn: 0 });
            const res = await fetch(`/api/schedule?start=${currentStart.toISOString()}&end=${end.toISOString()}`);
            const data: ShiftData[] = await res.json();

            const map = new Map();
            const holidaySet = new Set<string>();

            data.forEach(item => {
                const dateKey = new Date(item.date).toISOString().split('T')[0];
                const normalizedShifts = {
                    second: normalizeShift(item.shifts?.second),
                    day: normalizeShift(item.shifts?.day),
                    night: normalizeShift(item.shifts?.night),
                };
                map.set(dateKey, normalizedShifts);

                // Add holidays to set based on shift data
                if (normalizedShifts.second.isHoliday) holidaySet.add(`${dateKey}-second`);
                if (normalizedShifts.day.isHoliday) holidaySet.add(`${dateKey}-day`);
                if (normalizedShifts.night.isHoliday) holidaySet.add(`${dateKey}-night`);
            });
            setScheduleData(map);
            setHolidays(holidaySet);
            setHasChanges(false);
        } catch (e) {
            console.error(e);
        }
    };

    const normalizeShift = (val: any): ShiftDetails => {
        if (!val) return { names: [], mode: 'phone', isHoliday: false };
        // Handle old single-name format for backwards compatibility
        const base = { isHoliday: val.isHoliday || false };
        if (val.name !== undefined) {
            return { ...base, names: val.name ? [val.name] : [], mode: val.mode || 'phone' };
        }
        // Handle new array format
        if (val.names !== undefined) {
            return { ...base, names: Array.isArray(val.names) ? val.names : [], mode: val.mode || 'phone' };
        }
        // Fallback
        return { ...base, names: [], mode: 'phone' };
    };

    const handleUpdate = (date: Date, role: 'second' | 'day' | 'night', field: keyof ShiftDetails, value: any) => {
        const dateKey = date.toISOString().split('T')[0];
        const currentDaysShifts = scheduleData.get(dateKey) || {
            second: { names: [], mode: 'phone' },
            day: { names: [], mode: 'phone' },
            night: { names: [], mode: 'phone' }
        };

        const currentShift = currentDaysShifts[role];
        let updatedShift = { ...currentShift, [field]: value };

        // If adding names and mode is not set, default to phone
        if (field === 'names' && value && value.length > 0 && !updatedShift.mode) {
            updatedShift.mode = 'phone';
        }

        const updatedDay = { ...currentDaysShifts, [role]: updatedShift };

        const newMap = new Map(scheduleData);
        newMap.set(dateKey, updatedDay);

        setScheduleData(newMap);
        setHasChanges(true);
    };

    const cycleMode = (date: Date, role: 'second' | 'day' | 'night', currentMode: string) => {
        const currentIndex = MODES.findIndex(m => m.id === currentMode);
        // If currentMode isn't found (e.g. empty or invalid), default to first one (phone)
        // Otherwise cycle to next
        const nextIndex = (currentIndex === -1) ? 0 : (currentIndex + 1) % MODES.length;
        handleUpdate(date, role, 'mode', MODES[nextIndex].id);
    };

    const saveAll = async () => {
        setSaving(true);
        try {
            const promises = [];
            for (const day of weekDays) {
                const dateKey = day.toISOString().split('T')[0];
                const shifts = scheduleData.get(dateKey) || {
                    second: { names: [], mode: 'phone', isHoliday: false },
                    day: { names: [], mode: 'phone', isHoliday: false },
                    night: { names: [], mode: 'phone', isHoliday: false }
                };

                // Inject holiday status from state
                const payloadShifts = {
                    second: { ...shifts.second, isHoliday: holidays.has(`${dateKey}-second`) },
                    day: { ...shifts.day, isHoliday: holidays.has(`${dateKey}-day`) },
                    night: { ...shifts.night, isHoliday: holidays.has(`${dateKey}-night`) },
                };

                // Save if there are (non-empty) shifts OR if any holiday is set
                const hasShifts = payloadShifts.second.names.length > 0 || payloadShifts.day.names.length > 0 || payloadShifts.night.names.length > 0;
                const hasHoliday = payloadShifts.second.isHoliday || payloadShifts.day.isHoliday || payloadShifts.night.isHoliday;

                if (hasShifts || hasHoliday) {
                    promises.push(
                        fetch('/api/schedule', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ date: day, shifts: payloadShifts })
                        })
                    );
                }
            }

            await Promise.all(promises);
            setHasChanges(false);
        } catch (e) {
            console.error(e);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const toggleHoliday = (date: Date, shiftId: string) => {
        const dateKey = date.toISOString().split('T')[0];
        const key = `${dateKey}-${shiftId}`;
        const newHolidays = new Set(holidays);
        if (newHolidays.has(key)) {
            newHolidays.delete(key);
        } else {
            newHolidays.add(key);
        }
        setHolidays(newHolidays);
        setHasChanges(true);
        setOpenMoreMenu(null);
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
            const dateKey = date.toISOString().split('T')[0];
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
                            const shiftData = scheduleData.get(dateKey)?.[rowType.id as keyof ShiftData['shifts']] || { names: [], mode: '' };
                            const { names, mode } = shiftData;
                            const activeMode = MODES.find(m => m.id === mode) || MODES[0];
                            const dayConstraints = constraints.get(dateKey) || {};
                            const dropdownId = `${dateKey}-${rowType.id}`;
                            const isOpen = openDropdown === dropdownId;

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

                                    {/* Multiselect Button */}
                                    <button
                                        id={`dropdown-btn-${dropdownId}`}
                                        onClick={(e) => {
                                            if (isOpen) {
                                                setOpenDropdown(null);
                                                setDropdownPos(null);
                                            } else {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setDropdownPos({
                                                    top: rect.top,
                                                    left: rect.left,
                                                    width: rect.width,
                                                    height: rect.height
                                                });
                                                setOpenDropdown(dropdownId);
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '0.375rem',
                                            border: '1px solid #cbd5e1',
                                            background: 'white',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            minHeight: '3rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            textAlign: 'right'
                                        }}
                                    >
                                        <span style={{
                                            flex: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            color: names.length > 0 ? '#334155' : '#94a3b8'
                                        }}>
                                            {names.length > 0 ? names.join(', ') : 'בחר כוננים...'}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', marginLeft: '0.25rem' }}>▼</span>
                                    </button>

                                    {/* Mode Button and More Menu - Hidden for 'second' shift */}
                                    {rowType.id !== 'second' && (
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            {names.length > 0 && (
                                                <button
                                                    onClick={() => cycleMode(date, rowType.id as any, mode)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.625rem',
                                                        borderRadius: '0.375rem',
                                                        border: 'none',
                                                        background: activeMode.bg,
                                                        color: activeMode.color,
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.5rem',
                                                        fontWeight: 600,
                                                        minHeight: '44px'
                                                    }}
                                                >
                                                    {activeMode.icon}
                                                    <span>{activeMode.label !== 'ללא' ? activeMode.label : 'בחר'}</span>
                                                </button>
                                            )}

                                            {/* More Menu Button */}
                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    id={`holiday-btn-${dateKey}-${rowType.id}`}
                                                    onClick={(e) => {
                                                        const menuId = `${dateKey}-${rowType.id}`;
                                                        if (openMoreMenu === menuId) {
                                                            setOpenMoreMenu(null);
                                                            setMoreMenuPos(null);
                                                        } else {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setMoreMenuPos({
                                                                top: rect.top,
                                                                left: rect.left,
                                                                width: rect.width,
                                                                height: rect.height
                                                            });
                                                            setOpenMoreMenu(menuId);
                                                        }
                                                    }}
                                                    title="אפשרויות נוספות"
                                                    style={{
                                                        padding: '0.625rem',
                                                        minWidth: '44px',
                                                        borderRadius: '0.375rem',
                                                        border: '1px solid #cbd5e1',
                                                        background: holidays.has(`${dateKey}-${rowType.id}`) ? '#fef3c7' : 'white',
                                                        cursor: 'pointer',
                                                        fontSize: '1.25rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        color: holidays.has(`${dateKey}-${rowType.id}`) ? '#92400e' : '#64748b',
                                                        minHeight: '44px'
                                                    }}
                                                >
                                                    +
                                                </button>

                                                {/* More Menu Dropdown - Rendered via Portal */}
                                                {openMoreMenu === `${dateKey}-${rowType.id}` && moreMenuPos && typeof window !== 'undefined' && createPortal(
                                                    <>
                                                        <div
                                                            onClick={() => {
                                                                setOpenMoreMenu(null);
                                                                setMoreMenuPos(null);
                                                            }}
                                                            style={{
                                                                position: 'fixed',
                                                                top: 0,
                                                                left: 0,
                                                                right: 0,
                                                                bottom: 0,
                                                                zIndex: 9996
                                                            }}
                                                        />
                                                        <div style={{
                                                            position: 'fixed',
                                                            top: (moreMenuPos.top + moreMenuPos.height + 4) + 'px',
                                                            left: (moreMenuPos.left - 150 + moreMenuPos.width) + 'px',
                                                            background: 'white',
                                                            border: '1px solid #cbd5e1',
                                                            borderRadius: '0.5rem',
                                                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                                                            zIndex: 9997,
                                                            minWidth: '150px',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <button
                                                                onClick={() => toggleHoliday(date, rowType.id as string)}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '0.75rem',
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    textAlign: 'right',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.875rem',
                                                                    color: '#334155',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem'
                                                                }}
                                                            >
                                                                <span style={{ fontSize: '1rem' }}>{holidays.has(`${dateKey}-${rowType.id}`) ? '✓' : '○'}</span>
                                                                <span>קבע כחג</span>
                                                            </button>
                                                        </div>
                                                    </>,
                                                    document.body
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Dropdown Menu - Rendered via Portal */}
                                    {isOpen && dropdownPos && typeof window !== 'undefined' && createPortal(
                                        <>
                                            {/* Backdrop to close dropdown */}
                                            <div
                                                onClick={() => {
                                                    setOpenDropdown(null);
                                                    setDropdownPos(null);
                                                }}
                                                style={{
                                                    position: 'fixed',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    zIndex: 9998
                                                }}
                                            />

                                            {/* Dropdown content */}
                                            <div style={{
                                                position: 'fixed',
                                                top: (dropdownPos.top + dropdownPos.height + 4) + 'px',
                                                left: dropdownPos.left + 'px',
                                                width: dropdownPos.width + 'px',
                                                background: 'white',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '0.5rem',
                                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                                                zIndex: 9999,
                                                maxHeight: '250px',
                                                overflowY: 'auto',
                                            }}>
                                                {teamMembers.map(memberName => {
                                                    const isSelected = names.includes(memberName);
                                                    const memberConstraints = dayConstraints[memberName] || { day: false, night: false };
                                                    const hasConstraint = (rowType.id === 'second' || rowType.id === 'day')
                                                        ? memberConstraints.day
                                                        : memberConstraints.night;

                                                    return (
                                                        <label
                                                            key={memberName}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                                padding: '0.75rem',
                                                                cursor: hasConstraint ? 'not-allowed' : 'pointer',
                                                                opacity: hasConstraint ? 0.4 : 1,
                                                                background: isSelected ? '#f1f5f9' : 'transparent',
                                                                borderBottom: '1px solid #f1f5f9',
                                                                minHeight: '44px'
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    const newNames = e.target.checked
                                                                        ? [...names, memberName]
                                                                        : names.filter(n => n !== memberName);
                                                                    handleUpdate(date, rowType.id as any, 'names', newNames);
                                                                }}
                                                                style={{
                                                                    width: '20px',
                                                                    height: '20px',
                                                                    cursor: 'pointer',
                                                                    flexShrink: 0
                                                                }}
                                                                disabled={hasConstraint}
                                                            />
                                                            <span style={{ flex: 1, fontSize: '0.875rem' }}>{memberName}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </>,
                                        document.body
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

                {hasChanges && (
                    <button onClick={saveAll} disabled={saving} className="btn-primary">
                        <Save size={18} />
                        {saving ? 'שומר...' : 'שמור שינויים'}
                    </button>
                )}
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
                        overflow: 'visible',
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
                            { id: 'second', label: 'יום משני', bg: '#fff7ed' },
                            { id: 'day', label: 'ראשי יום', bg: '#fefce8' },
                            { id: 'night', label: 'לילה', bg: '#eff6ff' },
                        ].map((rowType, rowIndex) => (
                            <div key={rowType.id} className="table-row" style={{ ...gridStyle, backgroundColor: rowType.bg }}>
                                <div className="table-cell" style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700,
                                    color: '#475569', padding: '0.25rem 1rem', borderLeft: '1px solid rgba(0,0,0,0.05)'
                                }}>
                                    <span style={{ fontSize: '0.9rem' }}>{rowType.label}</span>
                                </div>

                                {weekDays.map((date, i) => {
                                    const dateKey = date.toISOString().split('T')[0];
                                    const shiftData = scheduleData.get(dateKey)?.[rowType.id as keyof ShiftData['shifts']] || { names: [], mode: '' };
                                    const { names, mode } = shiftData;
                                    const activeMode = MODES.find(m => m.id === mode) || MODES[0];
                                    const dayConstraints = constraints.get(dateKey) || {};
                                    const dropdownId = `${dateKey}-${rowType.id}`;
                                    const isOpen = openDropdown === dropdownId;
                                    const isLastRow = rowIndex === 2; // Night shift is the last row

                                    return (
                                        <div key={i} className="table-cell" style={{
                                            padding: '0.5rem',
                                            minHeight: rowType.id === 'second' ? '50px' : '90px',
                                            position: 'relative'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center', padding: rowType.id === 'second' ? '0.25rem' : '0.5rem' }}>
                                                {/* Multiselect Button */}
                                                <button
                                                    id={`dropdown-btn-${dropdownId}`}
                                                    onClick={(e) => {
                                                        if (isOpen) {
                                                            setOpenDropdown(null);
                                                            setDropdownPos(null);
                                                        } else {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setDropdownPos({
                                                                top: rect.top,
                                                                left: rect.left,
                                                                width: rect.width,
                                                                height: rect.height
                                                            });
                                                            setOpenDropdown(dropdownId);
                                                        }
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.5rem',
                                                        borderRadius: '0.375rem',
                                                        border: '1px solid #cbd5e1',
                                                        background: 'white',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                        minHeight: '2.5rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        textAlign: 'right',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <span style={{
                                                        flex: 1,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        color: names.length > 0 ? '#334155' : '#94a3b8'
                                                    }}>
                                                        {names.length > 0 ? names.join(', ') : 'בחר כוננים...'}
                                                    </span>
                                                    <span style={{ fontSize: '0.7rem', marginLeft: '0.25rem' }}>▼</span>
                                                </button>

                                                {/* Mode Button and More Menu - Hidden for 'second' shift */}
                                                {rowType.id !== 'second' && (
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                        {names.length > 0 && (
                                                            <button
                                                                onClick={() => cycleMode(date, rowType.id as any, mode)}
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '0.375rem 0.5rem',
                                                                    borderRadius: '0.375rem',
                                                                    border: 'none',
                                                                    background: activeMode.bg,
                                                                    color: activeMode.color,
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.75rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: '0.375rem',
                                                                    transition: 'all 0.2s',
                                                                    fontWeight: 500
                                                                }}
                                                            >
                                                                {activeMode.icon}
                                                                <span>{activeMode.label !== 'ללא' ? activeMode.label : 'בחר'}</span>
                                                            </button>
                                                        )}

                                                        {/* More Menu Button */}
                                                        <div style={{ position: 'relative' }}>
                                                            <button
                                                                id={`holiday-btn-${dateKey}-${rowType.id}`}
                                                                onClick={(e) => {
                                                                    const menuId = `${dateKey}-${rowType.id}`;
                                                                    if (openMoreMenu === menuId) {
                                                                        setOpenMoreMenu(null);
                                                                        setMoreMenuPos(null);
                                                                    } else {
                                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                                        setMoreMenuPos({
                                                                            top: rect.top,
                                                                            left: rect.left,
                                                                            width: rect.width,
                                                                            height: rect.height
                                                                        });
                                                                        setOpenMoreMenu(menuId);
                                                                    }
                                                                }}
                                                                title="אפשרויות נוספות"
                                                                style={{
                                                                    padding: '0.375rem 0.5rem',
                                                                    borderRadius: '0.375rem',
                                                                    border: '1px solid #cbd5e1',
                                                                    background: holidays.has(`${dateKey}-${rowType.id}`) ? '#fef3c7' : 'white',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.875rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.2s',
                                                                    fontWeight: 600,
                                                                    color: holidays.has(`${dateKey}-${rowType.id}`) ? '#92400e' : '#64748b'
                                                                }}
                                                            >
                                                                +
                                                            </button>

                                                            {/* More Menu Dropdown - Rendered via Portal */}
                                                            {openMoreMenu === `${dateKey}-${rowType.id}` && moreMenuPos && typeof window !== 'undefined' && createPortal(
                                                                <>
                                                                    <div
                                                                        onClick={() => {
                                                                            setOpenMoreMenu(null);
                                                                            setMoreMenuPos(null);
                                                                        }}
                                                                        style={{
                                                                            position: 'fixed',
                                                                            top: 0,
                                                                            left: 0,
                                                                            right: 0,
                                                                            bottom: 0,
                                                                            zIndex: 9996
                                                                        }}
                                                                    />
                                                                    <div style={{
                                                                        position: 'fixed',
                                                                        top: (moreMenuPos.top + moreMenuPos.height + 4) + 'px',
                                                                        left: (moreMenuPos.left - 150 + moreMenuPos.width) + 'px',
                                                                        background: 'white',
                                                                        border: '1px solid #cbd5e1',
                                                                        borderRadius: '0.5rem',
                                                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                                                                        zIndex: 9997,
                                                                        minWidth: '150px',
                                                                        overflow: 'hidden'
                                                                    }}>
                                                                        <button
                                                                            onClick={() => toggleHoliday(date, rowType.id as string)}
                                                                            style={{
                                                                                width: '100%',
                                                                                padding: '0.75rem',
                                                                                border: 'none',
                                                                                background: 'transparent',
                                                                                textAlign: 'right',
                                                                                cursor: 'pointer',
                                                                                fontSize: '0.875rem',
                                                                                color: '#334155',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '0.5rem',
                                                                                transition: 'background 0.15s'
                                                                            }}
                                                                            onMouseEnter={(e) => {
                                                                                e.currentTarget.style.background = '#f8fafc';
                                                                            }}
                                                                            onMouseLeave={(e) => {
                                                                                e.currentTarget.style.background = 'transparent';
                                                                            }}
                                                                        >
                                                                            <span style={{ fontSize: '1rem' }}>{holidays.has(`${dateKey}-${rowType.id}`) ? '✓' : '○'}</span>
                                                                            <span>קבע כחג</span>
                                                                        </button>
                                                                    </div>
                                                                </>,
                                                                document.body
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Dropdown Menu - Rendered via Portal */}
                                            {isOpen && dropdownPos && typeof window !== 'undefined' && createPortal(
                                                <>
                                                    {/* Backdrop to close dropdown */}
                                                    <div
                                                        onClick={() => {
                                                            setOpenDropdown(null);
                                                            setDropdownPos(null);
                                                        }}
                                                        style={{
                                                            position: 'fixed',
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            bottom: 0,
                                                            zIndex: 9998
                                                        }}
                                                    />

                                                    {/* Dropdown content */}
                                                    <div style={{
                                                        position: 'fixed',
                                                        top: isLastRow ? 'auto' : (dropdownPos.top + dropdownPos.height + 4) + 'px',
                                                        bottom: isLastRow ? (window.innerHeight - dropdownPos.top + 4) + 'px' : 'auto',
                                                        left: dropdownPos.left + 'px',
                                                        width: dropdownPos.width + 'px',
                                                        background: 'white',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: '0.5rem',
                                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                                                        zIndex: 9999,
                                                        maxHeight: '250px',
                                                        overflowY: 'auto',
                                                    }}>
                                                        {teamMembers.map(memberName => {
                                                            const isSelected = names.includes(memberName);
                                                            const memberConstraints = dayConstraints[memberName] || { day: false, night: false };
                                                            const hasConstraint = (rowType.id === 'second' || rowType.id === 'day')
                                                                ? memberConstraints.day
                                                                : memberConstraints.night;

                                                            return (
                                                                <label
                                                                    key={memberName}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.5rem',
                                                                        padding: '0.75rem',
                                                                        cursor: hasConstraint ? 'not-allowed' : 'pointer',
                                                                        opacity: hasConstraint ? 0.4 : 1,
                                                                        background: isSelected ? '#f1f5f9' : 'transparent',
                                                                        borderBottom: '1px solid #f1f5f9',
                                                                        transition: 'background 0.15s'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        if (!isSelected && !hasConstraint) {
                                                                            e.currentTarget.style.background = '#f8fafc';
                                                                        }
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        if (!isSelected && !hasConstraint) {
                                                                            e.currentTarget.style.background = 'transparent';
                                                                        }
                                                                    }}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={(e) => {
                                                                            const newNames = e.target.checked
                                                                                ? [...names, memberName]
                                                                                : names.filter(n => n !== memberName);
                                                                            handleUpdate(date, rowType.id as any, 'names', newNames);
                                                                        }}
                                                                        style={{
                                                                            width: '16px',
                                                                            height: '16px',
                                                                            cursor: 'pointer',
                                                                            flexShrink: 0
                                                                        }}
                                                                        disabled={hasConstraint}
                                                                    />
                                                                    <span style={{ flex: 1 }}>{memberName}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </>,
                                                document.body
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
