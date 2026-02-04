import { FiCheck, FiClock } from 'react-icons/fi';

export default function PaymentStatusGrid({ months, onMonthClick }) {
    if (!months || months.length === 0) {
        return (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">
                No payment data available
            </p>
        );
    }

    return (
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {months.map((month, index) => (
                <div
                    key={month.month}
                    onClick={() => onMonthClick?.(month)}
                    className={`
                        relative aspect-square rounded-lg flex items-center justify-center
                        font-bold text-sm cursor-pointer transition-all duration-200
                        hover:scale-110 hover:z-10 animate-fade-in
                        ${month.is_paid
                            ? 'bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30'
                            : 'bg-[var(--warning)]/20 text-[var(--warning)] border border-[var(--warning)]/30 hover:bg-[var(--warning)]/30'
                        }
                    `}
                    style={{ animationDelay: `${index * 20}ms` }}
                    title={`Month ${month.month}: ${month.is_paid ? 'Paid' : 'Pending'} - ₹${month.paid?.toLocaleString() || 0}`}
                >
                    {month.is_paid ? (
                        <FiCheck size={16} strokeWidth={3} />
                    ) : (
                        <span>{month.month}</span>
                    )}
                </div>
            ))}
        </div>
    );
}

export function PaymentStatusBadge({ isPaid }) {
    return isPaid ? (
        <span className="badge badge-success">
            <FiCheck size={12} className="mr-1" /> Paid
        </span>
    ) : (
        <span className="badge badge-warning">
            <FiClock size={12} className="mr-1" /> Pending
        </span>
    );
}

export function PaymentProgressBar({ paid, total }) {
    const percentage = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">{percentage}% complete</span>
                <span className="font-medium">₹{paid?.toLocaleString() || 0} / ₹{total?.toLocaleString() || 0}</span>
            </div>
            <div className="progress progress-sm">
                <div
                    className="progress-bar"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
