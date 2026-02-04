import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import PaymentStatusGrid from '../components/PaymentStatusGrid';
import {
    FiArrowLeft, FiPhone, FiMail, FiMapPin,
    FiGrid, FiDollarSign, FiCalendar, FiTrendingUp
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function UserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserDashboard();
    }, [id]);

    const fetchUserDashboard = async () => {
        try {
            const response = await api.get(`/users/${id}/dashboard`);
            setData(response.data);
        } catch (error) {
            toast.error('Failed to fetch user details');
            navigate('/users');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-pulse">
                <div className="skeleton" style={{ height: '2.5rem', width: '8rem', borderRadius: '0.75rem' }} />
                <div className="skeleton" style={{ height: '10rem', borderRadius: '1rem' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton" style={{ height: '7rem', borderRadius: '1rem' }} />
                    ))}
                </div>
                <div className="skeleton" style={{ height: '16rem', borderRadius: '1rem' }} />
            </div>
        );
    }

    if (!data) return null;

    const { user, chits, total_paid, total_balance, pending_months } = data;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
            {/* Back Button */}
            <button
                onClick={() => navigate('/users')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    transition: 'color 0.2s'
                }}
            >
                <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    background: 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                }}>
                    <FiArrowLeft />
                </div>
                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Back to Users</span>
            </button>

            {/* User Header Card */}
            <div className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                {/* Decorative gradient */}
                <div
                    style={{
                        position: 'absolute',
                        right: '-5rem',
                        top: '-5rem',
                        width: '16rem',
                        height: '16rem',
                        opacity: 0.3,
                        pointerEvents: 'none',
                        background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)'
                    }}
                />

                <div style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }} className="user-header-content">
                    {/* Avatar */}
                    <div className="avatar avatar-xl avatar-gradient" style={{
                        boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.1)',
                        alignSelf: 'flex-start'
                    }}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                            <h1 style={{
                                fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                                fontWeight: 800,
                                letterSpacing: '-0.025em'
                            }}>
                                {user.name}
                            </h1>
                            <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                <div style={{
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '0.5rem',
                                    background: 'var(--surface-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--primary)',
                                    flexShrink: 0
                                }}>
                                    <FiPhone size={16} />
                                </div>
                                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{user.phone}</span>
                            </div>
                            {user.email && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                    <div style={{
                                        width: '2rem',
                                        height: '2rem',
                                        borderRadius: '0.5rem',
                                        background: 'var(--surface-light)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--primary)',
                                        flexShrink: 0
                                    }}>
                                        <FiMail size={16} />
                                    </div>
                                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>{user.email}</span>
                                </div>
                            )}
                        </div>

                        {user.address && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                <div style={{
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '0.5rem',
                                    background: 'var(--surface-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--primary)',
                                    flexShrink: 0
                                }}>
                                    <FiMapPin size={16} />
                                </div>
                                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{user.address}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }} className="stats-grid">
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, var(--success) 0%, #059669 100%)',
                            flexShrink: 0
                        }}>
                            <FiDollarSign size={20} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Total Paid</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--success)' }}>
                                {formatCurrency(total_paid)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, var(--warning) 0%, #ea580c 100%)',
                            flexShrink: 0
                        }}>
                            <FiTrendingUp size={20} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Outstanding</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--warning)' }}>
                                {formatCurrency(total_balance)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
                            flexShrink: 0
                        }}>
                            <FiCalendar size={20} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Pending Months</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 800 }}>{pending_months}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chits Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <FiGrid /> Joined Groups
                    <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 400 }}>
                        ({chits.length})
                    </span>
                </h2>

                {chits.length === 0 ? (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{
                            width: '4rem',
                            height: '4rem',
                            margin: '0 auto 1rem',
                            borderRadius: '50%',
                            background: 'var(--surface-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-dim)'
                        }}>
                            <FiGrid size={32} />
                        </div>
                        <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No Groups Joined</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            This user hasn't joined any chit groups yet.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {chits.map((chit, index) => (
                            <div
                                key={chit.chit_id}
                                className="card animate-fade-in"
                                style={{ overflow: 'hidden', animationDelay: `${index * 100}ms` }}
                            >
                                {/* Chit Header */}
                                <div style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                    background: 'linear-gradient(90deg, var(--surface) 0%, transparent 100%)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem'
                                    }} className="chit-header">
                                        <div>
                                            <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>{chit.chit_name}</h3>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                marginTop: '0.25rem',
                                                fontSize: '0.875rem',
                                                color: 'var(--text-muted)'
                                            }}>
                                                <span style={{
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    color: 'var(--primary)',
                                                    padding: '0.125rem 0.5rem',
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    Slot #{chit.slot_number}
                                                </span>
                                                <span>•</span>
                                                <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                                                    {formatCurrency(chit.monthly_amount)}/mo
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '0.75rem',
                                            borderRadius: '0.75rem',
                                            background: 'rgba(0, 0, 0, 0.2)'
                                        }}>
                                            <div style={{ textAlign: 'center', flex: 1 }}>
                                                <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Paid</p>
                                                <p style={{ fontWeight: 700, color: 'var(--success)' }}>
                                                    {formatCurrency(chit.total_paid)}
                                                </p>
                                            </div>
                                            <div style={{ width: '1px', height: '2rem', background: 'rgba(255, 255, 255, 0.1)' }} />
                                            <div style={{ textAlign: 'center', flex: 1 }}>
                                                <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Balance</p>
                                                <p style={{ fontWeight: 700, color: 'var(--warning)' }}>
                                                    {formatCurrency(chit.balance)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Grid */}
                                <div style={{ padding: '1rem' }}>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: 'var(--text-muted)',
                                        marginBottom: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <FiCalendar size={14} /> Payment History ({chit.total_months} months)
                                    </p>
                                    <div style={{
                                        padding: '1rem',
                                        borderRadius: '0.75rem',
                                        background: 'rgba(0, 0, 0, 0.2)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}>
                                        <PaymentStatusGrid
                                            months={chit.month_status}
                                            onMonthClick={(month) => {
                                                if (!month.is_paid) {
                                                    navigate(`/payments?user=${id}&chit=${chit.chit_id}`);
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{ marginTop: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Payment Progress</span>
                                            <span style={{ fontWeight: 500 }}>
                                                {Math.round((chit.total_paid / chit.total_amount) * 100)}%
                                            </span>
                                        </div>
                                        <div className="progress">
                                            <div
                                                className="progress-bar"
                                                style={{
                                                    width: `${Math.min(100, (chit.total_paid / chit.total_amount) * 100)}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Responsive Styles */}
            <style>{`
                @media (min-width: 640px) {
                    .user-header-content {
                        flex-direction: row !important;
                        align-items: center !important;
                    }
                    .user-header-content .avatar {
                        align-self: center !important;
                    }
                    .chit-header {
                        flex-direction: row !important;
                        align-items: center !important;
                        justify-content: space-between !important;
                    }
                }
                @media (max-width: 639px) {
                    .stats-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
