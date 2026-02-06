import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FiUserPlus, FiDollarSign, FiCalendar, FiTrash2,
    FiArrowLeft, FiUsers, FiCheck, FiClock, FiPrinter
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import PamphletGenerator from '../components/PamphletGenerator';

export default function ChitDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const [chit, setChit] = useState(null);
    const [members, setMembers] = useState([]);
    const [months, setMonths] = useState([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

    // Modal states
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isAuctionModalOpen, setIsAuctionModalOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [showPamphlet, setShowPamphlet] = useState(null);

    // Form states
    const [memberForm, setMemberForm] = useState({ user_id: '', slot_number: '' });
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
            // Handle paginated response
            const data = response.data.items || response.data;
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            const data = {
                user_id: parseInt(memberForm.user_id),
                slot_number: parseInt(memberForm.slot_number)
            };
            await api.post(`/chits/${id}/members`, data);
            toast.success('Member added successfully');
            setIsAddMemberModalOpen(false);
            setMemberForm({ user_id: '', slot_number: '' });
            fetchChitDetails();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to add member');
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('Remove this member from the group?')) return;
        try {
            await api.delete(`/chits/${id}/members/${memberId}`);
            toast.success('Member removed');
            fetchChitDetails();
        } catch (error) {
            toast.error('Failed to remove member');
        }
    };

    const openAuctionModal = (month) => {
        setSelectedMonth(month);
        setAuctionForm({
            auction_date: month.auction_date || new Date().toISOString().split('T')[0],
            winner_user_id: month.winner_user_id || '',
            payout_amount: month.payout_amount || '',
            admin_profit: month.admin_profit || (chit.total_amount * 0.05),
            status: 'completed'
        });
        setIsAuctionModalOpen(true);
        fetchUsers();
    };

    const handleAuctionSubmit = async (e) => {
        e.preventDefault();
        try {
            // Convert form data to proper types for API
            const data = {
                auction_date: auctionForm.auction_date || null,
                winner_user_id: auctionForm.winner_user_id ? parseInt(auctionForm.winner_user_id) : null,
                payout_amount: auctionForm.payout_amount ? parseFloat(auctionForm.payout_amount) : null,
                admin_profit: auctionForm.admin_profit ? parseFloat(auctionForm.admin_profit) : null,
                status: auctionForm.status || 'completed'
            };
            await api.put(`/chits/${id}/months/${selectedMonth.month_number}`, data);
            toast.success('Auction recorded successfully');
            setIsAuctionModalOpen(false);
            fetchChitDetails();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to record auction');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-pulse">
                <div className="skeleton" style={{ height: '2.5rem', width: '8rem', borderRadius: '0.75rem' }} />
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1rem'
                }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton" style={{ height: '7rem', borderRadius: '1rem' }} />
                    ))}
                </div>
                <div className="skeleton" style={{ height: '16rem', borderRadius: '1rem' }} />
            </div>
        );
    }

    if (!chit) return null;

    const completedMonths = months.filter(m => m.status === 'completed').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
            {/* Back Button */}
            <button
                onClick={() => navigate('/chits')}
                className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    transition: 'color 0.2s'
                }}
            >
                <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    background: 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                }}>
                    <FiArrowLeft />
                </div>
                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Back to Chits</span>
            </button>

            {/* Header */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                            fontWeight: 800,
                            letterSpacing: '-0.025em'
                        }}>
                            {chit.chit_name}
                        </h1>
                        <p style={{
                            color: 'var(--text-muted)',
                            marginTop: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <FiCalendar size={14} />
                            Started {new Date(chit.start_date).toLocaleDateString('en-IN', {
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </div>
                    <span className={`badge ${chit.is_active ? 'badge-success' : 'badge-secondary'}`}>
                        {chit.is_active ? 'Active' : 'Completed'}
                    </span>
                </div>
            </div>

            {/* Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem'
            }}>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
                            flexShrink: 0
                        }}>
                            <FiDollarSign size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Total Amount</p>
                            <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
                                {formatCurrency(chit.total_amount)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, var(--secondary) 0%, #db2777 100%)',
                            flexShrink: 0
                        }}>
                            <FiDollarSign size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Monthly</p>
                            <p style={{ fontSize: '1rem', fontWeight: 800 }}>
                                {formatCurrency(chit.monthly_amount)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, var(--success) 0%, #059669 100%)',
                            flexShrink: 0
                        }}>
                            <FiClock size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Progress</p>
                            <p style={{ fontSize: '1rem', fontWeight: 800 }}>
                                {completedMonths}/{chit.total_months}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, var(--accent) 0%, #0d9488 100%)',
                            flexShrink: 0
                        }}>
                            <FiUsers size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Members</p>
                            <p style={{ fontSize: '1rem', fontWeight: 800 }}>
                                {chit.member_count}/{chit.total_months}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '1.5rem'
            }} className="content-grid">
                {/* Members */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiUsers /> Members
                        </h2>
                        {isAdmin() && members.length < chit.total_months && (
                            <button
                                onClick={() => { setIsAddMemberModalOpen(true); fetchUsers(); }}
                                className="btn btn-sm btn-primary"
                            >
                                <FiUserPlus size={16} /> Add
                            </button>
                        )}
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {members.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <FiUsers style={{ margin: '0 auto', color: 'var(--text-dim)', marginBottom: '0.75rem' }} size={32} />
                                <p style={{ color: 'var(--text-muted)' }}>No members yet</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {members.map((member, index) => (
                                    <div
                                        key={member.id}
                                        className="animate-fade-in"
                                        style={{
                                            padding: '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            borderTop: index > 0 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                                            transition: 'background 0.2s',
                                            animationDelay: `${index * 50}ms`
                                        }}
                                    >
                                        <div style={{
                                            width: '2.5rem',
                                            height: '2.5rem',
                                            borderRadius: '0.75rem',
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            color: 'var(--primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            flexShrink: 0
                                        }}>
                                            {member.slot_number}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.user_name}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.user_phone}</p>
                                        </div>
                                        {isAdmin() && (
                                            <button
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="btn-icon-sm btn-ghost"
                                                style={{ color: 'var(--danger)' }}
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Monthly Auctions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiCalendar /> Monthly Auctions
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '1rem'
                    }}>
                        {months.map((month, index) => (
                            <div
                                key={month.id}
                                className="card animate-fade-in"
                                style={{
                                    padding: '1rem',
                                    animationDelay: `${index * 30}ms`,
                                    borderColor: month.status === 'completed' ? 'rgba(16, 185, 129, 0.3)' : undefined,
                                    background: month.status === 'completed' ? 'rgba(16, 185, 129, 0.05)' : undefined
                                }}
                            >
                                {/* Month Header */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{
                                            width: '2rem',
                                            height: '2rem',
                                            borderRadius: '0.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '0.875rem',
                                            background: month.status === 'completed' ? 'var(--success)' : 'var(--surface-light)',
                                            color: month.status === 'completed' ? 'white' : 'var(--text-muted)'
                                        }}>
                                            {month.status === 'completed' ? <FiCheck size={16} /> : month.month_number}
                                        </div>
                                        <span style={{ fontWeight: 600 }}>Month {month.month_number}</span>
                                    </div>
                                    <span style={{
                                        fontSize: '0.625rem',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '9999px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        background: month.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'var(--surface-light)',
                                        color: month.status === 'completed' ? 'var(--success)' : 'var(--text-muted)'
                                    }}>
                                        {month.status}
                                    </span>
                                </div>

                                {/* Content */}
                                {month.status === 'completed' ? (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem',
                                        fontSize: '0.875rem',
                                        padding: '0.75rem',
                                        borderRadius: '0.75rem',
                                        background: 'rgba(0, 0, 0, 0.2)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Winner</span>
                                            <span style={{ fontWeight: 500, color: 'var(--primary)' }}>
                                                {month.winner_name || 'Unknown'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Payout</span>
                                            <span style={{ fontWeight: 500 }}>
                                                {formatCurrency(month.payout_amount)}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Profit</span>
                                            <span style={{ fontWeight: 500, color: 'var(--success)' }}>
                                                +{formatCurrency(month.admin_profit)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setShowPamphlet(month.month_number)}
                                            className="btn btn-sm btn-secondary"
                                            style={{ width: '100%', marginTop: '0.75rem' }}
                                        >
                                            <FiPrinter size={14} /> Print Pamphlet
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                                        {isAdmin() ? (
                                            <button
                                                onClick={() => openAuctionModal(month)}
                                                className="btn btn-primary btn-sm"
                                                style={{ width: '100%' }}
                                            >
                                                Record Auction
                                            </button>
                                        ) : (
                                            <span style={{
                                                color: 'var(--text-muted)',
                                                fontSize: '0.875rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                <div style={{
                                                    width: '0.5rem',
                                                    height: '0.5rem',
                                                    borderRadius: '50%',
                                                    background: 'var(--warning)'
                                                }} className="animate-pulse" />
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add Member Modal */}
            <Modal
                isOpen={isAddMemberModalOpen}
                onClose={() => setIsAddMemberModalOpen(false)}
                title="Add Member"
                footer={
                    <>
                        <button onClick={() => setIsAddMemberModalOpen(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleAddMember} className="btn btn-primary">
                            Add Member
                        </button>
                    </>
                }
            >
                <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="input-group">
                        <label>Select User *</label>
                        <select
                            className="input"
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
                    <div className="input-group">
                        <label>Slot Number *</label>
                        <input
                            type="number"
                            className="input"
                            required
                            min="1"
                            max={chit.total_months}
                            placeholder={`1 - ${chit.total_months}`}
                            value={memberForm.slot_number}
                            onChange={(e) => setMemberForm({ ...memberForm, slot_number: e.target.value })}
                        />
                    </div>
                </form>
            </Modal>

            {/* Auction Modal */}
            <Modal
                isOpen={isAuctionModalOpen}
                onClose={() => setIsAuctionModalOpen(false)}
                title={`Auction - Month ${selectedMonth?.month_number}`}
                footer={
                    <>
                        <button onClick={() => setIsAuctionModalOpen(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleAuctionSubmit} className="btn btn-primary">
                            Save Auction
                        </button>
                    </>
                }
            >
                <form onSubmit={handleAuctionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="input-group">
                        <label>Auction Date *</label>
                        <input
                            type="date"
                            className="input"
                            required
                            value={auctionForm.auction_date}
                            onChange={(e) => setAuctionForm({ ...auctionForm, auction_date: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label>Winner *</label>
                        <select
                            className="input"
                            required
                            value={auctionForm.winner_user_id}
                            onChange={(e) => setAuctionForm({ ...auctionForm, winner_user_id: e.target.value })}
                        >
                            <option value="">Select winner...</option>
                            {members.map(m => (
                                <option key={m.user_id} value={m.user_id}>
                                    {m.user_name} (Slot {m.slot_number})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Payout Amount (₹) *</label>
                            <input
                                type="number"
                                className="input"
                                required
                                value={auctionForm.payout_amount}
                                onChange={(e) => setAuctionForm({ ...auctionForm, payout_amount: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label>Admin Profit (₹) *</label>
                            <input
                                type="number"
                                className="input"
                                required
                                value={auctionForm.admin_profit}
                                onChange={(e) => setAuctionForm({ ...auctionForm, admin_profit: e.target.value })}
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Responsive Styles for Content Grid */}
            <style>{`
                @media (min-width: 1024px) {
                    .content-grid {
                        grid-template-columns: 1fr 2fr !important;
                    }
                }
            `}</style>

            {/* Pamphlet Generator Modal */}
            {showPamphlet && (
                <PamphletGenerator
                    chitId={id}
                    monthNumber={showPamphlet}
                    chitName={chit.chit_name}
                    onClose={() => setShowPamphlet(null)}
                />
            )}
        </div>
    );
}
