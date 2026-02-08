import { useState, useEffect } from 'react';
import { FiPrinter, FiX, FiCheck, FiClock, FiAlertCircle } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function PamphletGenerator({ chitId, monthNumber, chitName, onClose }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pamphletData, setPamphletData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/pamphlets/chit/${chitId}/month/${monthNumber}`);
                setPamphletData(response.data);
            } catch (err) {
                console.error('Pamphlet fetch error:', err);
                setError(err.response?.data?.detail || 'Failed to load pamphlet data');
                toast.error('Failed to load pamphlet data');
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [chitId, monthNumber]);

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'paid':
                return { bg: '#dcfce7', color: '#16a34a', border: '#86efac' };
            case 'partial':
                return { bg: '#fef3c7', color: '#d97706', border: '#fcd34d' };
            default:
                return { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' };
        }
    };

    // Modal overlay style
    const overlayStyle = {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    // Loading state
    if (loading) {
        return (
            <div style={overlayStyle}>
                <div style={{ 
                    background: 'var(--surface)', 
                    borderRadius: '1rem', 
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <div className="spinner"></div>
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading pamphlet...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div style={overlayStyle}>
                <div style={{ 
                    background: 'var(--surface)', 
                    borderRadius: '1rem', 
                    padding: '2rem',
                    textAlign: 'center',
                    maxWidth: '400px'
                }}>
                    <FiAlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>Failed to Load</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{error}</p>
                    <button 
                        onClick={onClose}
                        className="btn btn-primary"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    // No data state
    if (!pamphletData) {
        return (
            <div style={overlayStyle}>
                <div style={{ 
                    background: 'var(--surface)', 
                    borderRadius: '1rem', 
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <p>No data available</p>
                    <button onClick={onClose} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Overlay */}
            <div 
                style={{...overlayStyle, display: 'block'}} 
                onClick={onClose} 
                className="print:hidden"
            />

            {/* Pamphlet Modal */}
            <div style={{
                position: 'fixed',
                top: '2rem',
                left: '2rem',
                right: '2rem',
                bottom: '2rem',
                background: '#ffffff',
                borderRadius: '1rem',
                zIndex: 1001,
                overflow: 'auto',
                color: '#1e293b'
            }} className="print:static print:inset-0 print:rounded-none">
                
                {/* Header */}
                <div style={{
                    position: 'sticky',
                    top: 0,
                    background: '#ffffff',
                    borderBottom: '1px solid #e2e8f0',
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }} className="print:hidden">
                    <h2 style={{ fontWeight: 700, fontSize: '1.25rem' }}>Monthly Payment Pamphlet</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={handlePrint}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            <FiPrinter size={18} />
                            Print
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '0.5rem',
                                background: '#f1f5f9',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            <FiX size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                    {/* Title */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6366f1' }}>
                            {pamphletData.chit?.name || chitName}
                        </h1>
                        <p style={{ color: '#64748b' }}>
                            Monthly Payment Report - Month {pamphletData.month?.month_number || monthNumber}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            Generated on {new Date().toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </div>

                    {/* Summary Cards */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(4, 1fr)', 
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ background: '#eef2ff', padding: '1rem', borderRadius: '0.75rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 500 }}>Chit Amount</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#4338ca' }}>
                                {formatCurrency(pamphletData.chit?.total_amount)}
                            </p>
                        </div>
                        <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '0.75rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500 }}>Collected</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#047857' }}>
                                {formatCurrency(pamphletData.summary?.total_collected)}
                            </p>
                        </div>
                        <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '0.75rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 500 }}>Pending</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#b45309' }}>
                                {formatCurrency(pamphletData.summary?.total_pending)}
                            </p>
                        </div>
                        <div style={{ background: '#f5f3ff', padding: '1rem', borderRadius: '0.75rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 500 }}>Collection %</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#6d28d9' }}>
                                {pamphletData.summary?.collection_percentage || 0}%
                            </p>
                        </div>
                    </div>

                    {/* Winner Info */}
                    {pamphletData.month?.winner_name && (
                        <div style={{
                            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                            border: '1px solid #fcd34d',
                            borderRadius: '0.75rem',
                            padding: '1rem',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#92400e' }}>🏆 Auction Winner</p>
                                <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#78350f' }}>{pamphletData.month.winner_name}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.875rem', color: '#92400e' }}>Payout Amount</p>
                                <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#78350f' }}>
                                    {formatCurrency(pamphletData.month.payout_amount)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Members Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Slot</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Member</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Phone</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Due</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Paid</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pamphletData.members?.map((member, index) => {
                                const statusStyle = getStatusStyle(member.status);
                                return (
                                    <tr key={member.user_id} style={{ background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: 500 }}>{member.slot_number}</td>
                                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{member.user_name}</td>
                                        <td style={{ padding: '0.75rem', color: '#64748b' }}>{member.user_phone}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(member.due_amount)}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(member.paid_amount)}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                background: statusStyle.bg,
                                                color: statusStyle.color,
                                                border: `1px solid ${statusStyle.border}`
                                            }}>
                                                {member.status === 'paid' && <FiCheck size={12} />}
                                                {member.status === 'partial' && <FiAlertCircle size={12} />}
                                                {member.status === 'pending' && <FiClock size={12} />}
                                                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                                <td colSpan={3} style={{ padding: '0.75rem' }}>
                                    TOTAL ({pamphletData.members?.length || 0} members)
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(pamphletData.summary?.total_due)}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#059669' }}>{formatCurrency(pamphletData.summary?.total_collected)}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#6366f1' }}>{pamphletData.summary?.collection_percentage || 0}%</td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* Footer */}
                    <div style={{ 
                        marginTop: '2rem', 
                        paddingTop: '1rem', 
                        borderTop: '1px solid #e2e8f0',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        color: '#94a3b8'
                    }}>
                        <p>ChitFunds Management System • Generated by {pamphletData.generated_by || 'Admin'}</p>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print\\:hidden { display: none !important; }
                    .print\\:static { position: static !important; inset: 0 !important; }
                    .print\\:static, .print\\:static * { visibility: visible; }
                    @page { size: A4; margin: 1cm; }
                }
            `}</style>
        </>
    );
}

