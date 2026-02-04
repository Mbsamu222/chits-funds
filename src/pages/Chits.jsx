import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Modal from '../components/Modal';
import {
    FiPlus, FiGrid, FiSearch, FiCalendar,
    FiUsers, FiDollarSign, FiClock, FiX, FiCheckCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Chits() {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [chits, setChits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        chit_name: '',
        total_amount: '',
        total_months: '',
        start_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchChits();
    }, []);

    const fetchChits = async () => {
        try {
            const response = await api.get('/chits');
            // Handle paginated response
            const data = response.data.items || response.data;
            setChits(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Failed to fetch chits');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await api.post('/chits', {
                ...formData,
                total_amount: parseInt(formData.total_amount),
                total_months: parseInt(formData.total_months)
            });
            toast.success('Chit group created successfully');
            setShowModal(false);
            resetForm();
            fetchChits();
        } catch (error) {
            const message = error.response?.data?.detail || 'Failed to create chit group';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            chit_name: '',
            total_amount: '',
            total_months: '',
            start_date: new Date().toISOString().split('T')[0]
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const filteredChits = chits.filter(chit =>
        chit.chit_name.toLowerCase().includes(searchValue.toLowerCase())
    );

    const activeChits = chits.filter(c => c.is_active).length;
    const completedChits = chits.filter(c => !c.is_active).length;

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="skeleton" style={{ height: '5rem', borderRadius: '1rem' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="skeleton" style={{ height: '12rem', borderRadius: '1rem' }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 800, letterSpacing: '-0.025em' }}>
                        Chit <span style={{ color: 'var(--primary)' }}>Groups</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Manage all chit fund groups
                    </p>
                </div>
                {isAdmin() && (
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn btn-primary"
                    >
                        <FiPlus /> Create Group
                    </button>
                )}
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
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                flexShrink: 0
                            }}
                        >
                            <FiGrid size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Total</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 800 }}>{chits.length}</p>
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
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                flexShrink: 0
                            }}
                        >
                            <FiClock size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Active</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--success)' }}>{activeChits}</p>
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
                                background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                                flexShrink: 0
                            }}
                        >
                            <FiCheckCircle size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Done</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 800 }}>{completedChits}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', maxWidth: '400px' }}>
                <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder="Search chit groups..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '2.75rem', paddingRight: '2.5rem', width: '100%' }}
                />
                {searchValue && (
                    <button
                        onClick={() => setSearchValue('')}
                        style={{
                            position: 'absolute',
                            right: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0
                        }}
                    >
                        <FiX size={18} />
                    </button>
                )}
            </div>

            {/* Chit Grid */}
            {filteredChits.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <FiGrid size={32} />
                    </div>
                    <h3 className="empty-state-title">No Chit Groups</h3>
                    <p className="empty-state-text">
                        {searchValue ? 'No groups match your search' : 'Create your first chit group to get started'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {filteredChits.map((chit, index) => (
                        <Link
                            key={chit.id}
                            to={`/chits/${chit.id}`}
                            className="card animate-fade-in"
                            style={{
                                padding: '1.25rem',
                                textDecoration: 'none',
                                animationDelay: `${index * 50}ms`,
                                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
                                border: '1px solid rgba(99, 102, 241, 0.2)'
                            }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{
                                        fontWeight: 700,
                                        fontSize: '1.25rem',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        color: '#f8fafc'
                                    }}>
                                        {chit.chit_name}
                                    </h3>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                        <FiCalendar size={12} />
                                        {new Date(chit.start_date).toLocaleDateString('en-IN', {
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <span className={`badge ${chit.is_active ? 'badge-success' : 'badge-secondary'}`}>
                                    {chit.is_active ? 'Active' : 'Completed'}
                                </span>
                            </div>

                            {/* Stats */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(99, 102, 241, 0.15)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FiDollarSign size={14} color="#6366f1" /> Total
                                    </span>
                                    <span style={{ fontWeight: 700, color: '#818cf8', fontSize: '1rem' }}>
                                        {formatCurrency(chit.total_amount)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FiCalendar size={14} color="#6366f1" /> Monthly
                                    </span>
                                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                                        {formatCurrency(chit.monthly_amount)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FiClock size={14} color="#6366f1" /> Duration
                                    </span>
                                    <span style={{ fontWeight: 600, color: '#2dd4bf' }}>
                                        {chit.total_months} months
                                    </span>
                                </div>
                            </div>

                            {/* Progress */}
                            <div style={{ marginTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <FiUsers size={12} />
                                        Members: {chit.member_count}/{chit.total_months}
                                    </span>
                                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                                        {Math.round((chit.member_count / chit.total_months) * 100)}%
                                    </span>
                                </div>
                                <div className="progress progress-sm">
                                    <div
                                        className="progress-bar"
                                        style={{ width: `${(chit.member_count / chit.total_months) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}



            {/* Create Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Create New Chit Group"
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="btn btn-primary"
                        >
                            {saving ? <div className="spinner spinner-sm" /> : 'Create'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="input-group">
                        <label>Group Name *</label>
                        <input
                            type="text"
                            value={formData.chit_name}
                            onChange={(e) => setFormData({ ...formData, chit_name: e.target.value })}
                            className="input"
                            placeholder="e.g., Gold 2024"
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Total Amount (₹) *</label>
                            <input
                                type="number"
                                value={formData.total_amount}
                                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                                className="input"
                                placeholder="e.g., 100000"
                                min="1000"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Duration (Months) *</label>
                            <input
                                type="number"
                                value={formData.total_months}
                                onChange={(e) => setFormData({ ...formData, total_months: e.target.value })}
                                className="input"
                                placeholder="e.g., 20"
                                min="2"
                                max="100"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Start Date *</label>
                        <input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            className="input"
                            required
                        />
                    </div>

                    {/* Preview */}
                    {formData.total_amount && formData.total_months && (
                        <div
                            style={{
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.2)'
                            }}
                        >
                            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                Monthly Payment Preview
                            </p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                                {formatCurrency(Math.round(formData.total_amount / formData.total_months))}
                                <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-muted)' }}>/month</span>
                            </p>
                        </div>
                    )}
                </form>
            </Modal>
        </div>
    );
}
