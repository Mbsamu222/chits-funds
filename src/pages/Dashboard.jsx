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
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        Welcome back, <span className="gradient-text">{user?.name}</span>
                    </h1>
                    <p className="text-[var(--text-muted)] mt-1">
                        Here's what's happening with your chit funds today.
                    </p>
                </div>
                <span className={`badge ${isAdmin() ? 'badge-primary' : 'badge-success'} text-sm`}>
                    {user?.role?.toUpperCase()}
                </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Users */}
                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-label">Total Users</p>
                            <p className="stat-value">{stats?.stats?.total_users || 0}</p>
                        </div>
                        <div className="stat-icon bg-[var(--primary)]/20 text-[var(--primary)]">
                            <FiUsers />
                        </div>
                    </div>
                </div>

                {isAdmin() && (
                    <>
                        {/* Staff */}
                        <div className="stat-card">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="stat-label">Total Staff</p>
                                    <p className="stat-value">{stats?.stats?.total_staff || 0}</p>
                                </div>
                                <div className="stat-icon bg-[var(--secondary)]/20 text-[var(--secondary)]">
                                    <FiUsers />
                                </div>
                            </div>
                        </div>

                        {/* Seats */}
                        <div className="stat-card">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="stat-label">Active Seats</p>
                                    <p className="stat-value">{stats?.stats?.total_seats || 0}</p>
                                </div>
                                <div className="stat-icon bg-[var(--accent)]/20 text-[var(--accent)]">
                                    <FiGrid />
                                </div>
                            </div>
                        </div>

                        {/* Profit */}
                        <div className="stat-card">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="stat-label">Total Profit</p>
                                    <p className="stat-value text-[var(--success)]">
                                        {formatCurrency(stats?.financial?.total_profit || 0)}
                                    </p>
                                </div>
                                <div className="stat-icon bg-[var(--success)]/20 text-[var(--success)]">
                                    <FiTrendingUp />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Financial Summary - Admin Only */}
            {isAdmin() && stats?.financial && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="card">
                        <div className="card-body text-center">
                            <p className="text-[var(--text-muted)] text-sm">Total Collected</p>
                            <p className="text-2xl font-bold text-[var(--primary)]">
                                {formatCurrency(stats.financial.total_collected)}
                            </p>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-body text-center">
                            <p className="text-[var(--text-muted)] text-sm">Total Payout</p>
                            <p className="text-2xl font-bold text-[var(--warning)]">
                                {formatCurrency(stats.financial.total_payout)}
                            </p>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-body text-center">
                            <p className="text-[var(--text-muted)] text-sm">Net Profit</p>
                            <p className="text-2xl font-bold text-[var(--success)]">
                                {formatCurrency(stats.financial.total_profit)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                    onClick={() => navigate('/users')}
                    className="card p-6 text-left hover:border-[var(--primary)] transition-colors group"
                >
                    <FiUsers className="text-2xl text-[var(--primary)] mb-3" />
                    <h3 className="font-semibold mb-1">Manage Users</h3>
                    <p className="text-sm text-[var(--text-muted)]">View and manage all members</p>
                    <FiArrowRight className="mt-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-2 transition-all" />
                </button>

                <button
                    onClick={() => navigate('/seats')}
                    className="card p-6 text-left hover:border-[var(--secondary)] transition-colors group"
                >
                    <FiGrid className="text-2xl text-[var(--secondary)] mb-3" />
                    <h3 className="font-semibold mb-1">Manage Seats</h3>
                    <p className="text-sm text-[var(--text-muted)]">View chit groups and members</p>
                    <FiArrowRight className="mt-4 text-[var(--text-muted)] group-hover:text-[var(--secondary)] group-hover:translate-x-2 transition-all" />
                </button>

                <button
                    onClick={() => navigate('/payments')}
                    className="card p-6 text-left hover:border-[var(--accent)] transition-colors group"
                >
                    <FiDollarSign className="text-2xl text-[var(--accent)] mb-3" />
                    <h3 className="font-semibold mb-1">Record Payment</h3>
                    <p className="text-sm text-[var(--text-muted)]">Add cash or GPay payment</p>
                    <FiArrowRight className="mt-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-2 transition-all" />
                </button>
            </div>

            {/* Recent Payments - Admin */}
            {isAdmin() && stats?.recent_payments?.length > 0 && (
                <div className="card">
                    <div className="card-header flex items-center justify-between">
                        <h3 className="font-semibold">Recent Payments</h3>
                        <button
                            onClick={() => navigate('/payments')}
                            className="text-sm text-[var(--primary)] hover:underline"
                        >
                            View All
                        </button>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Seat</th>
                                    <th>Amount</th>
                                    <th>Mode</th>
                                    <th className="hidden md:table-cell">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recent_payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td className="font-medium">{payment.user_name}</td>
                                        <td>{payment.seat_name}</td>
                                        <td className="text-[var(--success)]">{formatCurrency(payment.amount)}</td>
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
                <div className="card border-[var(--warning)] bg-[var(--warning)]/5">
                    <div className="card-body flex items-center gap-4">
                        <FiClock className="text-2xl text-[var(--warning)]" />
                        <div>
                            <h4 className="font-semibold">Pending Auctions</h4>
                            <p className="text-sm text-[var(--text-muted)]">
                                You have {stats.stats.pending_months} pending month auctions across all seats.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
