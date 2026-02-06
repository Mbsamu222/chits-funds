import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiHome, FiUsers, FiGrid,
    FiPieChart
} from 'react-icons/fi';
import { LuIndianRupee } from "react-icons/lu";

export default function BottomNav() {
    const { isAdmin } = useAuth();

    const menuItems = [
        { icon: FiHome, label: 'Home', path: '/' },
        { icon: FiUsers, label: 'Users', path: '/users' },
        { icon: FiGrid, label: 'Chits', path: '/chits' },
        { icon: LuIndianRupee, label: 'Payments', path: '/payments' },
        { icon: FiPieChart, label: 'Reports', path: '/reports', adminOnly: true }
    ];

    const visibleItems = menuItems.filter(item => !item.adminOnly || isAdmin());

    return (
        <nav className="bottom-nav">
            {visibleItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
                        bottom-nav-item ${isActive ? 'active' : ''}
                    `}
                    end={item.path === '/'}
                >
                    <item.icon className="bottom-nav-icon" />
                    <span className="bottom-nav-label">{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
}
