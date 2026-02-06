'use client';

import { useState, useEffect } from 'react';
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
        morning: ShiftDetails;
        main: ShiftDetails;
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

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentStart, i));

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    useEffect(() => {
        fetchSchedule();
        fetchConstraints();
    }, [currentStart]);

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
                    morning: normalizeShift(item.shifts?.morning),
                    main: normalizeShift(item.shifts?.main),
                    night: normalizeShift(item.shifts?.night),
                };
                map.set(dateKey, normalizedShifts);

                // Add holidays to set based on shift data
                if (normalizedShifts.morning.isHoliday) holidaySet.add(`${dateKey}-morning`);
                if (normalizedShifts.main.isHoliday) holidaySet.add(`${dateKey}-main`);
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

    const handleUpdate = (date: Date, role: 'morning' | 'main' | 'night', field: keyof ShiftDetails, value: any) => {
        const dateKey = date.toISOString().split('T')[0];
        const currentDaysShifts = scheduleData.get(dateKey) || {
            morning: { names: [], mode: 'phone' },
            main: { names: [], mode: 'phone' },
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

    const cycleMode = (date: Date, role: 'morning' | 'main' | 'night', currentMode: string) => {
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
                    morning: { names: [], mode: 'phone', isHoliday: false },
                    main: { names: [], mode: 'phone', isHoliday: false },
                    night: { names: [], mode: 'phone', isHoliday: false }
                };

                // Inject holiday status from state
                const payloadShifts = {
                    morning: { ...shifts.morning, isHoliday: holidays.has(`${dateKey}-morning`) },
                    main: { ...shifts.main, isHoliday: holidays.has(`${dateKey}-main`) },
                    night: { ...shifts.night, isHoliday: holidays.has(`${dateKey}-night`) },
                };

                // Save if there are (non-empty) shifts OR if any holiday is set
                const hasShifts = payloadShifts.morning.names.length > 0 || payloadShifts.main.names.length > 0 || payloadShifts.night.names.length > 0;
                const hasHoliday = payloadShifts.morning.isHoliday || payloadShifts.main.isHoliday || payloadShifts.night.isHoliday;

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
                        { id: 'morning', label: 'צל יום', bg: '#fff7ed' },
                        { id: 'main', label: 'ראשי יום', bg: '#fefce8' },
                        { id: 'night', label: 'לילה', bg: '#eff6ff' },
                    ].map((rowType, rowIndex) => (
                        <div key={rowType.id} className="table-row" style={{ ...gridStyle, backgroundColor: rowType.bg }}>
                            <div className="table-cell" style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700,
                                color: '#475569', padding: '0.5rem 1rem', borderLeft: '1px solid rgba(0,0,0,0.05)'
                            }}>
                                <span style={{ fontSize: '1rem' }}>{rowType.label}</span>
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
                                        minHeight: '90px',
                                        position: 'relative'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {/* Multiselect Button */}
                                            <button
                                                id={`dropdown-btn-${dropdownId}`}
                                                onClick={(e) => {
                                                    setOpenDropdown(isOpen ? null : dropdownId);
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
                                                    {names.length > 0 ? names.join(', ') : 'בחר אנשים...'}
                                                </span>
                                                <span style={{ fontSize: '0.7rem', marginLeft: '0.25rem' }}>▼</span>
                                            </button>

                                            {/* Mode Button and More Menu */}
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
                                                        onClick={() => {
                                                            const menuId = `${dateKey}-${rowType.id}`;
                                                            setOpenMoreMenu(openMoreMenu === menuId ? null : menuId);
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

                                                    {/* More Menu Dropdown */}
                                                    {openMoreMenu === `${dateKey}-${rowType.id}` && (
                                                        <>
                                                            <div
                                                                onClick={() => setOpenMoreMenu(null)}
                                                                style={{
                                                                    position: 'fixed',
                                                                    top: 0,
                                                                    left: 0,
                                                                    right: 0,
                                                                    bottom: 0,
                                                                    zIndex: 1998
                                                                }}
                                                            />
                                                            <div style={(() => {
                                                                const btn = document.getElementById(`holiday-btn-${dateKey}-${rowType.id}`);
                                                                const rect = btn?.getBoundingClientRect();
                                                                return {
                                                                    position: 'fixed' as const,
                                                                    top: rect ? `${rect.bottom + 4}px` : '0',
                                                                    left: rect ? `${rect.left}px` : '0',
                                                                    background: 'white',
                                                                    border: '1px solid #cbd5e1',
                                                                    borderRadius: '0.5rem',
                                                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                                                                    zIndex: 1999,
                                                                    minWidth: '150px',
                                                                    overflow: 'hidden'
                                                                };
                                                            })()}>
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
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dropdown Menu */}
                                        {isOpen && (
                                            <>
                                                {/* Backdrop to close dropdown */}
                                                <div
                                                    onClick={() => setOpenDropdown(null)}
                                                    style={{
                                                        position: 'fixed',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        zIndex: 999
                                                    }}
                                                />

                                                {/* Dropdown content */}
                                                <div style={(() => {
                                                    const btn = document.getElementById(`dropdown-btn-${dropdownId}`);
                                                    const rect = btn?.getBoundingClientRect();
                                                    return {
                                                        position: 'fixed' as const,
                                                        top: isLastRow && rect ? `${rect.top - 250}px` : rect ? `${rect.bottom + 4}px` : '0',
                                                        left: rect ? `${rect.left}px` : '0',
                                                        width: rect ? `${rect.width}px` : 'auto',
                                                        background: 'white',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: '0.5rem',
                                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                                                        zIndex: 1000,
                                                        maxHeight: '250px',
                                                        overflowY: 'auto' as const,
                                                        minWidth: '180px'
                                                    };
                                                })()}>
                                                    {teamMembers.map(memberName => {
                                                        const isSelected = names.includes(memberName);
                                                        const memberConstraints = dayConstraints[memberName] || { day: false, night: false };
                                                        const hasConstraint = (rowType.id === 'morning' || rowType.id === 'main')
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
                                                                />
                                                                <span style={{ flex: 1 }}>{memberName}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
