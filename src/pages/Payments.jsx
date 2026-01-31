import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { FiPlus, FiDollarSign, FiCreditCard, FiUpload, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Payments() {
    const { isAdmin } = useAuth();
    const [searchParams] = useSearchParams();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [chits, setChits] = useState([]);
    const [users, setUsers] = useState([]);
    const [chitMonths, setChitMonths] = useState([]);
    const [formData, setFormData] = useState({
        user_id: searchParams.get('user') || '',
        chit_id: searchParams.get('chit') || '',
        chit_month_id: '',
        amount_paid: '',
        payment_mode: 'cash',
        notes: ''
    });

    useEffect(() => {
        fetchPayments();
        fetchChits();
        fetchUsers();
    }, []);

    useEffect(() => {
        if (formData.chit_id) {
            fetchChitMonths(formData.chit_id);
        }
    }, [formData.chit_id]);

    // Open modal if URL has params
    useEffect(() => {
        if (searchParams.get('user') && searchParams.get('chit')) {
            setShowModal(true);
        }
    }, [searchParams]);

    const fetchPayments = async () => {
        try {
            const response = await api.get('/payments');
            setPayments(response.data);
        } catch (error) {
            toast.error('Failed to fetch payments');
        } finally {
            setLoading(false);
        }
    };

    const fetchChits = async () => {
        try {
            const response = await api.get('/chits');
            setChits(response.data);
        } catch (error) {
            console.error('Failed to fetch chits');
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users');
        }
    };

    const fetchChitMonths = async (chitId) => {
        try {
            const response = await api.get(`/chits/${chitId}/months`);
            setChitMonths(response.data.months);

            // Also set default amount from chit
            const chit = chits.find(s => s.id === parseInt(chitId));
            if (chit && !formData.amount_paid) {
                setFormData(prev => ({ ...prev, amount_paid: chit.monthly_amount }));
            }
        } catch (error) {
            console.error('Failed to fetch chit months');
        }
    };

    const handleSubmit = async () => {
        try {
            await api.post('/payments', {
                ...formData,
                user_id: parseInt(formData.user_id),
                chit_id: parseInt(formData.chit_id),
                chit_month_id: formData.chit_month_id ? parseInt(formData.chit_month_id) : null,
                amount_paid: parseFloat(formData.amount_paid)
            });
            toast.success('Payment recorded successfully');
            setShowModal(false);
            resetForm();
            fetchPayments();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to record payment');
        }
    };

    const resetForm = () => {
        setFormData({
            user_id: '',
            chit_id: '',
            chit_month_id: '',
            amount_paid: '',
            payment_mode: 'cash',
            notes: ''
        });
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
            key: 'user',
            label: 'User',
            render: (row) => (
                <div>
                    <p className="font-medium">{row.user_name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{row.chit_name}</p>
                </div>
            )
        },
        {
            key: 'amount',
            label: 'Amount',
            render: (row) => (
                <span className="font-semibold text-[var(--success)]">
                    {formatCurrency(row.amount_paid)}
                </span>
            )
        },
        {
            key: 'month',
            label: 'Month',
            className: 'hidden md:table-cell',
            render: (row) => row.month_number ? `Month ${row.month_number}` : '-'
        },
        {
            key: 'mode',
            label: 'Mode',
            render: (row) => (
                <span className={`badge ${row.payment_mode === 'cash' ? 'badge-primary' : 'badge-success'}`}>
                    {row.payment_mode === 'cash' ? (
                        <><FiDollarSign className="mr-1" /> Cash</>
                    ) : (
                        <><FiCreditCard className="mr-1" /> GPay</>
                    )}
                </span>
            )
        },
        {
            key: 'collected',
            label: 'Collected By',
            className: 'hidden lg:table-cell',
            render: (row) => row.collected_by_name
        },
        {
            key: 'date',
            label: 'Date',
            className: 'hidden md:table-cell',
            render: (row) => new Date(row.payment_date).toLocaleDateString()
        },
        {
            key: 'screenshot',
            label: '',
            render: (row) => row.screenshot_url ? (
                <a
                    href={`http://localhost:8000${row.screenshot_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--primary)] hover:underline"
                >
                    <FiImage />
                </a>
            ) : null
        }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Payments</h1>
                    <p className="text-[var(--text-muted)] mt-1 text-lg">Record and track all financial transactions</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="btn btn-primary shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40 hover:-translate-y-0.5 transition-all"
                >
                    <FiPlus className="text-xl" /> <span className="font-semibold">Record Payment</span>
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="stat-card group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-gradient-to-br from-[var(--primary)] to-indigo-600 text-white shadow-lg shadow-[var(--primary)]/30 group-hover:scale-110 transition-transform">
                            <FiDollarSign size={24} />
                        </div>
                        <div>
                            <p className="stat-label mb-1">Total Payments</p>
                            <p className="stat-value text-[var(--text)]">{payments.length}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-gradient-to-br from-[var(--success)] to-emerald-600 text-white shadow-lg shadow-[var(--success)]/30 group-hover:scale-110 transition-transform">
                            <FiDollarSign size={24} />
                        </div>
                        <div>
                            <p className="stat-label mb-1">Total Collected</p>
                            <p className="stat-value text-[var(--success)]">
                                {formatCurrency(payments.reduce((sum, p) => sum + p.amount_paid, 0))}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="stat-card group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                            <FiDollarSign size={24} />
                        </div>
                        <div>
                            <p className="stat-label mb-1">Cash Payments</p>
                            <p className="stat-value text-[var(--text)]">
                                {payments.filter(p => p.payment_mode === 'cash').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="stat-card group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                            <FiCreditCard size={24} />
                        </div>
                        <div>
                            <p className="stat-label mb-1">GPay Payments</p>
                            <p className="stat-value text-[var(--text)]">
                                {payments.filter(p => p.payment_mode === 'gpay').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={payments}
                loading={loading}
                emptyMessage="No payments recorded yet"
            />

            {/* Add Payment Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Record Payment"
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleSubmit} className="btn btn-success">
                            <FiDollarSign /> Record Payment
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="input-group">
                        <label>Select User *</label>
                        <select
                            value={formData.user_id}
                            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                            className="select"
                        >
                            <option value="">Choose user</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.phone})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Select Chit *</label>
                        <select
                            value={formData.chit_id}
                            onChange={(e) => setFormData({ ...formData, chit_id: e.target.value, chit_month_id: '' })}
                            className="select"
                        >
                            <option value="">Choose chit group</option>
                            {chits.map((chit) => (
                                <option key={chit.id} value={chit.id}>
                                    {chit.chit_name} ({formatCurrency(chit.monthly_amount)}/month)
                                </option>
                            ))}
                        </select>
                    </div>

                    {formData.chit_id && chitMonths.length > 0 && (
                        <div className="input-group">
                            <label>For Month</label>
                            <select
                                value={formData.chit_month_id}
                                onChange={(e) => setFormData({ ...formData, chit_month_id: e.target.value })}
                                className="select"
                            >
                                <option value="">Select month (optional)</option>
                                {chitMonths.map((month) => (
                                    <option key={month.id} value={month.id}>
                                        Month {month.month_number} - {month.status}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="input-group">
                        <label>Amount (₹) *</label>
                        <input
                            type="number"
                            value={formData.amount_paid}
                            onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                            className="input"
                            placeholder="Enter amount"
                        />
                    </div>

                    <div className="input-group">
                        <label>Payment Mode *</label>
                        <div className="flex gap-4">
                            <label className={`
                flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all text-center
                ${formData.payment_mode === 'cash'
                                    ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                                    : 'border-[var(--surface-light)]'
                                }
              `}>
                                <input
                                    type="radio"
                                    name="payment_mode"
                                    value="cash"
                                    checked={formData.payment_mode === 'cash'}
                                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                                    className="sr-only"
                                />
                                <FiDollarSign className="mx-auto text-xl mb-1" />
                                <span className="text-sm font-medium">Cash</span>
                            </label>

                            <label className={`
                flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all text-center
                ${formData.payment_mode === 'gpay'
                                    ? 'border-[var(--success)] bg-[var(--success)]/10'
                                    : 'border-[var(--surface-light)]'
                                }
              `}>
                                <input
                                    type="radio"
                                    name="payment_mode"
                                    value="gpay"
                                    checked={formData.payment_mode === 'gpay'}
                                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                                    className="sr-only"
                                />
                                <FiCreditCard className="mx-auto text-xl mb-1" />
                                <span className="text-sm font-medium">GPay</span>
                            </label>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="input min-h-[80px]"
                            placeholder="Optional notes"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
