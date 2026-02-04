import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { FiMenu } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user } = useAuth();

    // Close mobile menu on route change or resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    return (
        <div className="min-h-screen text-[var(--text)]">
            {/* Mobile Header */}
            <header className="mobile-header">
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="hamburger-btn"
                    aria-label="Open menu"
                >
                    <FiMenu size={24} />
                </button>
                <h1 className="mobile-header-title">
                    <span className="gradient-text">Chit</span>
                    <span>Funds</span>
                </h1>
                <div className="avatar avatar-sm avatar-gradient">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
            </header>

            {/* Sidebar Overlay (for tablet/mobile) */}
            {mobileMenuOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Desktop Sidebar */}
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            />

            {/* Mobile Bottom Navigation */}
            <BottomNav />

            {/* Main Content */}
            <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <div className="page-container pt-4 lg:pt-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
