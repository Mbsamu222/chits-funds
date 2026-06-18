import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import {
    FiUsers,
    FiTrendingUp,
    FiAlertTriangle,
    FiCreditCard,
    FiArrowUpRight,
    FiArrowDownRight,
    FiRefreshCw,
    FiFilter,
    FiChevronRight,
    FiCalendar,
    FiPlus,
    FiTrash2,
    FiFileText
} from 'react-icons/fi';
import { LuIndianRupee } from "react-icons/lu";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Accounts() {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [ledgerEntries, setLedgerEntries] = useState([]);
    const [chits, setChits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        entry_type: '',
        source: '',
        month_number: '',
        year: '',
        chit_id: ''
    });

    // Accounts Note state
    const [accountNotes, setAccountNotes] = useState(() => {
        const saved = localStorage.getItem('chitfunds_account_notes');
        return saved ? JSON.parse(saved) : [];
    });
    const [showAddNoteModal, setShowAddNoteModal] = useState(false);
    const [noteForm, setNoteForm] = useState({
        customer_name: '',
        credit: '',
        debit: ''
    });

    // Generate month options (1-20)
    const monthOptions = Array.from({ length: 20 }, (_, i) => i + 1);
    
    // Generate year options (current year and 5 years back/forward)
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

    useEffect(() => {
        fetchDashboard();
        fetchChits();
        fetchLedgerEntries();
    }, []);

    useEffect(() => {
        fetchLedgerEntries();
    }, [currentPage, filters]);

    const fetchChits = async () => {
        try {
            const response = await api.get('/chits');
            setChits(response.data.items || []);
        } catch (error) {
            console.error('Failed to fetch chits');
        }
    };

    const fetchDashboard = async () => {
        try {
            const response = await api.get('/accounts/dashboard');
            setDashboard(response.data);
        } catch (error) {
            toast.error('Failed to fetch accounts dashboard');
        } finally {
            setLoading(false);
        }
    };

    const fetchLedgerEntries = async () => {
        setLedgerLoading(true);
        try {
            let url = `/accounts/ledger?page=${currentPage}&per_page=20`;
            if (filters.entry_type) url += `&entry_type=${filters.entry_type}`;
            if (filters.source) url += `&source=${filters.source}`;
            if (filters.month_number) url += `&month_number=${filters.month_number}`;
            if (filters.year) url += `&year=${filters.year}`;
            if (filters.chit_id) url += `&chit_id=${filters.chit_id}`;

            const response = await api.get(url);
            setLedgerEntries(response.data.items);
            setTotalPages(response.data.total_pages);
        } catch (error) {
            toast.error('Failed to fetch ledger entries');

        } finally {
            setLedgerLoading(false);
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

    const formatDueDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Accounts Note functions
    const saveNotesToStorage = (notes) => {
        localStorage.setItem('chitfunds_account_notes', JSON.stringify(notes));
    };

    const handleAddNote = (e) => {
        e.preventDefault();
        const newNote = {
            id: Date.now(),
            sno: accountNotes.length + 1,
            customer_name: noteForm.customer_name,
            credit: parseFloat(noteForm.credit) || 0,
            debit: parseFloat(noteForm.debit) || 0,
            date_time: new Date().toISOString()
        };
        const updated = [...accountNotes, newNote];
        setAccountNotes(updated);
        saveNotesToStorage(updated);
        setNoteForm({ customer_name: '', credit: '', debit: '' });
        setShowAddNoteModal(false);
        toast.success('Account note added');
    };

    const handleDeleteNote = (id) => {
        const updated = accountNotes.filter(n => n.id !== id).map((n, idx) => ({ ...n, sno: idx + 1 }));
        setAccountNotes(updated);
        saveNotesToStorage(updated);
        toast.success('Note deleted');
    };

    const totalCredit = accountNotes.reduce((sum, n) => sum + n.credit, 0);
    const totalDebit = accountNotes.reduce((sum, n) => sum + n.debit, 0);
    const ledgerColumns = [
        {
            key: 'date',
            label: 'Created',
            render: (row) => (
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {formatDate(row.created_at)}
                </span>
            )
        },
        {
            key: 'user',
            label: 'User',
            render: (row) => (
                <div
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/users/${row.user_id}`)}
                >
                    <p style={{ fontWeight: 600, color: 'var(--primary)' }}>{row.user_name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.chit_name}</p>
                </div>
            )
        },
        {
            key: 'type',
            label: 'Type',
            render: (row) => (
                <span className={`badge ${row.entry_type === 'debit' ? 'badge-danger' : 'badge-success'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    {row.entry_type === 'debit' ? <FiArrowUpRight size={12} /> : <FiArrowDownRight size={12} />}
                    {row.entry_type === 'debit' ? 'Money Owed' : 'Payment Received'}
                </span>
            )
        },
        {
            key: 'amount',
            label: 'Amount',
            render: (row) => (
                <span style={{
                    fontWeight: 700,
                    color: row.entry_type === 'debit' ? 'var(--danger)' : 'var(--success)'
                }}>
                    {formatCurrency(row.amount)}
                </span>
            )
        },
        {
            key: 'month',
            label: 'For Month',
            render: (row) => (
                row.month_number ? (
                    <div>
                        <span className="badge badge-primary">Month {row.month_number}</span>
                        {row.due_date && (
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Due: {formatDueDate(row.due_date)}
                            </p>
                        )}
                    </div>
                ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Advance</span>
                )
            )
        },
        {
            key: 'source',
            label: 'Source',
            render: (row) => (
                <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
                    {row.source.replace('_', ' ')}
                </span>
            )
        }
    ];

    const mobileCardRender = (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ fontWeight: 600 }}>{row.user_name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {row.chit_name} {row.month_number && `• Month ${row.month_number}`}
                    </p>
                    {row.due_date && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                            Due: {formatDueDate(row.due_date)}
                        </p>
                    )}
                </div>
                <span style={{
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    color: row.entry_type === 'debit' ? 'var(--danger)' : 'var(--success)'
                }}>
                    {formatCurrency(row.amount)}
                </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={`badge ${row.entry_type === 'debit' ? 'badge-danger' : 'badge-success'}`}>
                    {row.entry_type === 'debit' ? 'Money Owed' : 'Payment Received'}
                </span>
                <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
                    {row.source.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {formatDate(row.created_at)}
                </span>
            </div>
        </div>
    );

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
                        Accounts <span style={{ color: 'var(--primary)' }}>& Tally</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Financial overview and ledger management
                    </p>
                </div>
                <button
                    onClick={() => { fetchDashboard(); fetchLedgerEntries(); }}
                    className="btn btn-secondary"
                >
                    <FiRefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* Stats Grid */}
            {dashboard && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {/* Total Due */}
                    <div className="stat-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                flexShrink: 0
                            }}>
                                <FiArrowUpRight size={22} color="white" />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Due</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)' }}>
                                    {formatCurrency(dashboard.total_due)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Total Collected */}
                    <div className="stat-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                flexShrink: 0
                            }}>
                                <FiArrowDownRight size={22} color="white" />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Collected</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                                    {formatCurrency(dashboard.total_collected)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pending */}
                    <div className="stat-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                flexShrink: 0
                            }}>
                                <FiAlertTriangle size={22} color="white" />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Pending</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning)' }}>
                                    {formatCurrency(dashboard.total_pending)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Advance */}
                    <div className="stat-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                flexShrink: 0
                            }}>
                                <FiCreditCard size={22} color="white" />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Advance</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                                    {formatCurrency(dashboard.total_advance)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Overdue Alert */}
            {dashboard && dashboard.overdue_users > 0 && (
                <div style={{
                    padding: '1rem 1.5rem',
                    borderRadius: '1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <FiAlertTriangle size={24} color="var(--danger)" />
                    <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, color: 'var(--danger)' }}>
                            {dashboard.overdue_users} users with pending dues
                        </p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Total overdue amount: {formatCurrency(dashboard.overdue_amount)}
                        </p>
                    </div>
                    <button className="btn btn-danger" onClick={() => navigate('/users')}>
                        View Users <FiChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* ===== ACCOUNTS NOTE SECTION ===== */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiFileText style={{ color: 'var(--primary)' }} />
                        Accounts <span style={{ color: 'var(--primary)' }}>Note</span>
                    </h2>
                    {isAdmin() && (
                        <button
                            onClick={() => setShowAddNoteModal(true)}
                            className="btn btn-sm btn-primary"
                        >
                            <FiPlus size={14} /> Add Note
                        </button>
                    )}
                </div>

                {accountNotes.length === 0 ? (
                    <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                        <FiFileText size={32} style={{ color: 'var(--text-dim)', marginBottom: '0.75rem' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No account notes yet</p>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.25rem' }}>Add a note to track customer credit and debit</p>
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
                                    {accountNotes.map((note) => (
                                        <tr key={note.id}>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '0.5rem',
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    color: 'var(--primary)',
                                                    fontWeight: 700,
                                                    fontSize: '0.75rem'
                                                }}>
                                                    {note.sno}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{note.customer_name}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                                                {note.credit > 0 ? formatCurrency(note.credit) : '-'}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                                                {note.debit > 0 ? formatCurrency(note.debit) : '-'}
                                            </td>
                                            <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                {formatDate(note.date_time)}
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
                                            {formatCurrency(totalCredit)}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--danger)' }}>
                                            {formatCurrency(totalDebit)}
                                        </td>
                                        <td colSpan={isAdmin() ? 2 : 1} style={{ fontWeight: 700 }}>
                                            Balance: <span style={{ color: (totalCredit - totalDebit) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                {formatCurrency(Math.abs(totalCredit - totalDebit))}
                                                {(totalCredit - totalDebit) >= 0 ? ' Cr' : ' Dr'}
                                            </span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="hide-tablet-up" style={{ padding: '0.5rem' }}>
                            {accountNotes.map((note) => (
                                <div key={note.id} style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '0.5rem',
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                color: 'var(--primary)',
                                                fontWeight: 700,
                                                fontSize: '0.75rem',
                                                flexShrink: 0
                                            }}>
                                                {note.sno}
                                            </span>
                                            <div>
                                                <p style={{ fontWeight: 600 }}>{note.customer_name}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {formatDate(note.date_time)}
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
                                padding: '1rem',
                                background: 'var(--surface)',
                                borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
                                display: 'flex',
                                justifyContent: 'space-around',
                                alignItems: 'center'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Total Credit</p>
                                    <p style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(totalCredit)}</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Total Debit</p>
                                    <p style={{ fontWeight: 800, color: 'var(--danger)' }}>{formatCurrency(totalDebit)}</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Balance</p>
                                    <p style={{ fontWeight: 800, color: (totalCredit - totalDebit) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                        {formatCurrency(Math.abs(totalCredit - totalDebit))}
                                        {(totalCredit - totalDebit) >= 0 ? ' Cr' : ' Dr'}
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
                    <div style={{
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.15)',
                        fontSize: '0.8125rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <FiCalendar size={14} style={{ color: 'var(--primary)' }} />
                        Date & Time will be recorded automatically
                    </div>
                </form>
            </Modal>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="input-group" style={{ margin: 0, minWidth: '140px' }}>
                    <select
                        value={filters.entry_type}
                        onChange={(e) => setFilters({ ...filters, entry_type: e.target.value })}
                        className="input"
                        style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                    >
                        <option value="">All Types</option>
                        <option value="debit">Money Owed</option>
                        <option value="credit">Payment Received</option>
                    </select>
                </div>
                <div className="input-group" style={{ margin: 0, minWidth: '160px' }}>
                    <select
                        value={filters.source}
                        onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                        className="input"
                        style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                    >
                        <option value="">All Sources</option>
                        <option value="monthly_due">Monthly Due</option>
                        <option value="payment">Payment</option>
                        <option value="advance">Advance</option>
                        <option value="adjustment">Adjustment</option>
                    </select>
                </div>
                <div className="input-group" style={{ margin: 0, minWidth: '160px' }}>
                    <select
                        value={filters.chit_id}
                        onChange={(e) => setFilters({ ...filters, chit_id: e.target.value })}
                        className="input"
                        style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                    >
                        <option value="">All Chits</option>
                        {chits.map(c => (
                            <option key={c.id} value={c.id}>{c.chit_name}</option>
                        ))}
                    </select>
                </div>
                <div className="input-group" style={{ margin: 0, minWidth: '130px' }}>
                    <select
                        value={filters.month_number}
                        onChange={(e) => setFilters({ ...filters, month_number: e.target.value })}
                        className="input"
                        style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                    >
                        <option value="">All Months</option>
                        {monthOptions.map(m => (
                            <option key={m} value={m}>Month {m}</option>
                        ))}
                    </select>
                </div>
                <div className="input-group" style={{ margin: 0, minWidth: '110px' }}>
                    <select
                        value={filters.year}
                        onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                        className="input"
                        style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                    >
                        <option value="">All Years</option>
                        {yearOptions.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                {(filters.entry_type || filters.source || filters.month_number || filters.year || filters.chit_id) && (
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setFilters({ entry_type: '', source: '', month_number: '', year: '', chit_id: '' })}
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Ledger Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                        <LuIndianRupee style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Account Ledger
                    </h2>
                </div>
                <DataTable
                    columns={ledgerColumns}
                    data={ledgerEntries}
                    loading={ledgerLoading}
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    emptyMessage="No ledger entries found"
                    emptyIcon={<LuIndianRupee size={32} />}
                    mobileCardRender={mobileCardRender}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{
                        padding: '1rem',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}>
                        <button
                            className="btn btn-secondary btn-sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            Previous
                        </button>
                        <span style={{
                            padding: '0.5rem 1rem',
                            background: 'var(--surface)',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem'
                        }}>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            className="btn btn-secondary btn-sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
