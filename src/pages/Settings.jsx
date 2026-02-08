import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    FiMoon, FiSun, FiUser, FiInfo,
    FiMonitor, FiCheck
} from 'react-icons/fi';

export default function Settings() {
    const { user } = useAuth();
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });

    useEffect(() => {
        document.documentElement.classList.remove('theme-light', 'theme-dark');
        document.documentElement.classList.add(`theme-${theme}`);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const themes = [
        { id: 'dark', label: 'Dark', icon: FiMoon, desc: 'Easy on the eyes' },
        { id: 'light', label: 'Light', icon: FiSun, desc: 'Classic bright mode' },
    ];

    const cardStyle = {
        background: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.5rem',
        border: '1px solid var(--surface-light)'
    };

    const sectionHeaderStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1.5rem'
    };

    const iconBoxStyle = (gradient) => ({
        width: '2.5rem',
        height: '2.5rem',
        borderRadius: '0.75rem',
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
    });

    const infoBoxStyle = {
        padding: '1rem',
        borderRadius: '0.75rem',
        background: 'var(--surface-light)'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div>
                <h1 className="gradient-text" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                    Settings
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Customize your application preferences
                </p>
            </div>

            {/* Theme Selection */}
            <div style={cardStyle}>
                <div style={sectionHeaderStyle}>
                    <div style={iconBoxStyle('linear-gradient(135deg, #6366f1, #8b5cf6)')}>
                        <FiMonitor size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Appearance</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Choose your preferred theme</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    {themes.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            style={{
                                position: 'relative',
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                border: theme === t.id ? '2px solid var(--primary)' : '2px solid var(--surface-light)',
                                background: theme === t.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--surface-light)',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                        >
                            <div style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: theme === t.id ? 'var(--primary)' : 'var(--surface)',
                                color: theme === t.id ? 'white' : 'var(--text-muted)'
                            }}>
                                <t.icon size={20} />
                            </div>
                            <div>
                                <p style={{ fontWeight: 600, color: 'var(--text)' }}>{t.label}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.desc}</p>
                            </div>
                            {theme === t.id && (
                                <div style={{
                                    position: 'absolute',
                                    top: '0.75rem',
                                    right: '0.75rem',
                                    width: '1.5rem',
                                    height: '1.5rem',
                                    borderRadius: '50%',
                                    background: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <FiCheck style={{ color: 'white' }} size={14} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* User Profile */}
            <div style={cardStyle}>
                <div style={sectionHeaderStyle}>
                    <div style={iconBoxStyle('linear-gradient(135deg, #ec4899, #f43f5e)')}>
                        <FiUser size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Profile</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Your account details</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div style={infoBoxStyle}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Name</p>
                        <p style={{ fontWeight: 600 }}>{user?.name || 'N/A'}</p>
                    </div>
                    <div style={infoBoxStyle}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Role</p>
                        <p style={{ fontWeight: 600, textTransform: 'capitalize' }}>{user?.role || 'N/A'}</p>
                    </div>
                    <div style={infoBoxStyle}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Phone</p>
                        <p style={{ fontWeight: 600 }}>{user?.phone || 'N/A'}</p>
                    </div>
                    <div style={infoBoxStyle}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Email</p>
                        <p style={{ fontWeight: 600 }}>{user?.email || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* App Info */}
            <div style={cardStyle}>
                <div style={sectionHeaderStyle}>
                    <div style={iconBoxStyle('linear-gradient(135deg, #14b8a6, #06b6d4)')}>
                        <FiInfo size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Application</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>System information</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div style={infoBoxStyle}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>App Name</p>
                        <p style={{ fontWeight: 600 }}>ChitFunds</p>
                    </div>
                    <div style={infoBoxStyle}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Version</p>
                        <p style={{ fontWeight: 600 }}>1.0.0</p>
                    </div>
                    <div style={infoBoxStyle}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Framework</p>
                        <p style={{ fontWeight: 600 }}>React + Vite</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

