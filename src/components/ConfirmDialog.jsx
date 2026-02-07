import Modal from './Modal';
import { FiAlertTriangle } from 'react-icons/fi';

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger", // "danger", "warning", "info"
    loading = false
}) {
    const handleConfirm = () => {
        onConfirm();
        if (!loading) {
            onClose();
        }
    };

    const getIconColor = () => {
        switch (variant) {
            case 'danger': return 'var(--danger)';
            case 'warning': return 'var(--warning)';
            case 'info': return 'var(--primary)';
            default: return 'var(--danger)';
        }
    };

    const getButtonClass = () => {
        switch (variant) {
            case 'danger': return 'btn-danger';
            case 'warning': return 'btn-warning';
            case 'info': return 'btn-primary';
            default: return 'btn-danger';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <button 
                        onClick={onClose} 
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        className={`btn ${getButtonClass()}`}
                        disabled={loading}
                    >
                        {loading ? <div className="spinner spinner-sm" /> : confirmText}
                    </button>
                </>
            }
        >
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center',
                padding: '1rem 0'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: `${getIconColor()}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                }}>
                    <FiAlertTriangle 
                        size={32} 
                        style={{ color: getIconColor() }}
                    />
                </div>
                <p style={{ 
                    fontSize: '1rem', 
                    color: 'var(--text)', 
                    lineHeight: 1.6 
                }}>
                    {message}
                </p>
            </div>
        </Modal>
    );
}
