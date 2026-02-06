'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Save, Trash2, UserCheck, UserMinus } from 'lucide-react';
import Header from '@/components/Header';

interface TeamMember {
    _id?: string;
    name: string;
    type: 'regular' | 'mliluim';
    order: number;
    active: boolean;
}

export default function TeamManagementPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [newMember, setNewMember] = useState<TeamMember>({ name: '', type: 'regular', order: 0, active: true });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await fetch('/api/team-members');
            const data = await res.json();
            setMembers(data);
        } catch (e) {
            console.error(e);
        }
    };

    const saveMember = async (member: TeamMember) => {
        setLoading(true);
        try {
            await fetch('/api/team-members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(member)
            });
            await fetchMembers();
            setEditingMember(null);
            setNewMember({ name: '', type: 'regular', order: 0, active: true });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const deleteMember = async (id: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק את החבר/ה?')) return;

        setLoading(true);
        try {
            await fetch(`/api/team-members?id=${id}`, { method: 'DELETE' });
            await fetchMembers();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const regularMembers = members.filter(m => m.type === 'regular');
    const reserveMembers = members.filter(m => m.type === 'mliluim');

    return (
        <main className="container">
            <Header />

            <div className="card glass" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="icon-box" style={{ background: '#fef3c7', color: '#d97706' }}>
                        <Users size={24} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>ניהול רשימת כוננים</h1>
                </div>

                {/* Add New Member Form */}
                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '0.75rem', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#475569' }}>הוסף חבר/ה חדש/ה</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b', fontSize: '0.875rem' }}>שם</label>
                            <input
                                type="text"
                                value={newMember.name}
                                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                placeholder="הכנס שם..."
                                style={{
                                    width: '100%', padding: '0.625rem', borderRadius: '0.5rem',
                                    border: '1px solid #e2e8f0', fontSize: '1rem'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b', fontSize: '0.875rem' }}>סוג</label>
                            <select
                                value={newMember.type}
                                onChange={(e) => setNewMember({ ...newMember, type: e.target.value as 'regular' | 'mliluim' })}
                                style={{
                                    width: '100%', padding: '0.625rem', borderRadius: '0.5rem',
                                    border: '1px solid #e2e8f0', fontSize: '1rem', cursor: 'pointer'
                                }}
                            >
                                <option value="regular">רגיל</option>
                                <option value="mliluim">מילואים</option>
                            </select>
                        </div>
                        <button
                            onClick={() => newMember.name && saveMember(newMember)}
                            disabled={!newMember.name || loading}
                            className="btn-primary"
                            style={{ padding: '0.625rem 1.25rem' }}
                        >
                            <Plus size={18} />
                            הוסף
                        </button>
                    </div>
                </div>

                {/* Regular Members */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <UserCheck size={20} color="#10b981" />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>כוננים רגילים</h3>
                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>(נספרים בטבלת צדק)</span>
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {regularMembers.map(member => (
                            <div key={member._id} style={{
                                display: 'grid', gridTemplateColumns: '3fr 1fr auto auto', gap: '1rem',
                                padding: '1rem', background: 'white', borderRadius: '0.5rem',
                                border: '1px solid #e2e8f0', alignItems: 'center'
                            }}>
                                {editingMember?._id === member._id && editingMember ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editingMember.name}
                                            onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                                            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                                        />
                                        <select
                                            value={editingMember.type}
                                            onChange={(e) => setEditingMember({ ...editingMember, type: e.target.value as 'regular' | 'mliluim' })}
                                            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                                        >
                                            <option value="regular">רגיל</option>
                                            <option value="mliluim">מילואים</option>
                                        </select>
                                        <button onClick={() => editingMember && saveMember(editingMember)} className="btn-icon" style={{ background: '#10b981', color: 'white' }}>
                                            <Save size={18} />
                                        </button>
                                        <button onClick={() => setEditingMember(null)} className="btn-icon">✕</button>
                                    </>
                                ) : (
                                    <>
                                        <span style={{ fontWeight: 600, color: '#334155' }}>{member.name}</span>
                                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>רגיל</span>
                                        <button onClick={() => setEditingMember(member)} className="btn-icon">✎</button>
                                        <button onClick={() => member._id && deleteMember(member._id)} className="btn-icon" style={{ color: '#ef4444' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reserve Members */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <UserMinus size={20} color="#8b5cf6" />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>מילואים</h3>
                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>(לא נספרים בטבלת צדק)</span>
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {reserveMembers.map(member => (
                            <div key={member._id} style={{
                                display: 'grid', gridTemplateColumns: '3fr 1fr auto auto', gap: '1rem',
                                padding: '1rem', background: 'white', borderRadius: '0.5rem',
                                border: '1px solid #e2e8f0', alignItems: 'center'
                            }}>
                                {editingMember?._id === member._id ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editingMember?.name || ''}
                                            onChange={(e) => editingMember && setEditingMember({ ...editingMember, name: e.target.value })}
                                            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                                        />
                                        <select
                                            value={editingMember?.type || 'regular'}
                                            onChange={(e) => editingMember && setEditingMember({ ...editingMember, type: e.target.value as 'regular' | 'mliluim' })}
                                            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                                        >
                                            <option value="regular">רגיל</option>
                                            <option value="mliluim">מילואים</option>
                                        </select>
                                        <button onClick={() => editingMember && saveMember(editingMember)} className="btn-icon" style={{ background: '#10b981', color: 'white' }}>
                                            <Save size={18} />
                                        </button>

                                        <button onClick={() => setEditingMember(null)} className="btn-icon">✕</button>
                                    </>
                                ) : (
                                    <>
                                        <span style={{ fontWeight: 600, color: '#334155' }}>{member.name}</span>
                                        <span style={{ fontSize: '0.875rem', color: '#8b5cf6' }}>מילואים</span>
                                        <button onClick={() => setEditingMember(member)} className="btn-icon">✎</button>
                                        <button onClick={() => member._id && deleteMember(member._id)} className="btn-icon" style={{ color: '#ef4444' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
