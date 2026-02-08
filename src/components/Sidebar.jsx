import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import {
<<<<<<< HEAD
    FiHome, FiUsers, FiGrid, FiDollarSign,
    FiPieChart, FiLogOut, FiX, FiChevronLeft, FiChevronRight, FiUserCheck, FiBook, FiSettings, FiAward
=======
    FiHome, FiUsers, FiGrid,
    FiPieChart, FiLogOut, FiX, FiChevronLeft, FiChevronRight, FiUserCheck, FiBook
>>>>>>> 02bde006476464e20ac8c8541abfe3de23c883c3
} from 'react-icons/fi';
import { LuIndianRupee } from "react-icons/lu";

export default function Sidebar({ collapsed, onToggle, isOpen, onClose }) {
    const { user, logout, isAdmin } = useAuth();

    const menuItems = [
        { icon: FiHome, label: 'Dashboard', path: '/' },
        { icon: FiUsers, label: 'Users', path: '/users' },
        { icon: FiUserCheck, label: 'Staff', path: '/staff', adminOnly: true },
        { icon: FiGrid, label: 'Chits', path: '/chits' },
<<<<<<< HEAD
        { icon: FiDollarSign, label: 'Payments', path: '/payments' },
        { icon: FiAward, label: 'Auctions', path: '/auctions' },
=======
        { icon: LuIndianRupee, label: 'Payments', path: '/payments' },
>>>>>>> 02bde006476464e20ac8c8541abfe3de23c883c3
        { icon: FiBook, label: 'Accounts', path: '/accounts', adminOnly: true },
        { icon: FiPieChart, label: 'Reports', path: '/reports', adminOnly: true },
        { icon: FiSettings, label: 'Settings', path: '/settings' }
    ];

    const visibleItems = menuItems.filter(item => !item.adminOnly || isAdmin());

    const handleLogout = () => {
        logout();
        onClose?.();
    };

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${isOpen ? 'drawer-open' : ''}`}>
            {/* Sidebar Header with Toggle */}
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

                {/* Desktop Toggle Button - Now in header */}
                {/* <button
                    onClick={onToggle}
                    className="sidebar-toggle-desktop"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    style={{ marginLeft: collapsed ? '0' : 'auto' }}
                >
                    {collapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
                </button> */}

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
            {/* <div className="sidebar-user">
                <div className="sidebar-user-avatar">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                {!collapsed && (
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{user?.name}</span>
                        <span className="sidebar-user-role">{user?.role}</span>
                    </div>
                )}
            </div> */}

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
            </div>
        </aside>
    );
}

