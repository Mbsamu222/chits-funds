import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiHome, FiUsers, FiGrid, FiDollarSign,
    FiPieChart, FiLogOut, FiX, FiChevronLeft, FiChevronRight, FiUserCheck, FiBook
} from 'react-icons/fi';

export default function Sidebar({ collapsed, onToggle, isOpen, onClose }) {
    const { user, logout, isAdmin } = useAuth();

    const menuItems = [
        { icon: FiHome, label: 'Dashboard', path: '/' },
        { icon: FiUsers, label: 'Users', path: '/users' },
        { icon: FiUserCheck, label: 'Staff', path: '/staff', adminOnly: true },
        { icon: FiGrid, label: 'Chits', path: '/chits' },
        { icon: FiDollarSign, label: 'Payments', path: '/payments' },
        { icon: FiBook, label: 'Accounts', path: '/accounts', adminOnly: true },
        { icon: FiPieChart, label: 'Reports', path: '/reports', adminOnly: true }
    ];

    const visibleItems = menuItems.filter(item => !item.adminOnly || isAdmin());

    const handleLogout = () => {
        logout();
        onClose?.();
    };

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${isOpen ? 'drawer-open' : ''}`}>
            {/* Sidebar Header */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <span>C</span>
                    </div>
                    {!collapsed && (
                        <h1 className="sidebar-logo-text">
                            <span className="gradient-text">Chit</span>
                            <span>Funds</span>
                        </h1>
                    )}
                </div>



                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="sidebar-close-mobile"
                    aria-label="Close menu"
                >
                    <FiX size={20} />
                </button>
            </div>

            {/* User Info */}
            <div className="sidebar-user">
                <div className="sidebar-user-avatar">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                {!collapsed && (
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{user?.name}</span>
                        <span className="sidebar-user-role">{user?.role}</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {visibleItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        end={item.path === '/'}
                        title={collapsed ? item.label : undefined}
                    >
                        <item.icon className="nav-icon" />
                        {!collapsed && <span className="nav-label">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Footer / Logout */}
            <div className="sidebar-footer">
                <button
                    onClick={handleLogout}
                    className="nav-item nav-item-danger"
                    title={collapsed ? 'Logout' : undefined}
                >
                    <FiLogOut className="nav-icon" />
                    {!collapsed && <span className="nav-label">Logout</span>}
                </button>

                {/* Desktop Toggle Button */}
                <div style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', marginTop: 'var(--space-4)' }}>
                    <button
                        onClick={onToggle}
                        className="sidebar-toggle-desktop"
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
                    </button>
                </div>
            </div>
        </aside>
    );
}
