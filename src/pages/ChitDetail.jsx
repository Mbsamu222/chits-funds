import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiUserPlus, FiDollarSign, FiCalendar, FiCheck, FiX, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

export default function ChitDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const [chit, setChit] = useState(null);
    const [members, setMembers] = useState([]);
    const [months, setMonths] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [memberForm, setMemberForm] = useState({
        user_id: '',
        slot_number: ''
    });

    // Auction Modal
    const [isAuctionModalOpen, setIsAuctionModalOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [auctionForm, setAuctionForm] = useState({
        auction_date: new Date().toISOString().split('T')[0],
        winner_user_id: '',
        payout_amount: '',
        admin_profit: '',
        status: 'completed'
    });

    useEffect(() => {
        fetchChitDetails();
    }, [id]);

    const fetchChitDetails = async () => {
        try {
            const [chitRes, membersRes, monthsRes] = await Promise.all([
                api.get(`/chits/${id}`),
                api.get(`/chits/${id}/members`),
                api.get(`/chits/${id}/months`)
            ]);

            setChit(chitRes.data);
            setMembers(membersRes.data.members || []);
            setMonths(monthsRes.data.months || []);
        } catch (error) {
            console.error('Error fetching details:', error);
            toast.error('Failed to load details');
            navigate('/chits');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        if (users.length > 0) return;
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    // --- Member Management ---

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/chits/${id}/members`, memberForm);
            toast.success('Member added successfully');
            setIsAddMemberModalOpen(false);
            setMemberForm({ user_id: '', slot_number: '' });
            fetchChitDetails(); // Refresh all
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to add member');
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('Are you sure? This will remove the member from this chit group.')) return;
        try {
            await api.delete(`/chits/${id}/members/${memberId}`);
            toast.success('Member removed');
            fetchChitDetails();
        } catch (error) {
            toast.error('Failed to remove member');
        }
    };

    // --- Auction Management ---

    const openAuctionModal = (month) => {
        setSelectedMonth(month);
        setAuctionForm({
            auction_date: month.auction_date || new Date().toISOString().split('T')[0],
            winner_user_id: month.winner_user_id || '',
            payout_amount: month.payout_amount || '',
            admin_profit: month.admin_profit || (chit.total_amount * 0.05), // Default 5% commission
            status: month.status === 'completed' ? 'completed' : 'completed'
        });
        setIsAuctionModalOpen(true);
        fetchUsers(); // Ensure we have users list for winner selection
    };

    const handleAuctionSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/chits/${id}/months/${selectedMonth.month_number}`, auctionForm);
            toast.success('Auction recorded successfully');
            setIsAuctionModalOpen(false);
            fetchChitDetails();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to record auction');
        }
    };

    if (loading) return <div className="p-8 text-center text-[var(--text-muted)]">Loading details...</div>;
    if (!chit) return null;

    const memberColumns = [
        { header: 'Slot', accessor: 'slot_number', className: 'w-16 text-center font-bold' },
        { header: 'Member Name', accessor: 'user_name' },
        { header: 'Phone', accessor: 'user_phone' },
        { header: 'Join Date', accessor: (m) => new Date(m.join_date).toLocaleDateString() },
        {
            header: 'Actions',
            accessor: (m) => isAdmin() ? (
                <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="p-1 hover:bg-[var(--danger)]/10 text-[var(--danger)] rounded"
                >
                    <FiTrash2 />
                </button>
            ) : null,
            className: 'w-16'
        }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-4">
                <span onClick={() => navigate('/chits')} className="cursor-pointer hover:text-[var(--primary)] transition-colors">Chits</span>
                <span>/</span>
                <span className="text-[var(--text)] font-semibold">{chit.chit_name}</span>
            </div>

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="stat-card group">
                    <div className="flex flex-col">
                        <p className="stat-label mb-1">Total Amount</p>
                        <p className="stat-value text-[var(--primary)] group-hover:scale-105 transition-transform origin-left">
                            ₹{chit.total_amount.toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="stat-card group">
                    <div className="flex flex-col">
                        <p className="stat-label mb-1">Monthly Payment</p>
                        <p className="stat-value text-[var(--text)] group-hover:scale-105 transition-transform origin-left">
                            ₹{chit.monthly_amount.toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="stat-card group">
                    <div className="flex flex-col">
                        <p className="stat-label mb-1">Progress</p>
                        <p className="stat-value text-[var(--text)] group-hover:scale-105 transition-transform origin-left">
                            {months.filter(m => m.status === 'completed').length} <span className="text-sm text-[var(--text-muted)] font-normal">/ {chit.total_months} mo</span>
                        </p>
                    </div>
                </div>
                <div className="stat-card group">
                    <div className="flex flex-col">
                        <p className="stat-label mb-1">Members</p>
                        <p className="stat-value text-[var(--text)] group-hover:scale-105 transition-transform origin-left">
                            {chit.member_count} <span className="text-sm text-[var(--text-muted)] font-normal">/ {chit.total_months}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Members List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-xl font-bold">Members</h2>
                        {isAdmin() && (
                            <button
                                onClick={() => { setIsAddMemberModalOpen(true); fetchUsers(); }}
                                className="btn btn-sm bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white border-none gap-2"
                                disabled={members.length >= chit.total_months}
                            >
                                <FiUserPlus /> Add
                            </button>
                        )}
                    </div>
                    <div className="card glass overflow-hidden shadow-xl">
                        <DataTable
                            columns={memberColumns}
                            data={members}
                            searchable={false}
                            pageSize={10}
                        />
                    </div>
                </div>

                {/* Monthly Auctions */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold px-1">Monthly Auctions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {months.map(month => (
                            <div key={month.id} className={`card p-5 group transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${month.status === 'completed'
                                ? 'bg-gradient-to-br from-[var(--success)]/10 to-transparent border-[var(--success)]/20 shadow-[var(--success)]/5'
                                : 'bg-[var(--surface)] border-white/5'
                                }`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${month.status === 'completed' ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-white/10 text-[var(--text-muted)]'}`}>
                                            {month.month_number}
                                        </div>
                                        <span className="font-bold text-lg">Month {month.month_number}</span>
                                    </div>
                                    <span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold ${month.status === 'completed'
                                        ? 'bg-[var(--success)] text-white shadow-lg shadow-[var(--success)]/30'
                                        : 'bg-[var(--surface-light)] text-[var(--text-muted)] border border-white/10'
                                        }`}>
                                        {month.status}
                                    </span>
                                </div>

                                {month.status === 'completed' ? (
                                    <div className="space-y-3 text-sm p-3 rounded-xl bg-black/10 border border-white/5">
                                        <div className="flex justify-between items-center group/item pb-2 border-b border-white/5">
                                            <span className="text-[var(--text-muted)]">Winner</span>
                                            <span className="font-bold text-[var(--primary)] flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>
                                                {month.winner_name || 'Unknown'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[var(--text-muted)]">Payout</span>
                                            <span className="font-medium">₹{month.payout_amount?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[var(--text-muted)]">Admin Profit</span>
                                            <span className="font-medium text-[var(--success)]">+₹{month.admin_profit?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 mt-1 border-t border-white/5">
                                            <span className="text-[var(--text-muted)] font-medium">Total Collected</span>
                                            <span className="font-bold text-lg">₹{month.total_collected?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-6 text-center">
                                        {isAdmin() ? (
                                            <button
                                                onClick={() => openAuctionModal(month)}
                                                className="btn btn-primary w-full shadow-lg shadow-[var(--primary)]/20"
                                            >
                                                Record Auction
                                            </button>
                                        ) : (
                                            <span className="text-[var(--text-muted)] text-sm italic flex items-center justify-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[var(--warning)] animate-pulse"></div>
                                                Auction pending
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isAddMemberModalOpen} onClose={() => setIsAddMemberModalOpen(false)} title="Add Member">
                <form onSubmit={handleAddMember} className="space-y-4">
                    <div>
                        <label className="label">Select User</label>
                        <select
                            className="input w-full"
                            required
                            value={memberForm.user_id}
                            onChange={(e) => setMemberForm({ ...memberForm, user_id: e.target.value })}
                        >
                            <option value="">Select a user...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.phone})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Slot Number</label>
                        <input
                            type="number"
                            className="input w-full"
                            required
                            min="1"
                            max={chit.total_months}
                            placeholder={`1 - ${chit.total_months}`}
                            value={memberForm.slot_number}
                            onChange={(e) => setMemberForm({ ...memberForm, slot_number: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setIsAddMemberModalOpen(false)} className="btn btn-ghost">Cancel</button>
                        <button type="submit" className="btn btn-primary">Add Member</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isAuctionModalOpen} onClose={() => setIsAuctionModalOpen(false)} title={`Auction for Month ${selectedMonth?.month_number}`}>
                <form onSubmit={handleAuctionSubmit} className="space-y-4">
                    <div>
                        <label className="label">Auction Date</label>
                        <input
                            type="date"
                            className="input w-full"
                            required
                            value={auctionForm.auction_date}
                            onChange={(e) => setAuctionForm({ ...auctionForm, auction_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="label">Winner</label>
                        <select
                            className="input w-full"
                            required
                            value={auctionForm.winner_user_id}
                            onChange={(e) => setAuctionForm({ ...auctionForm, winner_user_id: e.target.value })}
                        >
                            <option value="">Select winner...</option>
                            {members.map(m => (
                                <option key={m.user_id} value={m.user_id}>{m.user_name} (Slot {m.slot_number})</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Payout Amount (₹)</label>
                            <input
                                type="number"
                                className="input w-full"
                                required
                                value={auctionForm.payout_amount}
                                onChange={(e) => setAuctionForm({ ...auctionForm, payout_amount: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label">Admin Profit (₹)</label>
                            <input
                                type="number"
                                className="input w-full"
                                required
                                value={auctionForm.admin_profit}
                                onChange={(e) => setAuctionForm({ ...auctionForm, admin_profit: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setIsAuctionModalOpen(false)} className="btn btn-ghost">Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Auction</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
