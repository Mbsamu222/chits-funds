import { FiAlertTriangle, FiTrash2, FiRotateCcw, FiX } from 'react-icons/fi';
import { createPortal } from 'react-dom';

/**
 * Confirmation Dialog Component
 * 
 * Types:
 * - danger: Red styling, for destructive actions (delete, deactivate)
 * - warning: Yellow styling, for cautionary actions
 * - info: Blue styling, for informational confirmations
 * - success: Green styling, for restorations
 */
export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    type = 'danger',
    title = 'Confirm Action',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    loading = false,
    icon = null
}) {
    if (!isOpen) return null;

    const typeStyles = {
        danger: {
            iconBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            iconColor: 'white',
            buttonBg: 'var(--danger)',
            buttonHover: '#dc2626',
            Icon: icon || FiTrash2
        },
        warning: {
            iconBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            iconColor: 'white',
            buttonBg: 'var(--warning)',
            buttonHover: '#d97706',
            Icon: icon || FiAlertTriangle
        },
        info: {
            iconBg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            iconColor: 'white',
            buttonBg: 'var(--primary)',
            buttonHover: '#4f46e5',
            Icon: icon || FiAlertTriangle
        },
        success: {
            iconBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            iconColor: 'white',
            buttonBg: 'var(--success)',
            buttonHover: '#059669',
            Icon: icon || FiRotateCcw
        }
    };

    const style = typeStyles[type] || typeStyles.danger;
    const IconComponent = style.Icon;

    const dialogContent = (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(10, 14, 26, 0.95)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                boxSizing: 'border-box'
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                    width: '100%',
                    maxWidth: '400px',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    animation: 'fadeIn 0.2s ease-out'
                }}
            >
                {/* Header with Icon */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '1.5rem 1.5rem 1rem',
                        textAlign: 'center'
                    }}
                >
                    {/* Icon */}
                    <div
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: style.iconBg,
                            marginBottom: '1rem'
                        }}
                    >
                        <IconComponent size={28} color={style.iconColor} />
                    </div>

                    {/* Title */}
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        margin: 0,
                        color: '#f8fafc',
                        marginBottom: '0.5rem'
                    }}>
                        {title}
                    </h3>

                    {/* Message */}
                    <p style={{
                        color: '#94a3b8',
                        fontSize: '0.9375rem',
                        lineHeight: 1.6,
                        margin: 0
                    }}>
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        padding: '1rem 1.5rem 1.5rem',
                        flexDirection: 'column'
                    }}
                >
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            background: style.buttonBg,
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.9375rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading ? (
                            <div className="spinner spinner-sm" />
                        ) : (
                            <>
                                <IconComponent size={18} />
                                {confirmText}
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'transparent',
                            color: '#94a3b8',
                            fontWeight: 500,
                            fontSize: '0.9375rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(dialogContent, document.body);
}
