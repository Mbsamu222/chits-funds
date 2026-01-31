import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Modal from '../components/Modal';
import {
    FiArrowLeft, FiUsers, FiDollarSign, FiCalendar, FiPlus,
    FiUser, FiAward, FiCheck, FiClock
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SeatDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const [seat, setSeat] = useState(null);
    const [members, setMembers] = useState([]);
    const [months, setMonths] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showAuctionModal, setShowAuctionModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [users, setUsers] = useState([]);
    const [memberForm, setMemberForm] = useState({ user_id: '', slot_number: '' });
    const [auctionForm, setAuctionForm] = useState({ winner_user_id: '', payout_amount: '', auction_date: '' });

    useEffect(() => {
        fetchSeatData();
    }, [id]);

    const fetchSeatData = async () => {
        try {
            const [seatRes, membersRes, monthsRes] = await Promise.all([
                api.get(`/seats/${id}`),
                api.get(`/seats/${id}/members`),
                api.get(`/seats/${id}/months`)
            ]);
            setSeat(seatRes.data);
            setMembers(membersRes.data.members);
            setMonths(monthsRes.data.months);
        } catch (error) {
            toast.error('Failed to fetch seat details');
            navigate('/seats');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            toast.error('Failed to fetch users');
        }
    };

    const handleAddMember = async () => {
        try {
            await api.post(`/seats/${id}/members`, {
                user_id: parseInt(memberForm.user_id),
                slot_number: parseInt(memberForm.slot_number)
            });
            toast.success('Member added successfully');
            setShowAddMemberModal(false);
            setMemberForm({ user_id: '', slot_number: '' });
            fetchSeatData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to add member');
        }
    };

    const handleUpdateAuction = async () => {
        try {
            await api.put(`/seats/${id}/months/${selectedMonth.month_number}`, {
                winner_user_id: parseInt(auctionForm.winner_user_id),
                payout_amount: parseFloat(auctionForm.payout_amount),
                auction_date: auctionForm.auction_date,
                status: 'completed'
            });
            toast.success('Auction updated successfully');
            setShowAuctionModal(false);
            fetchSeatData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to update auction');
        }
    };

    const openAddMemberModal = async () => {
        await fetchUsers();
        // Find next available slot
        const usedSlots = members.map(m => m.slot_number);
        let nextSlot = 1;
        while (usedSlots.includes(nextSlot) && nextSlot <= seat.total_months) {
            nextSlot++;
        }
        setMemberForm({ user_id: '', slot_number: nextSlot.toString() });
        setShowAddMemberModal(true);
    };

    const openAuctionModal = (month) => {
        setSelectedMonth(month);
        setAuctionForm({
            winner_user_id: month.winner_user_id || '',
            payout_amount: month.payout_amount || seat?.total_amount || '',
            auction_date: month.auction_date || new Date().toISOString().split('T')[0]
        });
        setShowAuctionModal(true);
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

    if (!seat) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Back Button */}
            <button
                onClick={() => navigate('/seats')}
                className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)]"
            >
                <FiArrowLeft /> Back to Seats
            </button>

            {/* Seat Header */}
            <div className="card">
                <div className="card-body">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--secondary)] to-[var(--primary)] flex items-center justify-center text-white text-2xl">
                                <FiDollarSign />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{seat.seat_name}</h1>
                                <p className="text-[var(--text-muted)]">
                                    {seat.total_months} months • {formatCurrency(seat.monthly_amount)}/month
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-[var(--primary)]">{formatCurrency(seat.total_amount)}</p>
                                <p className="text-xs text-[var(--text-muted)]">Total Amount</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold">{seat.member_count}/{seat.total_months}</p>
                                <p className="text-xs text-[var(--text-muted)]">Members</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members Section */}
            <div className="card">
                <div className="card-header flex items-center justify-between">
                    <h2 className="font-semibold flex items-center gap-2">
                        <FiUsers /> Members
                    </h2>
                    {isAdmin() && (
                        <button onClick={openAddMemberModal} className="btn btn-sm btn-primary">
                            <FiPlus /> Add Member
                        </button>
                    )}
                </div>
                <div className="card-body">
                    {members.length === 0 ? (
                        <div className="text-center py-8 text-[var(--text-muted)]">
                            No members added yet
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {members.map((member) => (
                                <div
                                    key={member.id}
                                    onClick={() => navigate(`/users/${member.user_id}`)}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-light)] hover:bg-[var(--primary)]/10 cursor-pointer transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] font-bold">
                                        {member.slot_number}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{member.user_name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{member.user_phone}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Monthly Auctions */}
            <div className="card">
                <div className="card-header">
                    <h2 className="font-semibold flex items-center gap-2">
                        <FiCalendar /> Monthly Auctions
                    </h2>
                </div>
                <div className="card-body">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-3">
                        {months.map((month) => (
                            <div
                                key={month.id}
                                onClick={() => isAdmin() && openAuctionModal(month)}
                                className={`
                  p-3 rounded-lg text-center cursor-pointer transition-all
                  ${month.status === 'completed'
                                        ? 'bg-[var(--success)]/20 border border-[var(--success)]'
                                        : 'bg-[var(--surface-light)] hover:bg-[var(--primary)]/10'
                                    }
                `}
                            >
                                <p className="text-lg font-bold">M{month.month_number}</p>
                                {month.status === 'completed' ? (
                                    <FiCheck className="mx-auto text-[var(--success)]" />
                                ) : (
                                    <FiClock className="mx-auto text-[var(--text-muted)]" />
                                )}
                                {month.winner_name && (
                                    <p className="text-xs text-[var(--text-muted)] truncate mt-1">
                                        {month.winner_name}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add Member Modal */}
            <Modal
                isOpen={showAddMemberModal}
                onClose={() => setShowAddMemberModal(false)}
                title="Add Member to Seat"
                footer={
                    <>
                        <button onClick={() => setShowAddMemberModal(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleAddMember} className="btn btn-primary">
                            Add Member
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="input-group">
                        <label>Select User *</label>
                        <select
                            value={memberForm.user_id}
                            onChange={(e) => setMemberForm({ ...memberForm, user_id: e.target.value })}
                            className="select"
                        >
                            <option value="">Choose a user</option>
                            {users.filter(u => !members.some(m => m.user_id === u.id)).map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.phone})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Slot Number *</label>
                        <input
                            type="number"
                            value={memberForm.slot_number}
                            onChange={(e) => setMemberForm({ ...memberForm, slot_number: e.target.value })}
                            className="input"
                            min="1"
                            max={seat.total_months}
                        />
                    </div>
                </div>
            </Modal>

            {/* Auction Modal */}
            <Modal
                isOpen={showAuctionModal}
                onClose={() => setShowAuctionModal(false)}
                title={`Month ${selectedMonth?.month_number} Auction`}
                footer={
                    <>
                        <button onClick={() => setShowAuctionModal(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleUpdateAuction} className="btn btn-success">
                            Save Auction
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="input-group">
                        <label>Winner *</label>
                        <select
                            value={auctionForm.winner_user_id}
                            onChange={(e) => setAuctionForm({ ...auctionForm, winner_user_id: e.target.value })}
                            className="select"
                        >
                            <option value="">Select winner</option>
                            {members.map((member) => (
                                <option key={member.user_id} value={member.user_id}>
                                    Slot {member.slot_number}: {member.user_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Payout Amount (₹) *</label>
                        <input
                            type="number"
                            value={auctionForm.payout_amount}
                            onChange={(e) => setAuctionForm({ ...auctionForm, payout_amount: e.target.value })}
                            className="input"
                        />
                    </div>

                    <div className="input-group">
                        <label>Auction Date</label>
                        <input
                            type="date"
                            value={auctionForm.auction_date}
                            onChange={(e) => setAuctionForm({ ...auctionForm, auction_date: e.target.value })}
                            className="input"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
