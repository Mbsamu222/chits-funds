import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Modal from '../components/Modal';
import api from '../utils/api';
import {
    FiFileText,
    FiPlus,
    FiTrash2,
    FiCalendar,
    FiSearch,
    FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Notes() {
    const { isAdmin } = useAuth();
    const { isDark } = useTheme();

    // Notes state (from API)
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddNoteModal, setShowAddNoteModal] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [totals, setTotals] = useState({ credit: 0, debit: 0, balance: 0 });
    const [noteForm, setNoteForm] = useState({
        customer_name: '',
        credit: '',
        debit: '',
        description: ''
    });

    useEffect(() => {
        fetchNotes();
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchNotes();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchValue]);

    const fetchNotes = async () => {
        try {
            let url = '/notes?per_page=100';
            if (searchValue) url += `&search=${encodeURIComponent(searchValue)}`;
            const response = await api.get(url);
            setNotes(response.data.items || []);
            setTotals({
                credit: response.data.total_credit || 0,
                debit: response.data.total_debit || 0,
                balance: response.data.balance || 0
            });
        } catch (error) {
            setNotes([]);
            setTotals({ credit: 0, debit: 0, balance: 0 });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!noteForm.customer_name.trim()) {
            toast.error('Customer name is required');
            return;
        }
        if (!noteForm.credit && !noteForm.debit) {
            toast.error('Enter credit or debit amount');
            return;
        }
        try {
            await api.post('/notes', {
                customer_name: noteForm.customer_name.trim(),
                credit: parseFloat(noteForm.credit) || 0,
                debit: parseFloat(noteForm.debit) || 0,
                description: noteForm.description || null
            });
            setNoteForm({ customer_name: '', credit: '', debit: '', description: '' });
            setShowAddNoteModal(false);
            toast.success('Note added successfully');
            fetchNotes();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to add note');
        }
    };

    const handleDeleteNote = async (id) => {
        try {
            await api.delete(`/notes/${id}`);
            toast.success('Note deleted');
            fetchNotes();
        } catch (error) {
            toast.error('Failed to delete note');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 800, letterSpacing: '-0.025em' }}>
                        Account <span style={{ color: 'var(--primary)' }}>Notes</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Track customer credit and debit entries
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={fetchNotes} className="btn btn-secondary">
                        <FiRefreshCw size={16} /> Refresh
                    </button>
                    {isAdmin() && (
                        <button
                            onClick={() => setShowAddNoteModal(true)}
                            className="btn btn-primary"
                        >
                            <FiPlus size={16} /> Add Note
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            flexShrink: 0
                        }}>
                            <FiFileText size={22} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Credit</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                                {formatCurrency(totals.credit)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            flexShrink: 0
                        }}>
                            <FiFileText size={22} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Debit</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)' }}>
                                {formatCurrency(totals.debit)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: totals.balance >= 0
                                ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            flexShrink: 0
                        }}>
                            <FiFileText size={22} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Balance</p>
                            <p style={{
                                fontSize: '1.25rem', fontWeight: 800,
                                color: totals.balance >= 0 ? 'var(--success)' : 'var(--danger)'
                            }}>
                                {formatCurrency(Math.abs(totals.balance))} {totals.balance >= 0 ? 'Cr' : 'Dr'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative', maxWidth: '400px' }}>
                <FiSearch style={{
                    position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-dim)', pointerEvents: 'none'
                }} size={16} />
                <input
                    type="text"
                    placeholder="Search by customer name..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '2.75rem' }}
                />
            </div>

            {/* Notes Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiFileText style={{ color: 'var(--primary)' }} />
                        All Notes
                        <span style={{
                            fontSize: '0.75rem',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '9999px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: 'var(--primary)',
                            fontWeight: 600
                        }}>
                            {notes.length}
                        </span>
                    </h2>
                </div>

                {notes.length === 0 ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '1rem',
                            background: 'var(--surface-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1rem'
                        }}>
                            <FiFileText size={28} style={{ color: 'var(--text-dim)' }} />
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>
                            {searchValue ? 'No notes match your search' : 'No account notes yet'}
                        </p>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            {searchValue ? 'Try a different search term' : 'Add a note to track customer credit and debit'}
                        </p>
                        {!searchValue && isAdmin() && (
                            <button
                                onClick={() => setShowAddNoteModal(true)}
                                className="btn btn-primary"
                                style={{ marginTop: '1.5rem' }}
                            >
                                <FiPlus size={16} /> Add First Note
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="table-container hide-mobile">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px' }}>S.No</th>
                                        <th>Customer Name</th>
                                        <th style={{ textAlign: 'right' }}>Credit (₹)</th>
                                        <th style={{ textAlign: 'right' }}>Debit (₹)</th>
                                        <th>Date & Time</th>
                                        {isAdmin() && <th style={{ width: '60px' }}>Action</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {notes.map((note, idx) => (
                                        <tr key={note.id}>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '28px', height: '28px', borderRadius: '0.5rem',
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem'
                                                }}>
                                                    {idx + 1}
                                                </span>
                                            </td>
                                            <td>
                                                <p style={{ fontWeight: 600 }}>{note.customer_name}</p>
                                                {note.description && (
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.125rem' }}>
                                                        {note.description}
                                                    </p>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                                                {note.credit > 0 ? formatCurrency(note.credit) : '-'}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                                                {note.debit > 0 ? formatCurrency(note.debit) : '-'}
                                            </td>
                                            <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                {formatDate(note.created_at)}
                                            </td>
                                            {isAdmin() && (
                                                <td>
                                                    <button
                                                        onClick={() => handleDeleteNote(note.id)}
                                                        className="btn-icon-sm btn-ghost"
                                                        style={{ color: 'var(--danger)' }}
                                                        title="Delete note"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="2" style={{ fontWeight: 700, textAlign: 'right' }}>Totals</td>
                                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--success)' }}>
                                            {formatCurrency(totals.credit)}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--danger)' }}>
                                            {formatCurrency(totals.debit)}
                                        </td>
                                        <td colSpan={isAdmin() ? 2 : 1} style={{ fontWeight: 700 }}>
                                            Balance: <span style={{ color: totals.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                {formatCurrency(Math.abs(totals.balance))}
                                                {totals.balance >= 0 ? ' Cr' : ' Dr'}
                                            </span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="hide-tablet-up" style={{ padding: '0.5rem' }}>
                            {notes.map((note, idx) => (
                                <div key={note.id} style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))',
                                    display: 'flex', flexDirection: 'column', gap: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                width: '28px', height: '28px', borderRadius: '0.5rem',
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
                                            }}>
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <p style={{ fontWeight: 600 }}>{note.customer_name}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {formatDate(note.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        {isAdmin() && (
                                            <button
                                                onClick={() => handleDeleteNote(note.id)}
                                                className="btn-icon-sm btn-ghost"
                                                style={{ color: 'var(--danger)' }}
                                            >
                                                <FiTrash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', paddingLeft: '2.75rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Credit</p>
                                            <p style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.9375rem' }}>
                                                {note.credit > 0 ? formatCurrency(note.credit) : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Debit</p>
                                            <p style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.9375rem' }}>
                                                {note.debit > 0 ? formatCurrency(note.debit) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {/* Mobile Totals */}
                            <div style={{
                                padding: '1rem', background: 'var(--surface)',
                                borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
                                display: 'flex', justifyContent: 'space-around', alignItems: 'center'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Total Credit</p>
                                    <p style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(totals.credit)}</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Total Debit</p>
                                    <p style={{ fontWeight: 800, color: 'var(--danger)' }}>{formatCurrency(totals.debit)}</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Balance</p>
                                    <p style={{ fontWeight: 800, color: totals.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                        {formatCurrency(Math.abs(totals.balance))} {totals.balance >= 0 ? 'Cr' : 'Dr'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Add Note Modal */}
            <Modal
                isOpen={showAddNoteModal}
                onClose={() => setShowAddNoteModal(false)}
                title="Add Account Note"
                footer={
                    <>
                        <button onClick={() => setShowAddNoteModal(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleAddNote} className="btn btn-primary">
                            <FiPlus size={16} /> Add Note
                        </button>
                    </>
                }
            >
                <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="input-group">
                        <label>Customer Name *</label>
                        <input
                            type="text"
                            value={noteForm.customer_name}
                            onChange={(e) => setNoteForm({ ...noteForm, customer_name: e.target.value })}
                            className="input"
                            placeholder="Enter customer name"
                            required
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Credit Amount (₹)</label>
                            <input
                                type="number"
                                value={noteForm.credit}
                                onChange={(e) => setNoteForm({ ...noteForm, credit: e.target.value })}
                                className="input"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                        <div className="input-group">
                            <label>Debit Amount (₹)</label>
                            <input
                                type="number"
                                value={noteForm.debit}
                                onChange={(e) => setNoteForm({ ...noteForm, debit: e.target.value })}
                                className="input"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Description (optional)</label>
                        <input
                            type="text"
                            value={noteForm.description}
                            onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                            className="input"
                            placeholder="Enter description"
                        />
                    </div>
                    <div style={{
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.15)',
                        fontSize: '0.8125rem',
                        color: 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        <FiCalendar size={14} style={{ color: 'var(--primary)' }} />
                        Date & Time will be recorded automatically
                    </div>
                </form>
            </Modal>
        </div>
    );
}
