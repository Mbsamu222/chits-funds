import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
<<<<<<< HEAD
    FiHome, FiUsers, FiGrid, FiDollarSign,
    FiPieChart, FiAward
=======
    FiHome, FiUsers, FiGrid,
    FiPieChart
>>>>>>> 02bde006476464e20ac8c8541abfe3de23c883c3
} from 'react-icons/fi';
import { LuIndianRupee } from "react-icons/lu";

export default function BottomNav() {
    const { isAdmin } = useAuth();

    const menuItems = [
        { icon: FiHome, label: 'Home', path: '/' },
        { icon: FiGrid, label: 'Chits', path: '/chits' },
<<<<<<< HEAD
        { icon: FiAward, label: 'Auctions', path: '/auctions' },
        { icon: FiDollarSign, label: 'Pay', path: '/payments' },
        { icon: FiPieChart, label: 'More', path: '/reports', adminOnly: true }
=======
        { icon: LuIndianRupee, label: 'Payments', path: '/payments' },
        { icon: FiPieChart, label: 'Reports', path: '/reports', adminOnly: true }
>>>>>>> 02bde006476464e20ac8c8541abfe3de23c883c3
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
