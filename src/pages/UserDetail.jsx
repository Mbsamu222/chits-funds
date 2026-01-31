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

    const { user, chits, total_paid, total_balance, pending_months } = data;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Back Button */}
            <button
                onClick={() => navigate('/users')}
                className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group mb-6"
            >
                <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center group-hover:bg-[var(--primary)]/10 transition-colors">
                    <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                </div>
                <span className="font-medium">Back to Users</span>
            </button>

            {/* User Info Card */}
            <div className="card glass p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-32 bg-[var(--primary)]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-[var(--primary)]/10 transition-colors duration-500"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-4xl font-extrabold shadow-2xl shadow-[var(--primary)]/30 ring-4 ring-white/5">
                        {user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <h1 className="text-4xl font-extrabold tracking-tight">{user.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide border ${user.is_active
                                ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'
                                : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'
                                }`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-base">
                            <div className="flex items-center gap-3 text-[var(--text-muted)]">
                                <div className="w-10 h-10 rounded-xl bg-[var(--surface-light)] flex items-center justify-center text-[var(--primary)]">
                                    <FiPhone size={20} />
                                </div>
                                <span className="font-medium text-[var(--text)]">{user.phone}</span>
                            </div>
                            {user.email && (
                                <div className="flex items-center gap-3 text-[var(--text-muted)]">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--surface-light)] flex items-center justify-center text-[var(--primary)]">
                                        <FiMail size={20} />
                                    </div>
                                    <span className="font-medium text-[var(--text)]">{user.email}</span>
                                </div>
                            )}
                            {user.address && (
                                <div className="flex items-center gap-3 text-[var(--text-muted)] col-span-full lg:col-span-1">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--surface-light)] flex items-center justify-center text-[var(--primary)]">
                                        <FiMapPin size={20} />
                                    </div>
                                    <span className="font-medium text-[var(--text)]">{user.address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="stat-card group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-gradient-to-br from-[var(--success)] to-emerald-600 text-white shadow-lg shadow-[var(--success)]/30 group-hover:scale-110 transition-transform duration-300">
                            <FiDollarSign size={24} />
                        </div>
                        <div>
                            <p className="stat-label mb-1">Total Paid</p>
                            <p className="stat-value text-[var(--success)]">{formatCurrency(total_paid)}</p>
                        </div>
                    </div>
                </div>

                <div className="stat-card group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-gradient-to-br from-[var(--warning)] to-orange-500 text-white shadow-lg shadow-[var(--warning)]/30 group-hover:scale-110 transition-transform duration-300">
                            <FiDollarSign size={24} />
                        </div>
                        <div>
                            <p className="stat-label mb-1">Outstanding Balance</p>
                            <p className="stat-value text-[var(--warning)]">{formatCurrency(total_balance)}</p>
                        </div>
                    </div>
                </div>

                <div className="stat-card group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-lg shadow-[var(--primary)]/30 group-hover:scale-110 transition-transform duration-300">
                            <FiGrid size={24} />
                        </div>
                        <div>
                            <p className="stat-label mb-1">Pending Months</p>
                            <p className="stat-value text-[var(--text)]">{pending_months}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chits */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold tracking-tight">Joined Groups <span className="text-[var(--text-muted)] text-lg font-normal">({chits.length})</span></h2>

                {chits.length === 0 ? (
                    <div className="card glass p-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-[var(--surface-light)] flex items-center justify-center text-[var(--text-muted)]">
                            <FiGrid size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">No Groups Joined</h3>
                            <p className="text-[var(--text-muted)]">This user hasn't joined any chit groups yet.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {chits.map((chit) => (
                            <div key={chit.chit_id} className="card glass overflow-hidden group hover:border-[var(--primary)]/30 transition-all duration-300">
                                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-[var(--surface)] to-transparent">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-xl group-hover:text-[var(--primary)] transition-colors">{chit.chit_name}</h3>
                                            <p className="text-sm text-[var(--text-muted)] mt-1 flex items-center gap-2">
                                                <span className="bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Slot #{chit.slot_number}</span>
                                                <span>•</span>
                                                <span className="text-[var(--text)] font-medium">{formatCurrency(chit.monthly_amount)}/month</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm bg-black/20 p-2 rounded-lg border border-white/5">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[var(--text-muted)] text-xs uppercase tracking-wider">Paid</span>
                                                <span className="text-[var(--success)] font-bold">{formatCurrency(chit.total_paid)}</span>
                                            </div>
                                            <div className="w-px h-8 bg-white/10"></div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[var(--text-muted)] text-xs uppercase tracking-wider">Balance</span>
                                                <span className="text-[var(--warning)] font-bold">{formatCurrency(chit.balance)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div>
                                        <p className="text-sm font-medium text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                            <FiCalendar /> Payment History ({chit.total_months} months)
                                        </p>
                                        <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                                            <PaymentStatusGrid
                                                months={chit.month_status}
                                                onMonthClick={(month) => {
                                                    if (!month.is_paid) {
                                                        navigate(`/payments?user=${id}&chit=${chit.chit_id}`);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex justify-between text-xs font-medium text-[var(--text-muted)] mb-2">
                                            <span>Payment Progress</span>
                                            <span className="text-[var(--text)]">{Math.round((chit.total_paid / chit.total_amount) * 100)}%</span>
                                        </div>
                                        <div className="h-3 bg-[var(--surface-light)] rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full transition-all duration-1000 ease-out shadow-lg shadow-[var(--primary)]/20"
                                                style={{ width: `${Math.min(100, (chit.total_paid / chit.total_amount) * 100)}%` }}
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
