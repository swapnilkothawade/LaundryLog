import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
    const { userProfile } = useAuth();
    const location = useLocation();

    // Don't show nav on auth or household setup pages
    if (!userProfile?.householdId) return null;

    const navItems = [
        { to: '/', icon: '🏠', label: 'Home', end: true },
        { to: '/history', icon: '📋', label: 'History' },
        { to: '/new-entry', icon: '➕', label: 'Add' },
        { to: '/settings', icon: '⚙️', label: 'Settings' },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
}
