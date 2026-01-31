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
        { icon: FiGrid, label: 'Chits', path: '/chits', show: true },
        { icon: FiDollarSign, label: 'Payments', path: '/payments', show: true },
        { icon: FiPieChart, label: 'Reports', path: '/reports', show: isAdmin() }
    ];

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl glass text-[var(--text)] active:scale-95 transition-all"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-40 h-screen
                transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
                ${isCollapsed ? 'w-24' : 'w-72'}
                glass border-r border-white/5
                flex flex-col
                shadow-2xl shadow-black/20
            `}>
                {/* Logo */}
                <div className="p-6 border-b border-white/5 bg-white/5">
                    <div className="flex items-center justify-between">
                        {!isCollapsed && (
                            <h1 className="text-2xl font-extrabold tracking-tight gradient-text">
                                Chit<span className="text-[var(--text)]">Funds</span>
                            </h1>
                        )}
                        <button
                            className="hidden lg:flex p-2 rounded-lg hover:bg-[var(--surface-light)] text-[var(--text-muted)] transition-colors"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            <FiChevronLeft className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* User Info */}
                <div className={`p-6 border-b border-white/5 bg-black/10 transition-all duration-300 ${isCollapsed ? 'px-4' : ''}`}>
                    <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className={`
                            w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]
                            flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-[var(--primary)]/20
                            ring-2 ring-white/10
                        `}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>

                        {!isCollapsed && (
                            <div className="overflow-hidden">
                                <p className="font-bold text-[var(--text)] truncate">{user?.name}</p>
                                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">{user?.role}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide my-2">
                    {menuItems.filter(item => item.show).map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) => `
                                flex items-center gap-4 px-4 py-3.5 rounded-xl
                                transition-all duration-300 group relative
                                ${isActive
                                    ? 'bg-gradient-to-r from-[var(--primary)]/90 to-[var(--primary-dark)]/90 text-white shadow-lg shadow-[var(--primary)]/25 ring-1 ring-white/20'
                                    : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text)] active:scale-95'
                                }
                                ${isCollapsed ? 'justify-center' : ''}
                            `}
                        >
                            <item.icon size={22} className={`transition-transform duration-300 ${!isCollapsed && 'group-hover:scale-110'}`} />
                            {!isCollapsed && <span className="font-medium tracking-wide">{item.label}</span>}

                            {/* Collapse Tooltip Hack */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-4 px-3 py-1 bg-[var(--surface)] border border-white/10 rounded-lg text-sm text-[var(--text)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                    {item.label}
                                </div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-white/5 bg-black/10">
                    <button
                        onClick={handleLogout}
                        className={`
                            w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
                            text-[var(--danger)] hover:bg-[var(--danger)]/10 hover:text-red-400
                            transition-all duration-300 border border-transparent hover:border-[var(--danger)]/20
                            ${isCollapsed ? 'justify-center' : ''}
                        `}
                    >
                        <FiLogOut size={22} />
                        {!isCollapsed && <span className="font-semibold">Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
