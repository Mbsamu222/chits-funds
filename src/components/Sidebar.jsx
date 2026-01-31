import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiHome, FiUsers, FiUserCheck, FiGrid, FiDollarSign,
    FiPieChart, FiLogOut, FiMenu, FiX, FiChevronLeft
} from 'react-icons/fi';

export default function Sidebar() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { icon: FiHome, label: 'Dashboard', path: '/', show: true },
        { icon: FiUsers, label: 'Users', path: '/users', show: true },
        { icon: FiUserCheck, label: 'Staff', path: '/staff', show: isAdmin() },
        { icon: FiGrid, label: 'Seats', path: '/seats', show: true },
        { icon: FiDollarSign, label: 'Payments', path: '/payments', show: true },
        { icon: FiPieChart, label: 'Reports', path: '/reports', show: isAdmin() }
    ];

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--surface)] text-[var(--text)]"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 z-40 h-screen
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isCollapsed ? 'w-20' : 'w-64'}
        bg-[var(--surface)] border-r border-white/5
        flex flex-col
      `}>
                {/* Logo */}
                <div className="p-4 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        {!isCollapsed && (
                            <h1 className="text-xl font-bold gradient-text">ChitFunds</h1>
                        )}
                        <button
                            className="hidden lg:flex p-2 rounded-lg hover:bg-[var(--surface-light)] text-[var(--text-muted)]"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            <FiChevronLeft className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* User Info */}
                <div className={`p-4 border-b border-white/5 ${isCollapsed ? 'text-center' : ''}`}>
                    <div className={`
            w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]
            flex items-center justify-center text-white font-bold
            ${isCollapsed ? 'mx-auto' : ''}
          `}>
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    {!isCollapsed && (
                        <div className="mt-2">
                            <p className="font-medium text-[var(--text)]">{user?.name}</p>
                            <p className="text-xs text-[var(--text-muted)] capitalize">{user?.role}</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {menuItems.filter(item => item.show).map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200
                ${isActive
                                    ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-lg shadow-[var(--primary)]/30'
                                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-light)] hover:text-[var(--text)]'
                                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
                        >
                            <item.icon size={20} />
                            {!isCollapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              text-[var(--danger)] hover:bg-[var(--danger)]/10
              transition-all duration-200
              ${isCollapsed ? 'justify-center' : ''}
            `}
                    >
                        <FiLogOut size={20} />
                        {!isCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
