import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import {
    FiDollarSign,
    FiUsers,
    FiTrendingUp,
    FiAlertTriangle,
    FiCreditCard,
    FiArrowUpRight,
    FiArrowDownRight,
    FiRefreshCw,
    FiFilter,
    FiChevronRight
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Accounts() {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [ledgerEntries, setLedgerEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        entry_type: '',
        source: ''
    });

    useEffect(() => {
        fetchDashboard();
        fetchLedgerEntries();
    }, []);

    useEffect(() => {
        fetchLedgerEntries();
    }, [currentPage, filters]);

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
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const ledgerColumns = [
        {
            key: 'date',
            label: 'Date',
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
                    {row.entry_type.toUpperCase()}
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
                    {row.entry_type === 'debit' ? '+' : '-'}{formatCurrency(row.amount)}
                </span>
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
        },
        {
            key: 'month',
            label: 'Month',
            render: (row) => (
                row.month_number ? (
                    <span className="badge badge-primary">Month {row.month_number}</span>
                ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Advance</span>
                )
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
                </div>
                <span style={{
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    color: row.entry_type === 'debit' ? 'var(--danger)' : 'var(--success)'
                }}>
                    {row.entry_type === 'debit' ? '+' : '-'}{formatCurrency(row.amount)}
                </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className={`badge ${row.entry_type === 'debit' ? 'badge-danger' : 'badge-success'}`}>
                    {row.entry_type.toUpperCase()}
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
                        <option value="debit">Debit (Dues)</option>
                        <option value="credit">Credit (Payments)</option>
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
                {(filters.entry_type || filters.source) && (
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setFilters({ entry_type: '', source: '' })}
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
                        <FiDollarSign style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
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
                    emptyIcon={<FiDollarSign size={32} />}
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
