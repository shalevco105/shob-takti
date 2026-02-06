'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, subWeeks, addWeeks, endOfWeek } from 'date-fns';
import { Save, ChevronRight, ChevronLeft, UserCheck, Lock } from 'lucide-react';
import Header from '@/components/Header';
import OnCallTable from '@/components/OnCallTable';
import JusticeTable from '@/components/JusticeTable';
import LoginModal from '@/components/LoginModal';
import { useAuth } from '@/contexts/AuthContext';

interface ConstraintData {
    day: boolean;
    night: boolean;
}

export default function ConstraintsPage() {
    const [currentStart, setCurrentStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 }));
    const [teamMembers, setTeamMembers] = useState<string[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<string>('');
    const [constraintsData, setConstraintsData] = useState<Map<string, ConstraintData>>(new Map());
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const { isAuthenticated } = useAuth();

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentStart, i));
    const daysHeader = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    useEffect(() => {
        if (selectedPerson) {
            fetchConstraints();
        }
    }, [currentStart, selectedPerson]);

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
            // Only show regular members in constraints, not mliluim
            const regularNames = data.filter((m: any) => m.type === 'regular').map((m: any) => m.name);
            setTeamMembers(regularNames);
            if (regularNames.length > 0 && !selectedPerson) {
                setSelectedPerson(regularNames[0]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchConstraints = async () => {
        try {
            const end = endOfWeek(currentStart, { weekStartsOn: 0 });
            const res = await fetch(`/api/constraints?start=${currentStart.toISOString()}&end=${end.toISOString()}`);
            const data = await res.json();

            console.log('Fetched constraints data:', data);

            const map = new Map<string, ConstraintData>();
            data.forEach((item: any) => {
                const dateKey = new Date(item.date).toISOString().split('T')[0];
                const personConstraints = item.constraints?.[selectedPerson] || { day: false, night: false };
                console.log(`Constraint for ${dateKey}:`, personConstraints);
                map.set(dateKey, personConstraints);
            });

            console.log('Final constraintsData map:', map);
            setConstraintsData(map);
            setHasChanges(false);
        } catch (e) {
            console.error('Error fetching constraints:', e);
        }
    };

    const handleToggle = (date: Date, shift: 'day' | 'night') => {
        const dateKey = date.toISOString().split('T')[0];
        const current = constraintsData.get(dateKey) || { day: false, night: false };
        const updated = { ...current, [shift]: !current[shift] };

        const newMap = new Map(constraintsData);
        newMap.set(dateKey, updated);

        setConstraintsData(newMap);
        setHasChanges(true);
    };

    const saveAll = async () => {
        setSaving(true);
        try {
            const promises = [];
            for (const day of weekDays) {
                const dateKey = day.toISOString().split('T')[0];
                const constraints = constraintsData.get(dateKey) || { day: false, night: false };

                console.log('Saving constraints for', dateKey, ':', constraints);

                promises.push(
                    fetch('/api/constraints', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            date: day,
                            name: selectedPerson,
                            constraints
                        })
                    })
                );
            }

            await Promise.all(promises);
            setHasChanges(false);
            console.log('All constraints saved successfully');
        } catch (e) {
            console.error('Error saving constraints:', e);
        } finally {
            setSaving(false);
        }
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: '140px repeat(7, 1fr)',
        borderBottom: '1px solid #e2e8f0'
    };

    // Render mobile card layout for constraints
    const renderMobileConstraintsCards = () => {
        return weekDays.map((date, dayIndex) => {
            const dateKey = date.toISOString().split('T')[0];
            const dayName = daysHeader[dayIndex];
            const constraints = constraintsData.get(dateKey) || { day: false, night: false };

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

                    {/* Constraints */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Day checkbox */}
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem',
                            background: '#fefce8',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(0,0,0,0.05)',
                            cursor: 'pointer'
                        }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569' }}>יום</span>
                            <input
                                type="checkbox"
                                checked={constraints.day}
                                onChange={() => handleToggle(date, 'day')}
                                style={{ width: '1.5rem', height: '1.5rem', cursor: 'pointer' }}
                            />
                        </label>

                        {/* Night checkbox */}
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem',
                            background: '#eff6ff',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(0,0,0,0.05)',
                            cursor: 'pointer'
                        }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569' }}>לילה</span>
                            <input
                                type="checkbox"
                                checked={constraints.night}
                                onChange={() => handleToggle(date, 'night')}
                                style={{ width: '1.5rem', height: '1.5rem', cursor: 'pointer' }}
                            />
                        </label>
                    </div>
                </div>
            );
        });
    };

    return (
        <main className="container">
            <Header />

            {/* Constraints Section */}
            <div className="card glass" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div className="grid-stack-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="icon-box" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                            <UserCheck size={24} />
                        </div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>ניהול אילוצים</h1>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        {/* Person Selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 600, color: '#64748b' }}>בחר כונן:</label>
                            <select
                                value={selectedPerson}
                                onChange={(e) => setSelectedPerson(e.target.value)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                {teamMembers.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Week Navigation */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
                            <button onClick={() => setCurrentStart(prev => subWeeks(prev, 1))} className="btn-icon">
                                <ChevronRight size={20} />
                            </button>
                            <span style={{ padding: '0 0.5rem', fontWeight: 600, minWidth: '100px', textAlign: 'center' }}>
                                {format(currentStart, 'd.M')} - {format(addDays(currentStart, 6), 'd.M')}
                            </span>
                            <button onClick={() => setCurrentStart(prev => addWeeks(prev, 1))} className="btn-icon">
                                <ChevronLeft size={20} />
                            </button>
                        </div>

                        {hasChanges && (
                            <button onClick={saveAll} disabled={saving} className="btn-primary">
                                <Save size={18} />
                                {saving ? 'שומר...' : 'שמור שינויים'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Conditional rendering: Mobile cards or Desktop table */}
                {isMobile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {renderMobileConstraintsCards()}
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
                        <div style={{ minWidth: '900px', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            {/* Header Row - Days */}
                            <div className="table-header-row" style={gridStyle}>
                                <div className="table-header-cell" style={{ background: '#f8fafc' }}></div>
                                {daysHeader.map((day, i) => (
                                    <div key={i} className="table-header-cell">{day}</div>
                                ))}
                            </div>

                            {/* Date Row */}
                            <div className="table-row" style={gridStyle}>
                                <div className="table-date-cell" style={{ background: '#fff1f2', borderLeft: '1px solid #e2e8f0' }}></div>
                                {weekDays.map((date, i) => (
                                    <div key={i} className="table-date-cell">{format(date, 'd.M')}</div>
                                ))}
                            </div>

                            {/* Day Shift Row */}
                            <div className="table-row" style={{ ...gridStyle, backgroundColor: '#fefce8' }}>
                                <div className="table-cell" style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700,
                                    color: '#475569', padding: '0.5rem 1rem', borderLeft: '1px solid rgba(0,0,0,0.05)'
                                }}>
                                    <span style={{ fontSize: '1rem' }}>יום</span>
                                </div>
                                {weekDays.map((date, i) => {
                                    const dateKey = date.toISOString().split('T')[0];
                                    const constraints = constraintsData.get(dateKey) || { day: false, night: false };
                                    return (
                                        <div key={i} className="table-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={constraints.day}
                                                onChange={() => handleToggle(date, 'day')}
                                                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Night Shift Row */}
                            <div className="table-row" style={{ ...gridStyle, backgroundColor: '#eff6ff' }}>
                                <div className="table-cell" style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700,
                                    color: '#475569', padding: '0.5rem 1rem', borderLeft: '1px solid rgba(0,0,0,0.05)'
                                }}>
                                    <span style={{ fontSize: '1rem' }}>לילה</span>
                                </div>
                                {weekDays.map((date, i) => {
                                    const dateKey = date.toISOString().split('T')[0];
                                    const constraints = constraintsData.get(dateKey) || { day: false, night: false };
                                    return (
                                        <div key={i} className="table-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={constraints.night}
                                                onChange={() => handleToggle(date, 'night')}
                                                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        ✓ סמן תאריכים בהם <strong>{selectedPerson}</strong> לא זמין/ה לכונן
                    </p>
                </div>
            </div>

            {/* Editable Schedule Table - Only shown to authenticated users */}
            {isAuthenticated && (
                <div className="card glass" style={{ padding: '1.5rem', overflow: 'visible' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>עריכת שיבוצים</h2>
                    <OnCallTable />
                </div>
            )}

            {/* Login Modal */}
            {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

            {/* Justice Table - Only shown to authenticated users */}
            {isAuthenticated && (
                <div style={{ marginTop: '1.5rem', maxWidth: '400px' }}>
                    <JusticeTable />
                </div>
            )}
        </main>
    );
}
