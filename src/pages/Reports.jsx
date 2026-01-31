import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FiDollarSign, FiTrendingUp, FiGrid, FiCalendar } from 'react-icons/fi';

export default function Reports() {
    const { isAdmin } = useAuth();
    const [summary, setSummary] = useState(null);
    const [seatProfits, setSeatProfits] = useState([]);
    const [monthlyProfits, setMonthlyProfits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const [summaryRes, seatsRes, monthlyRes] = await Promise.all([
                api.get('/reports/profit'),
                api.get('/reports/profit/seats'),
                api.get('/reports/profit/monthly')
            ]);
            setSummary(summaryRes.data);
            setSeatProfits(seatsRes.data);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon bg-[var(--primary)] text-white">
                            <FiDollarSign />
                        </div>
                        <div>
                            <p className="stat-label">Total Collected</p>
                            <p className="stat-value text-[var(--primary)]">
                                {formatCurrency(summary?.total_collected || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="stat-card bg-gradient-to-br from-[var(--warning)]/20 to-[var(--warning)]/5">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon bg-[var(--warning)] text-white">
                            <FiTrendingUp />
                        </div>
                        <div>
                            <p className="stat-label">Total Payout</p>
                            <p className="stat-value text-[var(--warning)]">
                                {formatCurrency(summary?.total_payout || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="stat-card bg-gradient-to-br from-[var(--success)]/20 to-[var(--success)]/5">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon bg-[var(--success)] text-white">
                            <FiDollarSign />
                        </div>
                        <div>
                            <p className="stat-label">Net Profit</p>
                            <p className="stat-value text-[var(--success)]">
                                {formatCurrency(summary?.total_profit || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon bg-[var(--secondary)]/20 text-[var(--secondary)]">
                            <FiGrid />
                        </div>
                        <div>
                            <p className="stat-label">Active Seats</p>
                            <p className="stat-value">{summary?.seat_count || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[var(--surface-light)] overflow-x-auto">
                {[
                    { id: 'overview', label: 'Seat-wise', icon: FiGrid },
                    { id: 'monthly', label: 'Monthly', icon: FiCalendar }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
              flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap
              ${activeTab === tab.id
                                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                            }
            `}
                    >
                        <tab.icon /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Seat-wise Profits */}
            {activeTab === 'overview' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="font-semibold">Seat-wise Profit Report</h3>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Seat Name</th>
                                    <th className="hidden md:table-cell">Total Amount</th>
                                    <th className="hidden lg:table-cell">Progress</th>
                                    <th>Collected</th>
                                    <th>Payout</th>
                                    <th>Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {seatProfits.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                                            No seat data available
                                        </td>
                                    </tr>
                                ) : (
                                    seatProfits.map((seat) => (
                                        <tr key={seat.seat_id}>
                                            <td>
                                                <div>
                                                    <p className="font-medium">{seat.seat_name}</p>
                                                    <span className={`badge ${seat.is_active ? 'badge-success' : 'badge-danger'} text-xs`}>
                                                        {seat.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="hidden md:table-cell">{formatCurrency(seat.total_amount)}</td>
                                            <td className="hidden lg:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-[var(--surface-light)] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[var(--primary)] rounded-full"
                                                            style={{ width: `${(seat.completed_months / seat.total_months) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-[var(--text-muted)]">
                                                        {seat.completed_months}/{seat.total_months}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-[var(--primary)]">{formatCurrency(seat.total_collected)}</td>
                                            <td className="text-[var(--warning)]">{formatCurrency(seat.total_payout)}</td>
                                            <td className={seat.profit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}>
                                                <span className="font-semibold">{formatCurrency(seat.profit)}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {seatProfits.length > 0 && (
                                <tfoot>
                                    <tr className="bg-[var(--surface)]">
                                        <td colSpan={3} className="font-semibold">Total</td>
                                        <td className="font-semibold text-[var(--primary)]">
                                            {formatCurrency(seatProfits.reduce((sum, s) => sum + s.total_collected, 0))}
                                        </td>
                                        <td className="font-semibold text-[var(--warning)]">
                                            {formatCurrency(seatProfits.reduce((sum, s) => sum + s.total_payout, 0))}
                                        </td>
                                        <td className="font-semibold text-[var(--success)]">
                                            {formatCurrency(seatProfits.reduce((sum, s) => sum + s.profit, 0))}
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
                <div className="card">
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
