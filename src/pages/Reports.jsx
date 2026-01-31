import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FiDollarSign, FiTrendingUp, FiGrid, FiCalendar } from 'react-icons/fi';

export default function Reports() {
    const { isAdmin } = useAuth();
    const [summary, setSummary] = useState(null);
    const [chitProfits, setChitProfits] = useState([]);
    const [monthlyProfits, setMonthlyProfits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const [summaryRes, chitsRes, monthlyRes] = await Promise.all([
                api.get('/reports/profit'),
                api.get('/reports/profit/chits'),
                api.get('/reports/profit/monthly')
            ]);
            setSummary(summaryRes.data);
            setChitProfits(chitsRes.data);
            setMonthlyProfits(monthlyRes.data);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
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

    if (!isAdmin()) {
        return (
            <div className="text-center py-12">
                <p className="text-[var(--text-muted)]">Access denied. Admin only.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Reports</h1>
                <p className="text-[var(--text-muted)]">Financial reports and profit analysis</p>
            </div>

            {/* Summary Cards */}
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="stat-card group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-lg shadow-[var(--primary)]/30 group-hover:scale-110 transition-transform duration-300">
                            <FiDollarSign />
                        </div>
                        <div>
                            <p className="stat-label mb-1">Total Collected</p>
                            <p className="stat-value text-[var(--primary)]">
                                {formatCurrency(summary?.total_collected || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="stat-card group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-gradient-to-br from-[var(--warning)] to-orange-500 text-white shadow-lg shadow-[var(--warning)]/30 group-hover:scale-110 transition-transform duration-300">
                            <FiTrendingUp />
                        </div>
                        <div>
                            <p className="stat-label mb-1">Total Payout</p>
                            <p className="stat-value text-[var(--warning)]">
                                {formatCurrency(summary?.total_payout || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="stat-card group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-gradient-to-br from-[var(--success)] to-emerald-600 text-white shadow-lg shadow-[var(--success)]/30 group-hover:scale-110 transition-transform duration-300">
                            <FiDollarSign />
                        </div>
                        <div>
                            <p className="stat-label mb-1">Net Profit</p>
                            <p className="stat-value text-[var(--success)]">
                                {formatCurrency(summary?.total_profit || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="stat-card group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-gradient-to-br from-[var(--secondary)] to-pink-600 text-white shadow-lg shadow-[var(--secondary)]/30 group-hover:scale-110 transition-transform duration-300">
                            <FiGrid />
                        </div>
                        <div>
                            <p className="stat-label mb-1">Active Groups</p>
                            <p className="stat-value">{summary?.chit_count || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-black/20 backdrop-blur-sm border border-white/5">
                {[
                    { id: 'overview', label: 'Chit-wise Profit', icon: FiGrid },
                    { id: 'monthly', label: 'Monthly Analysis', icon: FiCalendar }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all text-sm
                            ${activeTab === tab.id
                                ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20'
                                : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'
                            }
                        `}
                    >
                        <tab.icon /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Chit-wise Profits */}
            {activeTab === 'overview' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="font-semibold">Chit-wise Profit Report</h3>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Chit Name</th>
                                    <th className="hidden md:table-cell">Total Amount</th>
                                    <th className="hidden lg:table-cell">Progress</th>
                                    <th>Collected</th>
                                    <th>Payout</th>
                                    <th>Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chitProfits.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                                            No chit data available
                                        </td>
                                    </tr>
                                ) : (
                                    chitProfits.map((chit) => (
                                        <tr key={chit.chit_id}>
                                            <td>
                                                <div>
                                                    <p className="font-medium">{chit.chit_name}</p>
                                                    <span className={`badge ${chit.is_active ? 'badge-success' : 'badge-danger'} text-xs`}>
                                                        {chit.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="hidden md:table-cell">{formatCurrency(chit.total_amount)}</td>
                                            <td className="hidden lg:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-[var(--surface-light)] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[var(--primary)] rounded-full"
                                                            style={{ width: `${(chit.completed_months / chit.total_months) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-[var(--text-muted)]">
                                                        {chit.completed_months}/{chit.total_months}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-[var(--primary)]">{formatCurrency(chit.total_collected)}</td>
                                            <td className="text-[var(--warning)]">{formatCurrency(chit.total_payout)}</td>
                                            <td className={chit.profit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}>
                                                <span className="font-semibold">{formatCurrency(chit.profit)}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {chitProfits.length > 0 && (
                                <tfoot>
                                    <tr className="bg-[var(--surface)]">
                                        <td colSpan={3} className="font-semibold">Total</td>
                                        <td className="font-semibold text-[var(--primary)]">
                                            {formatCurrency(chitProfits.reduce((sum, s) => sum + s.total_collected, 0))}
                                        </td>
                                        <td className="font-semibold text-[var(--warning)]">
                                            {formatCurrency(chitProfits.reduce((sum, s) => sum + s.total_payout, 0))}
                                        </td>
                                        <td className="font-semibold text-[var(--success)]">
                                            {formatCurrency(chitProfits.reduce((sum, s) => sum + s.profit, 0))}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}

            {/* Monthly Profits */}
            {activeTab === 'monthly' && (
                <div className="card glass">
                    <div className="card-header flex items-center justify-between">
                        <h3 className="font-semibold">Monthly Profit Report - {monthlyProfits.year}</h3>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Month</th>
                                    <th>Collected</th>
                                    <th>Payout</th>
                                    <th>Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyProfits.months?.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-[var(--text-muted)]">
                                            No monthly data available
                                        </td>
                                    </tr>
                                ) : (
                                    monthlyProfits.months?.map((month) => (
                                        <tr key={month.month}>
                                            <td className="font-medium">{month.month}</td>
                                            <td className="text-[var(--primary)]">{formatCurrency(month.total_collected)}</td>
                                            <td className="text-[var(--warning)]">{formatCurrency(month.total_payout)}</td>
                                            <td className={month.profit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}>
                                                <span className="font-semibold">{formatCurrency(month.profit)}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {monthlyProfits.total && (
                                <tfoot>
                                    <tr className="bg-[var(--surface)]">
                                        <td className="font-semibold">Total</td>
                                        <td className="font-semibold text-[var(--primary)]">
                                            {formatCurrency(monthlyProfits.total.collected)}
                                        </td>
                                        <td className="font-semibold text-[var(--warning)]">
                                            {formatCurrency(monthlyProfits.total.payout)}
                                        </td>
                                        <td className="font-semibold text-[var(--success)]">
                                            {formatCurrency(monthlyProfits.total.profit)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
