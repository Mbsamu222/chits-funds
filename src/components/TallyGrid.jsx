/**
 * TallyGrid Component
 * 
 * Displays a visual month-wise payment tally for a user's chit.
 * Shows payment status with colored indicators:
 * - 🔴 Pending (unpaid)
 * - 🟢 Paid (fully paid)
 * - 🔵 Advance (overpaid)
 * - 🟡 Partial (partially paid)
 * - ⚪ Not Started (no dues generated)
 */
import { FiCheck, FiX, FiMinus, FiArrowUp } from 'react-icons/fi';

export default function TallyGrid({ months, monthlyAmount, onMonthClick }) {
    const formatCurrency = (amount) => {
        if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
        }
        return `₹${amount}`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
                return { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.5)', text: 'var(--success)' };
            case 'partial':
                return { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.5)', text: 'var(--warning)' };
            case 'pending':
                return { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.5)', text: 'var(--danger)' };
            case 'advance':
                return { bg: 'rgba(99, 102, 241, 0.2)', border: 'rgba(99, 102, 241, 0.5)', text: 'var(--primary)' };
            case 'not_started':
            default:
                return { bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.1)', text: 'var(--text-muted)' };
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid':
                return <FiCheck size={14} />;
            case 'partial':
                return <FiMinus size={14} />;
            case 'pending':
                return <FiX size={14} />;
            case 'advance':
                return <FiArrowUp size={14} />;
            default:
                return null;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'paid':
                return 'Paid';
            case 'partial':
                return 'Partial';
            case 'pending':
                return 'Pending';
            case 'advance':
                return 'Advance';
            case 'not_started':
                return 'Not Due';
            default:
                return '-';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Legend */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                fontSize: '0.75rem',
                marginBottom: '0.5rem'
            }}>
                {['paid', 'partial', 'pending', 'advance', 'not_started'].map(status => {
                    const colors = getStatusColor(status);
                    return (
                        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '3px',
                                background: colors.bg,
                                border: `1px solid ${colors.border}`
                            }} />
                            <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                {getStatusLabel(status)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                gap: '0.5rem'
            }}>
                {months.map((month) => {
                    const colors = getStatusColor(month.status);
                    const isClickable = month.status === 'pending' || month.status === 'partial';

                    return (
                        <div
                            key={month.month_number}
                            onClick={() => isClickable && onMonthClick?.(month)}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '0.5rem',
                                background: colors.bg,
                                border: `1px solid ${colors.border}`,
                                cursor: isClickable ? 'pointer' : 'default',
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.25rem',
                                minHeight: '60px'
                            }}
                            title={`Month ${month.month_number}: ${getStatusLabel(month.status)}`}
                        >
                            {/* Month Number */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                color: colors.text,
                                fontWeight: 700,
                                fontSize: '0.75rem'
                            }}>
                                <span>M{month.month_number}</span>
                                {getStatusIcon(month.status)}
                            </div>

                            {/* Amount Info */}
                            {month.status !== 'not_started' && (
                                <div style={{
                                    fontSize: '0.625rem',
                                    color: 'var(--text-muted)',
                                    textAlign: 'center'
                                }}>
                                    {month.status === 'paid' && (
                                        <span style={{ color: 'var(--success)' }}>
                                            {formatCurrency(month.paid)}
                                        </span>
                                    )}
                                    {month.status === 'partial' && (
                                        <span style={{ color: 'var(--warning)' }}>
                                            {formatCurrency(month.paid)}/{formatCurrency(month.due)}
                                        </span>
                                    )}
                                    {month.status === 'pending' && (
                                        <span style={{ color: 'var(--danger)' }}>
                                            {formatCurrency(month.pending)} due
                                        </span>
                                    )}
                                    {month.status === 'advance' && (
                                        <span style={{ color: 'var(--primary)' }}>
                                            +{formatCurrency(month.paid - month.due)}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary Row */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: 'rgba(0, 0, 0, 0.2)',
                marginTop: '0.5rem',
                fontSize: '0.875rem'
            }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                        Paid: <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                            {months.filter(m => m.status === 'paid').length}
                        </span>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                        Partial: <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                            {months.filter(m => m.status === 'partial').length}
                        </span>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                        Pending: <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                            {months.filter(m => m.status === 'pending').length}
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
}
