import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import PaymentStatusGrid from '../components/PaymentStatusGrid';
import { FiArrowLeft, FiPhone, FiMail, FiMapPin, FiGrid, FiDollarSign } from 'react-icons/fi';
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
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!data) return null;

    const { user, seats, total_paid, total_balance, pending_months } = data;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Back Button */}
            <button
                onClick={() => navigate('/users')}
                className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)]"
            >
                <FiArrowLeft /> Back to Users
            </button>

            {/* User Info Card */}
            <div className="card">
                <div className="card-body">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-bold">{user.name}</h1>
                                <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                                    {user.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                    <FiPhone className="text-[var(--primary)]" />
                                    <span>{user.phone}</span>
                                </div>
                                {user.email && (
                                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                        <FiMail className="text-[var(--primary)]" />
                                        <span>{user.email}</span>
                                    </div>
                                )}
                                {user.address && (
                                    <div className="flex items-start gap-2 text-[var(--text-muted)] col-span-full">
                                        <FiMapPin className="text-[var(--primary)] mt-0.5" />
                                        <span>{user.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon bg-[var(--success)]/20 text-[var(--success)]">
                            <FiDollarSign />
                        </div>
                        <div>
                            <p className="stat-label">Total Paid</p>
                            <p className="stat-value text-[var(--success)]">{formatCurrency(total_paid)}</p>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon bg-[var(--warning)]/20 text-[var(--warning)]">
                            <FiDollarSign />
                        </div>
                        <div>
                            <p className="stat-label">Balance</p>
                            <p className="stat-value text-[var(--warning)]">{formatCurrency(total_balance)}</p>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon bg-[var(--primary)]/20 text-[var(--primary)]">
                            <FiGrid />
                        </div>
                        <div>
                            <p className="stat-label">Pending Months</p>
                            <p className="stat-value">{pending_months}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seats */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Joined Seats ({seats.length})</h2>

                {seats.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <FiGrid className="empty-state-icon" />
                            <p>No seats joined yet</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {seats.map((seat) => (
                            <div key={seat.seat_id} className="card">
                                <div className="card-header">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <div>
                                            <h3 className="font-semibold text-lg">{seat.seat_name}</h3>
                                            <p className="text-sm text-[var(--text-muted)]">
                                                Slot #{seat.slot_number} • {formatCurrency(seat.monthly_amount)}/month
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-[var(--success)]">
                                                Paid: {formatCurrency(seat.total_paid)}
                                            </span>
                                            <span className="text-[var(--warning)]">
                                                Balance: {formatCurrency(seat.balance)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-body">
                                    <p className="text-sm text-[var(--text-muted)] mb-3">
                                        Payment Status ({seat.total_months} months)
                                    </p>
                                    <PaymentStatusGrid
                                        months={seat.month_status}
                                        onMonthClick={(month) => {
                                            if (!month.is_paid) {
                                                navigate(`/payments?user=${id}&seat=${seat.seat_id}`);
                                            }
                                        }}
                                    />

                                    {/* Progress Bar */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                                            <span>Progress</span>
                                            <span>{Math.round((seat.total_paid / seat.total_amount) * 100)}%</span>
                                        </div>
                                        <div className="h-2 bg-[var(--surface-light)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, (seat.total_paid / seat.total_amount) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
