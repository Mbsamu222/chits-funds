import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import {
    FiPlus, FiCalendar, FiDollarSign, FiUsers, FiPlay,
    FiCheck, FiX, FiAward, FiTrendingDown, FiClock
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import '../styles/Auctions.css';

export default function Auctions() {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [auctions, setAuctions] = useState([]);
    const [chits, setChits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showBidModal, setShowBidModal] = useState(false);
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [auctionDetails, setAuctionDetails] = useState(null);
    const [chitMembers, setChitMembers] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, data: null });
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        chit_month_id: '',
        auction_date: new Date().toISOString().slice(0, 16)
    });

    const [bidData, setBidData] = useState({
        user_id: '',
        bid_amount: '',
        notes: ''
    });

    useEffect(() => {
        fetchAuctions();
        fetchChits();
    }, []);

    const fetchAuctions = async () => {
        try {
            const response = await api.get('/auctions');
            setAuctions(response.data);
        } catch (error) {
            toast.error('Failed to fetch auctions');
        } finally {
            setLoading(false);
        }
    };

    const fetchChits = async () => {
        try {
            const response = await api.get('/chits');
            const data = response.data.items || response.data;
            setChits(Array.isArray(data) ? data.filter(c => c.is_active) : []);
        } catch (error) {
            console.error('Failed to fetch chits');
        }
    };

    const fetchAuctionDetails = async (auctionId) => {
        try {
            const response = await api.get(`/auctions/${auctionId}`);
            setAuctionDetails(response.data);
            
            // Fetch chit members for this auction's chit
            if (response.data.chit_id) {
                const membersResponse = await api.get(`/chits/${response.data.chit_id}/members`);
                setChitMembers(membersResponse.data.members || []);
            }
        } catch (error) {
            toast.error('Failed to fetch auction details');
        }
    };

    const handleCreateAuction = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/auctions', formData);
            toast.success('Auction created successfully');
            setShowCreateModal(false);
            resetForm();
            fetchAuctions();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to create auction');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenAuction = async () => {
        setSaving(true);
        try {
            await api.post(`/auctions/${confirmDialog.data}/open`);
            toast.success('Auction opened for bidding');
            setConfirmDialog({ isOpen: false, action: null, data: null });
            fetchAuctions();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to open auction');
        } finally {
            setSaving(false);
        }
    };

    const handleCloseAuction = async () => {
        setSaving(true);
        try {
            const response = await api.post(`/auctions/${confirmDialog.data}/close`);
            toast.success(`Auction closed! Winner: ${response.data.winner_name}`);
            setConfirmDialog({ isOpen: false, action: null, data: null });
            fetchAuctions();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to close auction');
        } finally {
            setSaving(false);
        }
    };

    const handlePlaceBid = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/auctions/bid', {
                ...bidData,
                auction_id: selectedAuction.id
            });
            toast.success('Bid placed successfully');
            setShowBidModal(false);
            resetBidForm();
            fetchAuctionDetails(selectedAuction.id);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to place bid');
        } finally {
            setSaving(false);
        }
    };

    const openBidModal = async (auction) => {
        setSelectedAuction(auction);
        await fetchAuctionDetails(auction.id);
        setShowBidModal(true);
    };

    const resetForm = () => {
        setFormData({
            chit_month_id: '',
            auction_date: new Date().toISOString().slice(0, 16)
        });
    };

    const resetBidForm = () => {
        setBidData({
            user_id: '',
            bid_amount: '',
            notes: ''
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDateTime = (dateStr) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            scheduled: { class: 'badge-secondary', icon: FiClock },
            open: { class: 'badge-success', icon: FiPlay },
            closed: { class: 'badge-primary', icon: FiCheck },
            cancelled: { class: 'badge-danger', icon: FiX }
        };
        const config = statusMap[status] || statusMap.scheduled;
        const Icon = config.icon;
        return (
            <span className={`badge ${config.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Icon size={10} /> {status.toUpperCase()}
            </span>
        );
    };

    if (loading) {
        return <div className="spinner" />;
    }

    return (
        <div className="auctions-page">
            <div className="auctions-container">
                {/* Header */}
                <div className="auctions-header">
                    <div className="auctions-header-content">
                        <div className="auctions-title-section">
                            <h1>Auction Management</h1>
                            <p className="auctions-subtitle">Schedule and manage chit fund auctions</p>
                        </div>
                        {isAdmin() && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn btn-primary"
                            >
                                <FiPlus /> Schedule Auction
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="auction-stats-grid">
                    <div className="auction-stat-card total">
                        <div className="auction-stat-icon"><FiAward /></div>
                        <div className="auction-stat-label">Total Auctions</div>
                        <div className="auction-stat-value">{auctions.length}</div>
                    </div>
                    <div className="auction-stat-card open">
                        <div className="auction-stat-icon"><FiPlay /></div>
                        <div className="auction-stat-label">Open</div>
                        <div className="auction-stat-value">
                            {auctions.filter(a => a.status === 'open').length}
                        </div>
                    </div>
                    <div className="auction-stat-card scheduled">
                        <div className="auction-stat-icon"><FiClock /></div>
                        <div className="auction-stat-label">Scheduled</div>
                        <div className="auction-stat-value">
                            {auctions.filter(a => a.status === 'scheduled').length}
                        </div>
                    </div>
                    <div className="auction-stat-card closed">
                        <div className="auction-stat-icon"><FiCheck /></div>
                        <div className="auction-stat-label">Closed</div>
                        <div className="auction-stat-value">
                            {auctions.filter(a => a.status === 'closed').length}
                        </div>
                    </div>
                </div>

            {/* Auctions Grid */}
            {auctions.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <FiAward size={32} />
                    </div>
                    <h3 className="empty-state-title">No Auctions</h3>
                    <p className="empty-state-text">Schedule your first auction to get started</p>
                    {isAdmin() && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary"
                            style={{ marginTop: '1rem' }}
                        >
                            <FiPlus /> Schedule First Auction
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {auctions.map((auction, idx) => (
                        <div
                            key={auction.id}
                            className="card animate-fade-in"
                            style={{
                                padding: '1.25rem',
                                animationDelay: `${idx * 50}ms`,
                                cursor: 'pointer'
                            }}
                            onClick={() => openBidModal(auction)}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                                        {auction.chit_name}
                                    </h3>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Month {auction.month_number}
                                    </p>
                                </div>
                                {getStatusBadge(auction.status)}
                            </div>

                            {/* Date & Time */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                <FiCalendar size={14} />
                                {formatDateTime(auction.auction_date)}
                            </div>

                            {/* Stats */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.75rem',
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                background: 'var(--surface-light)',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Bids</p>
                                    <p style={{ fontWeight: 700, fontSize: '1.125rem' }}>{auction.total_bids}</p>
                                </div>
                                {auction.winning_bid_amount && (
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Winning Bid</p>
                                        <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--success)' }}>
                                            {formatCurrency(auction.winning_bid_amount)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Winner */}
                            {auction.winner_name && (
                                <div style={{
                                    marginTop: '0.75rem',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <FiAward style={{ color: 'var(--success)' }} size={16} />
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--success)' }}>
                                        Winner: {auction.winner_name}
                                    </span>
                                </div>
                            )}

                            {/* Actions */}
                            {isAdmin() && auction.status !== 'closed' && auction.status !== 'cancelled' && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                    {auction.status === 'scheduled' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmDialog({
                                                    isOpen: true,
                                                    action: 'open',
                                                    data: auction.id
                                                });
                                            }}
                                            className="btn btn-sm btn-success"
                                            style={{ flex: 1 }}
                                        >
                                            <FiPlay size={14} /> Open Auction
                                        </button>
                                    )}
                                    {auction.status === 'open' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmDialog({
                                                    isOpen: true,
                                                    action: 'close',
                                                    data: auction.id
                                                });
                                            }}
                                            className="btn btn-sm btn-primary"
                                            style={{ flex: 1 }}
                                        >
                                            <FiCheck size={14} /> Close Auction
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Auction Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Schedule New Auction"
                size="md"
                footer={
                    <>
                        <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleCreateAuction} disabled={saving} className="btn btn-primary">
                            {saving ? <div className="spinner spinner-sm" /> : 'Schedule'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleCreateAuction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="input-group">
                        <label>Select Chit & Month *</label>
                        <select
                            value={formData.chit_month_id}
                            onChange={(e) => setFormData({ ...formData, chit_month_id: e.target.value })}
                            className="input"
                            required
                        >
                            <option value="">-- Select Month --</option>
                            {chits.map(chit => 
                                Array.from({ length: chit.total_months }, (_, i) => i + 1).map(month => (
                                    <option key={`${chit.id}-${month}`} value={`${chit.id}_${month}`}>
                                        {chit.chit_name} - Month {month}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Auction Date & Time *</label>
                        <input
                            type="datetime-local"
                            value={formData.auction_date}
                            onChange={(e) => setFormData({ ...formData, auction_date: e.target.value })}
                            className="input"
                            required
                        />
                    </div>
                </form>
            </Modal>

            {/* Bid Modal */}
            {auctionDetails && (
                <Modal
                    isOpen={showBidModal}
                    onClose={() => setShowBidModal(false)}
                    title={`Auction: ${auctionDetails.chit_name} - Month ${auctionDetails.month_number}`}
                    size="lg"
                >
                    {/* Auction Info */}
                    <div style={{
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        background: 'var(--surface-light)',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</p>
                                <div style={{ marginTop: '0.25rem' }}>{getStatusBadge(auctionDetails.status)}</div>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Amount</p>
                                <p style={{ fontWeight: 700, marginTop: '0.25rem' }}>{formatCurrency(auctionDetails.total_amount)}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Members</p>
                                <p style={{ fontWeight: 700, marginTop: '0.25rem' }}>{auctionDetails.total_members}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bids List */}
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                        Bidding History ({auctionDetails.bids.length} bids)
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                        {auctionDetails.bids.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No bids yet</p>
                        ) : (
                            auctionDetails.bids.map((bid, idx) => (
                                <div
                                    key={bid.id}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '0.75rem',
                                        background: bid.status === 'accepted' ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-light)',
                                        border: bid.status === 'accepted' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            background: bid.status === 'accepted' ? 'var(--success)' : 'var(--primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            fontWeight: 700
                                        }}>
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>{bid.user_name}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {formatDateTime(bid.bid_time)}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: 700, fontSize: '1.125rem', color: bid.status === 'accepted' ? 'var(--success)' : 'var(--text)' }}>
                                            {formatCurrency(bid.bid_amount)}
                                        </p>
                                        {bid.status === 'accepted' && (
                                            <span className="badge badge-success" style={{ fontSize: '0.625rem' }}>
                                                <FiAward size={8} /> WINNER
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Place Bid Form - Only if auction is open */}
                    {isAdmin() && auctionDetails.status === 'open' && (
                        <form onSubmit={handlePlaceBid} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Place New Bid</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label>Member *</label>
                                    <select
                                        value={bidData.user_id}
                                        onChange={(e) => setBidData({ ...bidData, user_id: e.target.value })}
                                        className="input"
                                        required
                                    >
                                        <option value="">-- Select Member --</option>
                                        {chitMembers.map(member => (
                                            <option key={member.user_id} value={member.user_id}>
                                                {member.user_name} ({member.user_phone})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Bid Amount (₹) *</label>
                                    <input
                                        type="number"
                                        value={bidData.bid_amount}
                                        onChange={(e) => setBidData({ ...bidData, bid_amount: e.target.value })}
                                        className="input"
                                        placeholder="Enter bid amount"
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={saving} className="btn btn-primary">
                                {saving ? <div className="spinner spinner-sm" /> : <><FiDollarSign /> Place Bid</>}
                            </button>
                        </form>
                    )}
                </Modal>
            )}

            {/* Confirm Dialogs */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen && confirmDialog.action === 'open'}
                onClose={() => setConfirmDialog({ isOpen: false, action: null, data: null })}
                onConfirm={handleOpenAuction}
                title="Open Auction for Bidding"
                message="Are you sure you want to open this auction? Members will be able to place bids."
                confirmText="Open Auction"
                variant="info"
                loading={saving}
            />

            <ConfirmDialog
                isOpen={confirmDialog.isOpen && confirmDialog.action === 'close'}
                onClose={() => setConfirmDialog({ isOpen: false, action: null, data: null })}
                onConfirm={handleCloseAuction}
                title="Close Auction"
                message="Are you sure you want to close this auction? The lowest bid will be declared the winner."
                confirmText="Close & Set Winner"
                variant="warning"
                loading={saving}
            />
            </div>
        </div>
    );
}
