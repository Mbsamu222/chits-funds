import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
    FiUsers, FiGrid, FiDollarSign, FiTrendingUp,
    FiArrowRight, FiArrowUpRight, FiClock, FiCheckCircle,
    FiAlertCircle, FiCreditCard, FiPieChart, FiActivity
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const response = await api.get('/reports/dashboard');
            setStats(response.data);
        } catch (error) {
            console.error('Dashboard error:', error);
            toast.error('Failed to load dashboard');
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

    const formatCompactCurrency = (amount) => {
        if (amount >= 100000) {
            return '₹' + (amount / 100000).toFixed(1) + 'L';
        } else if (amount >= 1000) {
            return '₹' + (amount / 1000).toFixed(0) + 'K';
        }
        return formatCurrency(amount);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-pulse">
                <div className="skeleton" style={{ height: '180px', borderRadius: '1.5rem' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '1rem' }} />
                    ))}
                </div>
                <div className="skeleton" style={{ height: '200px', borderRadius: '1rem' }} />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">

            {/* Hero Section with Gradient Background */}
            <div
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '1.5rem',
                    padding: 'clamp(1.5rem, 5vw, 2.5rem)',
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
            >
                {/* Animated Background Orbs */}
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-20%',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                    animation: 'pulse 4s ease-in-out infinite'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-30%',
                    left: '-10%',
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
                    filter: 'blur(30px)',
                    animation: 'pulse 5s ease-in-out infinite reverse'
                }} />

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <p style={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                marginBottom: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <FiClock size={14} />
                                {getGreeting()}
                            </p>
                            <h1 style={{
                                fontSize: 'clamp(1.75rem, 6vw, 2.5rem)',
                                fontWeight: 800,
                                color: 'white',
                                letterSpacing: '-0.03em',
                                marginBottom: '0.75rem'
                            }}>
                                {user?.name || 'User'}
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <span style={{
                                    padding: '0.375rem 0.875rem',
                                    borderRadius: '2rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    background: user?.role === 'admin'
                                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                        : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {user?.role}
                                </span>
                                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                                    {new Date().toLocaleDateString('en-IN', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long'
                                    })}
                                </span>
                            </div>
                        </div>

                        {/* Mini Stats on Desktop */}
                        {isAdmin() && (
                            <div style={{
                                display: 'flex',
                                gap: '1rem',
                                flexWrap: 'wrap'
                            }} className="hide-mobile">
                                <div style={{
                                    padding: '1rem 1.25rem',
                                    borderRadius: '1rem',
                                    background: 'rgba(255,255,255,0.1)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    minWidth: '120px'
                                }}>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>This Month</p>
                                    <p style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700 }}>
                                        {formatCompactCurrency(stats?.monthly_collection)}
                                    </p>
                                </div>
                                <div style={{
                                    padding: '1rem 1.25rem',
                                    borderRadius: '1rem',
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    minWidth: '120px'
                                }}>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Profit</p>
                                    <p style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <FiTrendingUp size={16} />
                                        {formatCompactCurrency(stats?.total_profit)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                {/* Users Card */}
                <div
                    onClick={() => navigate('/users')}
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '1rem',
                        padding: '1.25rem',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                    className="card-hover"
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '0.75rem',
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '0.75rem',
                                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
                            }}>
                                <FiUsers size={18} color="white" />
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.25rem' }}>
                                Total Users
                            </p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>
                                {stats?.total_users || 0}
                            </p>
                        </div>
                        <FiArrowUpRight size={18} style={{ color: 'var(--text-muted)' }} />
                    </div>
                </div>

                {/* Active Chits Card */}
                <div
                    onClick={() => navigate('/chits')}
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '1rem',
                        padding: '1.25rem',
                        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%)',
                        border: '1px solid rgba(236, 72, 153, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                    className="card-hover"
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '0.75rem',
                                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '0.75rem',
                                boxShadow: '0 8px 20px rgba(236, 72, 153, 0.3)'
                            }}>
                                <FiGrid size={18} color="white" />
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.25rem' }}>
                                Active Groups
                            </p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>
                                {stats?.active_chits || 0}
                            </p>
                        </div>
                        <FiArrowUpRight size={18} style={{ color: 'var(--text-muted)' }} />
                    </div>
                </div>

                {/* Monthly Collection Card - Admin Only */}
                {isAdmin() && (
                    <div
                        onClick={() => navigate('/payments')}
                        style={{
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '1rem',
                            padding: '1.25rem',
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        className="card-hover mobile-only-block"
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '0.75rem',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '0.75rem',
                                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
                                }}>
                                    <FiDollarSign size={18} color="white" />
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.25rem' }}>
                                    This Month
                                </p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
                                    {formatCompactCurrency(stats?.monthly_collection)}
                                </p>
                            </div>
                            <FiArrowUpRight size={18} style={{ color: 'var(--text-muted)' }} />
                        </div>
                    </div>
                )}

                {/* Profit Card - Admin Only */}
                {isAdmin() && (
                    <div
                        onClick={() => navigate('/reports')}
                        style={{
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '1rem',
                            padding: '1.25rem',
                            background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(20, 184, 166, 0.05) 100%)',
                            border: '1px solid rgba(20, 184, 166, 0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        className="card-hover mobile-only-block"
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '0.75rem',
                                    background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '0.75rem',
                                    boxShadow: '0 8px 20px rgba(20, 184, 166, 0.3)'
                                }}>
                                    <FiTrendingUp size={18} color="white" />
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.25rem' }}>
                                    Total Profit
                                </p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#14b8a6' }}>
                                    {formatCompactCurrency(stats?.total_profit)}
                                </p>
                            </div>
                            <FiArrowUpRight size={18} style={{ color: 'var(--text-muted)' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text)' }}>
                    Quick Actions
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '0.75rem'
                }}>
                    <button
                        onClick={() => navigate('/users')}
                        style={{
                            padding: '1rem',
                            borderRadius: '1rem',
                            background: 'var(--surface-light)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                        className="card-hover"
                    >
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '0.75rem',
                            background: 'rgba(99, 102, 241, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)'
                        }}>
                            <FiUsers size={18} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>Users</span>
                    </button>

                    <button
                        onClick={() => navigate('/chits')}
                        style={{
                            padding: '1rem',
                            borderRadius: '1rem',
                            background: 'var(--surface-light)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                        className="card-hover"
                    >
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '0.75rem',
                            background: 'rgba(236, 72, 153, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ec4899'
                        }}>
                            <FiGrid size={18} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>Chits</span>
                    </button>

                    <button
                        onClick={() => navigate('/payments')}
                        style={{
                            padding: '1rem',
                            borderRadius: '1rem',
                            background: 'var(--surface-light)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                        className="card-hover"
                    >
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '0.75rem',
                            background: 'rgba(16, 185, 129, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#10b981'
                        }}>
                            <FiCreditCard size={18} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>Pay</span>
                    </button>
                </div>
            </div>

            {/* Status & Alerts Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                    System Status
                </h2>

                {/* Online Status */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    borderRadius: '1rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.15)'
                }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FiActivity size={18} style={{ color: '#10b981' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>System Online</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All services operational</p>
                    </div>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 10px #10b981',
                        animation: 'pulse 2s ease-in-out infinite'
                    }} />
                </div>

                {/* Pending Alert - Admin Only */}
                {isAdmin() && stats?.pending_amount > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        borderRadius: '1rem',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.15)'
                    }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'rgba(245, 158, 11, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FiAlertCircle size={18} style={{ color: '#f59e0b' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>Pending Payments</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>
                                {formatCurrency(stats.pending_amount)} outstanding
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/payments')}
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '0.5rem',
                                background: 'rgba(245, 158, 11, 0.2)',
                                border: 'none',
                                color: '#f59e0b',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                            }}
                        >
                            View <FiArrowRight size={12} />
                        </button>
                    </div>
                )}
            </div>

            {/* Recent Payments - Admin Only */}
            {isAdmin() && stats?.recent_payments?.length > 0 && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                            Recent Payments
                        </h2>
                        <button
                            onClick={() => navigate('/payments')}
                            style={{
                                fontSize: '0.75rem',
                                color: 'var(--primary)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontWeight: 500
                            }}
                        >
                            View All <FiArrowRight size={12} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {stats.recent_payments.slice(0, 5).map((payment, index) => (
                            <div
                                key={payment.id}
                                className="animate-fade-in"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.875rem',
                                    borderRadius: '0.875rem',
                                    background: 'var(--surface-light)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    animationDelay: `${index * 50}ms`
                                }}
                            >
                                <div className="avatar avatar-md avatar-gradient" style={{ flexShrink: 0 }}>
                                    {payment.user_name?.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {payment.user_name}
                                    </p>
                                    <p style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {payment.chit_name}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <p style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.875rem' }}>
                                        +{formatCurrency(payment.amount_paid)}
                                    </p>
                                    <p style={{ fontSize: '0.625rem', color: 'var(--text-dim)' }}>
                                        {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
