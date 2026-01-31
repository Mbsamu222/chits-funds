import { FiCheck, FiX, FiClock } from 'react-icons/fi';

export default function PaymentStatusGrid({ months, onMonthClick }) {
    return (
        <div className="payment-grid">
            {months.map((month) => (
                <div
                    key={month.month}
                    onClick={() => onMonthClick?.(month)}
                    className={`payment-cell ${month.is_paid ? 'paid' : 'pending'}`}
                    title={`Month ${month.month}: ${month.is_paid ? 'Paid' : 'Pending'} - ₹${month.paid.toLocaleString()}`}
                >
                    {month.month}
                </div>
            ))}
        </div>
    );
}

export function PaymentStatusBadge({ isPaid }) {
    return isPaid ? (
        <span className="badge badge-success">
            <FiCheck className="mr-1" /> Paid
        </span>
    ) : (
        <span className="badge badge-warning">
            <FiClock className="mr-1" /> Pending
        </span>
    );
}
