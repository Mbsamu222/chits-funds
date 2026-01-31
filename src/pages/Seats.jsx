import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { FiPlus, FiEye, FiUsers, FiDollarSign, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Seats() {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        seat_name: '',
        total_amount: '',
        total_months: 20,
        start_date: ''
    });

    useEffect(() => {
        fetchSeats();
    }, []);

    const fetchSeats = async () => {
        try {
            const response = await api.get('/seats');
            setSeats(response.data);
        } catch (error) {
            toast.error('Failed to fetch seats');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await api.post('/seats', {
                ...formData,
                total_amount: parseFloat(formData.total_amount),
                total_months: parseInt(formData.total_months)
            });
            toast.success('Seat created successfully');
            setShowModal(false);
            resetForm();
            fetchSeats();
        } catch (error) {
            const message = error.response?.data?.detail || 'Failed to create seat';
            toast.error(message);
        }
    };

    const resetForm = () => {
        setFormData({ seat_name: '', total_amount: '', total_months: 20, start_date: '' });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const columns = [
        {
            key: 'seat_name',
            label: 'Seat Name',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--secondary)] to-[var(--primary)] flex items-center justify-center text-white">
                        <FiDollarSign />
                    </div>
                    <div>
                        <p className="font-medium">{row.seat_name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{row.total_months} months</p>
                    </div>
                </div>
            )
        },
        {
            key: 'total_amount',
            label: 'Total Amount',
            render: (row) => (
                <span className="font-semibold text-[var(--primary)]">
                    {formatCurrency(row.total_amount)}
                </span>
            )
        },
        {
            key: 'monthly_amount',
            label: 'Monthly',
            className: 'hidden md:table-cell',
            render: (row) => formatCurrency(row.monthly_amount)
        },
        {
            key: 'members',
            label: 'Members',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <FiUsers className="text-[var(--text-muted)]" />
                    <span>{row.member_count}/{row.total_months}</span>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <span className={`badge ${row.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
                <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/seats/${row.id}`); }}
                    className="p-2 rounded-lg hover:bg-[var(--surface-light)] text-[var(--primary)]"
                >
                    <FiEye />
                </button>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Seats</h1>
                    <p className="text-[var(--text-muted)]">Manage chit fund groups</p>
                </div>
                {isAdmin() && (
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn btn-primary"
                    >
                        <FiPlus /> Create Seat
                    </button>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card">
                    <p className="stat-label">Total Seats</p>
                    <p className="stat-value">{seats.length}</p>
                </div>
                <div className="stat-card">
                    <p className="stat-label">Active Seats</p>
                    <p className="stat-value text-[var(--success)]">
                        {seats.filter(s => s.is_active).length}
                    </p>
                </div>
                <div className="stat-card">
                    <p className="stat-label">Total Value</p>
                    <p className="stat-value text-[var(--primary)]">
                        {formatCurrency(seats.reduce((sum, s) => sum + s.total_amount, 0))}
                    </p>
                </div>
                <div className="stat-card">
                    <p className="stat-label">Total Members</p>
                    <p className="stat-value">
                        {seats.reduce((sum, s) => sum + s.member_count, 0)}
                    </p>
                </div>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={seats}
                loading={loading}
                onRowClick={(row) => navigate(`/seats/${row.id}`)}
                emptyMessage="No seats created yet"
            />

            {/* Create Seat Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Create New Seat"
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleSubmit} className="btn btn-primary">
                            Create
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="input-group">
                        <label>Seat Name *</label>
                        <input
                            type="text"
                            value={formData.seat_name}
                            onChange={(e) => setFormData({ ...formData, seat_name: e.target.value })}
                            className="input"
                            placeholder="e.g., Gold Seat 2026"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="input-group">
                            <label>Total Amount (₹) *</label>
                            <input
                                type="number"
                                value={formData.total_amount}
                                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                                className="input"
                                placeholder="500000"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Total Months *</label>
                            <input
                                type="number"
                                value={formData.total_months}
                                onChange={(e) => setFormData({ ...formData, total_months: e.target.value })}
                                className="input"
                                min="1"
                                max="100"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Monthly Amount (Auto-calculated)</label>
                        <input
                            type="text"
                            value={formData.total_amount && formData.total_months
                                ? formatCurrency(formData.total_amount / formData.total_months)
                                : '-'
                            }
                            className="input bg-[var(--surface-light)]"
                            disabled
                        />
                    </div>

                    <div className="input-group">
                        <label>Start Date</label>
                        <div className="relative">
                            <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="input pl-11"
                            />
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
