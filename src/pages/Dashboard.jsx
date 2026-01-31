import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
    FiUsers, FiGrid, FiDollarSign, FiTrendingUp,
    FiArrowRight, FiClock
} from 'react-icons/fi';

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
            if (isAdmin()) {
                const response = await api.get('/reports/dashboard');
                setStats(response.data);
            } else {
                // Staff dashboard - fetch their users count
                const usersResponse = await api.get('/users');
                setStats({
                    stats: { total_users: usersResponse.data.length },
                    financial: null,
                    recent_payments: []
                });
            }
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                        Welcome back, <span className="gradient-text">{user?.name}</span>
                    </h1>
                    <p className="text-[var(--text-muted)] mt-2 text-lg">
                        Here's your financial overview for today.
                    </p>
                </div>
                <div className={`
                    px-4 py-2 rounded-full glass flex items-center gap-2
                    ${isAdmin() ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-[var(--success)] text-[var(--success)]'}
                `}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                    <span className="font-semibold tracking-wide text-sm">{user?.role?.toUpperCase()}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Users */}
                <div className="stat-card group">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-label mb-1">Total Users</p>
                            <p className="stat-value">{stats?.stats?.total_users || 0}</p>
                        </div>
                        <div className="stat-icon bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 text-[var(--primary)] group-hover:scale-110 transition-transform duration-300">
                            <FiUsers />
                        </div>
                    </div>
                </div>

                {isAdmin() && (
                    <>
                        {/* Staff */}
                        <div className="stat-card group">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="stat-label mb-1">Total Staff</p>
                                    <p className="stat-value">{stats?.stats?.total_staff || 0}</p>
                                </div>
                                <div className="stat-icon bg-gradient-to-br from-[var(--secondary)]/20 to-[var(--secondary)]/5 text-[var(--secondary)] group-hover:scale-110 transition-transform duration-300">
                                    <FiUsers />
                                </div>
                            </div>
                        </div>

                        {/* Chits */}
                        <div className="stat-card group">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="stat-label mb-1">Active Groups</p>
                                    <p className="stat-value">{stats?.stats?.total_chits || 0}</p>
                                </div>
                                <div className="stat-icon bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 text-[var(--accent)] group-hover:scale-110 transition-transform duration-300">
                                    <FiGrid />
                                </div>
                            </div>
                        </div>

                        {/* Profit */}
                        <div className="stat-card group">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="stat-label mb-1">Total Profit</p>
                                    <p className="stat-value text-[var(--success)]">
                                        {formatCurrency(stats?.financial?.total_profit || 0)}
                                    </p>
                                </div>
                                <div className="stat-icon bg-gradient-to-br from-[var(--success)]/20 to-[var(--success)]/5 text-[var(--success)] group-hover:scale-110 transition-transform duration-300">
                                    <FiTrendingUp />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Financial Summary - Admin Only - Glass Cards */}
            {isAdmin() && stats?.financial && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="card bg-gradient-to-br from-[var(--primary)]/10 to-transparent border-[var(--primary)]/20">
                        <div className="card-body text-center py-8">
                            <p className="text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider mb-2">Total Collected</p>
                            <p className="text-3xl font-bold text-[var(--text)]">
                                {formatCurrency(stats.financial.total_collected)}
                            </p>
                        </div>
                    </div>
                    <div className="card bg-gradient-to-br from-[var(--warning)]/10 to-transparent border-[var(--warning)]/20">
                        <div className="card-body text-center py-8">
                            <p className="text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider mb-2">Total Payout</p>
                            <p className="text-3xl font-bold text-[var(--text)]">
                                {formatCurrency(stats.financial.total_payout)}
                            </p>
                        </div>
                    </div>
                    <div className="card bg-gradient-to-br from-[var(--success)]/10 to-transparent border-[var(--success)]/20">
                        <div className="card-body text-center py-8">
                            <p className="text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider mb-2">Net Profit</p>
                            <p className="text-3xl font-bold text-[var(--success)]">
                                {formatCurrency(stats.financial.total_profit)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-semibold mb-4 ml-1">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button
                        onClick={() => navigate('/users')}
                        className="card p-6 text-left hover:border-[var(--primary)] transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FiUsers className="text-6xl text-[var(--primary)]" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mb-4 group-hover:scale-110 transition-transform">
                                <FiUsers className="text-2xl" />
                            </div>
                            <h3 className="font-bold text-lg mb-1">Manage Users</h3>
                            <p className="text-sm text-[var(--text-muted)]">View and manage all members</p>
                            <div className="mt-4 flex items-center text-sm font-medium text-[var(--primary)] opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                                View Users <FiArrowRight className="ml-2" />
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate('/chits')}
                        className="card p-6 text-left hover:border-[var(--secondary)] transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FiGrid className="text-6xl text-[var(--secondary)]" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-[var(--secondary)]/10 flex items-center justify-center text-[var(--secondary)] mb-4 group-hover:scale-110 transition-transform">
                                <FiGrid className="text-2xl" />
                            </div>
                            <h3 className="font-bold text-lg mb-1">Manage Chits</h3>
                            <p className="text-sm text-[var(--text-muted)]">View chit groups and members</p>
                            <div className="mt-4 flex items-center text-sm font-medium text-[var(--secondary)] opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                                View Chits <FiArrowRight className="ml-2" />
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate('/payments')}
                        className="card p-6 text-left hover:border-[var(--accent)] transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FiDollarSign className="text-6xl text-[var(--accent)]" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] mb-4 group-hover:scale-110 transition-transform">
                                <FiDollarSign className="text-2xl" />
                            </div>
                            <h3 className="font-bold text-lg mb-1">Record Payment</h3>
                            <p className="text-sm text-[var(--text-muted)]">Add cash or GPay payment</p>
                            <div className="mt-4 flex items-center text-sm font-medium text-[var(--accent)] opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                                Add Payment <FiArrowRight className="ml-2" />
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Recent Payments - Admin */}
            {isAdmin() && stats?.recent_payments?.length > 0 && (
                <div className="card">
                    <div className="card-header flex items-center justify-between">
                        <h3 className="font-bold text-lg">Recent Payments</h3>
                        <button
                            onClick={() => navigate('/payments')}
                            className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
                        >
                            View All History
                        </button>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Chit</th>
                                    <th>Amount</th>
                                    <th>Mode</th>
                                    <th className="hidden md:table-cell">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recent_payments.map((payment) => (
                                    <tr key={payment.id} className="group">
                                        <td className="font-medium text-[var(--text)] group-hover:text-white transition-colors">{payment.user_name}</td>
                                        <td>{payment.chit_name}</td>
                                        <td className="text-[var(--success)] font-bold">{formatCurrency(payment.amount)}</td>
                                        <td>
                                            <span className={`badge ${payment.mode === 'cash' ? 'badge-primary' : 'badge-success'}`}>
                                                {payment.mode.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="hidden md:table-cell text-[var(--text-muted)]">
                                            {new Date(payment.date).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pending Months Alert */}
            {isAdmin() && stats?.stats?.pending_months > 0 && (
                <div className="card bg-gradient-to-r from-[var(--warning)]/10 to-transparent border-[var(--warning)]/20">
                    <div className="card-body flex items-center gap-6">
                        <div className="w-12 h-12 rounded-full bg-[var(--warning)]/20 flex items-center justify-center text-[var(--warning)] flex-shrink-0 animate-pulse">
                            <FiClock className="text-2xl" />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-[var(--warning)]">Pending Auctions</h4>
                            <p className="text-[var(--text-muted)]">
                                You have {stats.stats.pending_months} pending month auctions across all chits.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/chits')}
                            className="ml-auto btn btn-sm bg-[var(--warning)]/10 text-[var(--warning)] hover:bg-[var(--warning)] hover:text-white border border-[var(--warning)]/20"
                        >
                            Review Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
