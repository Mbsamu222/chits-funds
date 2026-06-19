import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { createPortal } from 'react-dom';
import { useTheme } from '../context/ThemeContext';

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
    const modalRef = useRef(null);
    const { isDark } = useTheme();

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Size widths for modal
    const sizeWidths = {
        sm: '360px',
        md: '480px',
        lg: '560px',
        xl: '640px',
        full: '900px'
    };

    const maxWidth = sizeWidths[size] || sizeWidths.md;

    // Theme-aware colors
    const colors = isDark ? {
        overlayBg: 'rgba(10, 14, 26, 0.92)',
        modalBg: '#1e293b',
        modalBorder: 'rgba(255, 255, 255, 0.1)',
        modalShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.05)',
        headerBg: 'rgba(0, 0, 0, 0.2)',
        headerBorder: 'rgba(255, 255, 255, 0.08)',
        titleColor: '#f8fafc',
        closeBtnColor: '#94a3b8',
        closeBtnHoverBg: 'rgba(255, 255, 255, 0.1)',
        closeBtnHoverColor: '#f8fafc',
        footerBg: 'rgba(0, 0, 0, 0.2)',
        footerBorder: 'rgba(255, 255, 255, 0.08)',
    } : {
        overlayBg: 'rgba(15, 23, 42, 0.5)',
        modalBg: '#ffffff',
        modalBorder: '#e2e8f0',
        modalShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0,0,0,0.05)',
        headerBg: '#f8fafc',
        headerBorder: '#e2e8f0',
        titleColor: '#0f172a',
        closeBtnColor: '#64748b',
        closeBtnHoverBg: '#f1f5f9',
        closeBtnHoverColor: '#0f172a',
        footerBg: '#f8fafc',
        footerBorder: '#e2e8f0',
    };

    const modalContent = (
        <div
            className="modal-overlay-portal"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: colors.overlayBg,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                boxSizing: 'border-box',
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={onClose}
        >
            <div
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: colors.modalBg,
                    border: `1px solid ${colors.modalBorder}`,
                    boxShadow: colors.modalShadow,
                    width: '100%',
                    maxWidth: maxWidth,
                    maxHeight: 'calc(100vh - 2rem)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '1.25rem',
                    zIndex: 10000,
                    boxSizing: 'border-box',
                    animation: 'modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.125rem 1.5rem',
                        borderBottom: `1px solid ${colors.headerBorder}`,
                        background: colors.headerBg,
                        flexShrink: 0
                    }}
                >
                    <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        margin: 0,
                        color: colors.titleColor,
                        letterSpacing: '-0.01em'
                    }}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '2.25rem',
                            height: '2.25rem',
                            borderRadius: '0.625rem',
                            border: 'none',
                            background: 'transparent',
                            color: colors.closeBtnColor,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = colors.closeBtnHoverBg;
                            e.currentTarget.style.color = colors.closeBtnHoverColor;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = colors.closeBtnColor;
                        }}
                        aria-label="Close modal"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Body */}
                <div
                    style={{
                        padding: '1.5rem',
                        overflowY: 'auto',
                        flex: 1
                    }}
                >
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '0.75rem',
                            padding: '1rem 1.5rem',
                            borderTop: `1px solid ${colors.footerBorder}`,
                            background: colors.footerBg,
                            flexShrink: 0
                        }}
                    >
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    // Use createPortal to render the modal at the document body level
    return createPortal(modalContent, document.body);
}
