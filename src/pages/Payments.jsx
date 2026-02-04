import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import {
    FiPlus, FiDollarSign, FiSearch, FiFilter,
    FiCamera, FiX, FiCheck, FiCreditCard, FiSmartphone
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Payments() {
    const { isAdmin } = useAuth();
    const [payments, setPayments] = useState([]);
    const [users, setUsers] = useState([]);
    const [chits, setChits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [filterMode, setFilterMode] = useState('all');

    const [formData, setFormData] = useState({
        user_id: '',
        chit_id: '',
        month_number: '',
        amount_paid: '',
        payment_mode: 'cash',
        notes: ''
    });
    const [screenshot, setScreenshot] = useState(null);

    useEffect(() => {
        fetchPayments();
        fetchUsers();
        fetchChits();
    }, []);

    const fetchPayments = async () => {
        try {
            const response = await api.get('/payments');
            setPayments(response.data);
        } catch (error) {
            toast.error('Failed to fetch payments');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            // Handle paginated response
            const data = response.data.items || response.data;
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch users');
        }
    };

    const fetchChits = async () => {
        try {
            const response = await api.get('/chits');
            // Handle paginated response
            const data = response.data.items || response.data;
            setChits(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch chits');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const data = new FormData();
            data.append('user_id', formData.user_id);
            data.append('chit_id', formData.chit_id);
            data.append('month_number', formData.month_number);
            data.append('amount_paid', formData.amount_paid);
            data.append('payment_mode', formData.payment_mode);
            data.append('notes', formData.notes);

            if (screenshot) {
                data.append('screenshot', screenshot);
            }

            await api.post('/payments', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Payment recorded successfully');
            setShowModal(false);
            resetForm();
            fetchPayments();
        } catch (error) {
            const message = error.response?.data?.detail || 'Failed to record payment';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            user_id: '',
            chit_id: '',
            month_number: '',
            amount_paid: '',
            payment_mode: 'cash',
            notes: ''
        });
        setScreenshot(null);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const filteredPayments = payments.filter(p => {
        const matchesSearch = p.user_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
            p.chit_name?.toLowerCase().includes(searchValue.toLowerCase());
        const matchesMode = filterMode === 'all' || p.payment_mode === filterMode;
        return matchesSearch && matchesMode;
    });

    const totalPaid = filteredPayments.reduce((sum, p) => sum + p.amount_paid, 0);
    const cashPayments = payments.filter(p => p.payment_mode === 'cash');
    const gpayPayments = payments.filter(p => p.payment_mode === 'gpay');

    const columns = [
        {
            key: 'user',
            label: 'User',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="avatar avatar-sm avatar-gradient">
                        {row.user_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{row.user_name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.chit_name}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'amount',
            label: 'Amount',
            render: (row) => (
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                    {formatCurrency(row.amount_paid)}
                </span>
            )
        },
        {
            key: 'month',
            label: 'Month',
            className: 'hidden sm:table-cell',
            render: (row) => (
                <span className="badge badge-primary">M{row.month_number}</span>
            )
        },
        {
            key: 'mode',
            label: 'Mode',
            render: (row) => (
                <span className={`badge ${row.payment_mode === 'gpay' ? 'badge-info' : 'badge-secondary'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    {row.payment_mode === 'gpay' ? <FiSmartphone size={10} /> : <FiCreditCard size={10} />}
                    {row.payment_mode.toUpperCase()}
                </span>
            )
        },
        {
            key: 'date',
            label: 'Date',
            className: 'hidden md:table-cell',
            render: (row) => (
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {new Date(row.payment_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: '2-digit'
                    })}
                </span>
            )
        },
        {
            key: 'screenshot',
            label: '',
            className: 'hidden lg:table-cell',
            render: (row) => row.screenshot_url && (
                <a
                    href={`http://localhost:8000${row.screenshot_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-icon-sm btn-ghost"
                    title="View Screenshot"
                >
                    <FiCamera size={16} />
                </a>
            )
        }
    ];

    const mobileCardRender = (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="avatar avatar-md avatar-gradient">
                        {row.user_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p style={{ fontWeight: 600 }}>{row.user_name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.chit_name}</p>
                    </div>
                </div>
                <p style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--success)' }}>
                    {formatCurrency(row.amount_paid)}
                </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-primary">Month {row.month_number}</span>
                    <span className={`badge ${row.payment_mode === 'gpay' ? 'badge-info' : 'badge-secondary'}`}>
                        {row.payment_mode.toUpperCase()}
                    </span>
                </div>
                <span style={{ color: 'var(--text-muted)' }}>
                    {new Date(row.payment_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short'
                    })}
                </span>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 800, letterSpacing: '-0.025em' }}>
                            Payment <span style={{ color: 'var(--primary)' }}>Records</span>
                        </h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            Track and record all payments
                        </p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn btn-primary"
                    >
                        <FiPlus /> Record Payment
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                flexShrink: 0
                            }}
                        >
                            <FiDollarSign size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Total Paid</p>
                            <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(totalPaid)}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                flexShrink: 0
                            }}
                        >
                            <FiCheck size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Transactions</p>
                            <p style={{ fontSize: '1rem', fontWeight: 800 }}>{payments.length}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                                flexShrink: 0
                            }}
                        >
                            <FiCreditCard size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Cash</p>
                            <p style={{ fontSize: '1rem', fontWeight: 800 }}>{cashPayments.length}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                                flexShrink: 0
                            }}
                        >
                            <FiSmartphone size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>GPay</p>
                            <p style={{ fontSize: '1rem', fontWeight: 800 }}>{gpayPayments.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Search */}
                <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
                    <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search by user or chit..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="input"
                        style={{ paddingLeft: '2.75rem', width: '100%' }}
                    />
                </div>

                {/* Mode Filter */}
                <div className="chip-group">
                    {['all', 'cash', 'gpay'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setFilterMode(mode)}
                            className={`chip ${filterMode === mode ? 'active' : ''}`}
                        >
                            {mode === 'all' && <FiFilter size={12} />}
                            {mode === 'cash' && <FiCreditCard size={12} />}
                            {mode === 'gpay' && <FiSmartphone size={12} />}
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={filteredPayments}
                loading={loading}
                emptyMessage="No payments found"
                emptyIcon={<FiDollarSign size={32} />}
                mobileCardRender={mobileCardRender}
            />



            {/* Add Payment Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Record Payment"
                size="lg"
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleSubmit} disabled={saving} className="btn btn-primary">
                            {saving ? <div className="spinner spinner-sm" /> : 'Record'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="input-group">
                            <label>User *</label>
                            <select
                                value={formData.user_id}
                                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                className="input"
                                required
                            >
                                <option value="">Select user...</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label>Chit Group *</label>
                            <select
                                value={formData.chit_id}
                                onChange={(e) => setFormData({ ...formData, chit_id: e.target.value })}
                                className="input"
                                required
                            >
                                <option value="">Select chit...</option>
                                {chits.map(c => (
                                    <option key={c.id} value={c.id}>{c.chit_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Month Number *</label>
                            <input
                                type="number"
                                value={formData.month_number}
                                onChange={(e) => setFormData({ ...formData, month_number: e.target.value })}
                                className="input"
                                min="1"
                                placeholder="Enter month"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Amount (₹) *</label>
                            <input
                                type="number"
                                value={formData.amount_paid}
                                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                                className="input"
                                min="1"
                                placeholder="Enter amount"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Payment Mode *</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {['cash', 'gpay'].map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, payment_mode: mode })}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '0.75rem',
                                        border: '1px solid',
                                        borderColor: formData.payment_mode === mode ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                        background: formData.payment_mode === mode ? 'var(--primary)' : 'var(--surface-light)',
                                        color: formData.payment_mode === mode ? 'white' : 'var(--text-muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {mode === 'cash' ? <FiCreditCard size={18} /> : <FiSmartphone size={18} />}
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="input"
                            rows={2}
                            placeholder="Optional notes..."
                        />
                    </div>

                    <div className="input-group">
                        <label>Screenshot (Optional)</label>
                        {screenshot ? (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem',
                                borderRadius: '0.75rem',
                                background: 'var(--surface-light)'
                            }}>
                                <FiCamera style={{ color: 'var(--primary)' }} />
                                <span style={{ fontSize: '0.875rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{screenshot.name}</span>
                                <button
                                    type="button"
                                    onClick={() => setScreenshot(null)}
                                    className="btn-icon-sm btn-ghost"
                                    style={{ color: 'var(--danger)' }}
                                >
                                    <FiX size={16} />
                                </button>
                            </div>
                        ) : (
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '1.5rem',
                                borderRadius: '0.75rem',
                                border: '2px dashed rgba(255,255,255,0.1)',
                                cursor: 'pointer',
                                transition: 'border-color 0.2s'
                            }}>
                                <FiCamera style={{ color: 'var(--text-muted)' }} />
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Click to upload</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setScreenshot(e.target.files[0])}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        )}
                    </div>
                </form>
            </Modal>
        </div>
    );
}
