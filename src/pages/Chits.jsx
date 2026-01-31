import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiGrid, FiUsers, FiCalendar, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function Chits() {
    const { isAdmin } = useAuth();
    const [chits, setChits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        chit_name: '',
        total_amount: '',
        total_months: '20',
        start_date: ''
    });

    useEffect(() => {
        fetchChits();
    }, []);

    const fetchChits = async () => {
        try {
            const response = await api.get('/chits');
            setChits(response.data);
        } catch (error) {
            console.error('Error fetching chits:', error);
            toast.error('Failed to load chits');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/chits', formData);
            toast.success('Chit group created successfully');
            setIsAddModalOpen(false);
            setFormData({
                chit_name: '',
                total_amount: '',
                total_months: '20',
                start_date: ''
            });
            fetchChits();
        } catch (error) {
            console.error('Error creating chit:', error);
            toast.error(error.response?.data?.detail || 'Failed to create chit');
        }
    };

    const filteredChits = chits.filter(chit =>
        chit.chit_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="spinner"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Chit <span className="text-[var(--primary)]">Groups</span></h1>
                    <p className="text-[var(--text-muted)] mt-1 text-lg">Manage all chit funds and active groups</p>
                </div>

                {isAdmin() && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn btn-primary flex items-center gap-2 shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40 transition-all active:scale-95"
                    >
                        <FiPlus className="text-xl" />
                        <span className="font-semibold">New Chit Group</span>
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="stat-card group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-lg shadow-[var(--primary)]/30 group-hover:scale-110 transition-transform duration-300">
                            <FiGrid size={24} />
                        </div>
                        <div>
                            <p className="stat-label mb-1">Total Groups</p>
                            <p className="stat-value text-[var(--text)]">{chits.length}</p>
                        </div>
                    </div>
                </div>

                <div className="stat-card group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-gradient-to-br from-[var(--secondary)] to-purple-600 text-white shadow-lg shadow-[var(--secondary)]/30 group-hover:scale-110 transition-transform duration-300">
                            <FiUsers size={24} />
                        </div>
                        <div>
                            <p className="stat-label mb-1">Total Members</p>
                            <p className="stat-value text-[var(--text)]">
                                {chits.reduce((acc, curr) => acc + curr.member_count, 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="stat-card group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-gradient-to-br from-[var(--success)] to-emerald-600 text-white shadow-lg shadow-[var(--success)]/30 group-hover:scale-110 transition-transform duration-300">
                            <FiCalendar size={24} />
                        </div>
                        <div>
                            <p className="stat-label mb-1">Active Groups</p>
                            <p className="stat-value text-[var(--text)]">
                                {chits.filter(c => c.is_active).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md group">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                <input
                    type="text"
                    placeholder="Search chit groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-11 w-full text-lg shadow-sm"
                />
            </div>

            {/* Chits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredChits.map(chit => (
                    <Link
                        key={chit.id}
                        to={`/chits/${chit.id}`}
                        className="card hover:bg-white/5 transition-all duration-300 group block hover:scale-[1.02] hover:shadow-2xl hover:shadow-[var(--primary)]/10"
                    >
                        <div className="p-6 space-y-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold group-hover:text-[var(--primary)] transition-colors">
                                        {chit.chit_name}
                                    </h3>
                                    <p className="text-xs text-[var(--text-muted)] mt-1 font-medium uppercase tracking-wider">
                                        Created {new Date(chit.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${chit.is_active
                                    ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'
                                    : 'bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/20'
                                    }`}>
                                    {chit.is_active ? 'Active' : 'Completed'}
                                </span>
                            </div>

                            <div className="space-y-3 p-4 rounded-xl bg-black/20 border border-white/5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-muted)]">Total Amount</span>
                                    <span className="font-bold text-[var(--text)]">₹{chit.total_amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-muted)]">Monthly Payment</span>
                                    <span className="font-bold text-[var(--text)]">₹{chit.monthly_amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-muted)]">Duration</span>
                                    <span className="font-medium">{chit.total_months} Months</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium text-[var(--text-muted)]">
                                    <span>Members</span>
                                    <span>{chit.member_count} / {chit.total_months}</span>
                                </div>
                                {/* Progress bar */}
                                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden shadow-inner">
                                    <div
                                        className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] h-full rounded-full transition-all duration-500 shadow-sm"
                                        style={{ width: `${(chit.member_count / chit.total_months) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end text-[var(--primary)] text-sm font-bold gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                <span>View Details</span>
                                <div className="w-6 h-6 rounded-full bg-[var(--primary)]/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                    <FiArrowRight size={14} />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredChits.length === 0 && (
                <div className="text-center py-12 text-[var(--text-muted)]">
                    No chit groups found matching your search.
                </div>
            )}

            {/* Create Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Create New Chit Group"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
                            Group Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.chit_name}
                            onChange={(e) => setFormData({ ...formData, chit_name: e.target.value })}
                            className="input w-full"
                            placeholder="e.g. Kuri Group A"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
                                Total Amount (₹)
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.total_amount}
                                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                                className="input w-full"
                                placeholder="500000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
                                Total Months
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                max="100"
                                value={formData.total_months}
                                onChange={(e) => setFormData({ ...formData, total_months: e.target.value })}
                                className="input w-full"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
                            Start Date (Optional)
                        </label>
                        <input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            className="input w-full"
                        />
                    </div>

                    {formData.total_amount && formData.total_months && (
                        <div className="p-3 rounded bg-[var(--background)] border border-white/5">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--text-muted)]">Monthly Installment:</span>
                                <span className="font-bold text-[var(--success)]">
                                    ₹{(formData.total_amount / formData.total_months).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="btn btn-ghost"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Create Chit
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
