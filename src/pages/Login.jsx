import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiPhone, FiLock, FiArrowRight, FiEye, FiEyeOff, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Login() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!phone || !password) {
            toast.error('Please enter phone and password');
            return;
        }

        setLoading(true);
        try {
            await login(phone, password);
            toast.success('Login successful!');
            navigate('/');
        } catch (error) {
            const message = error.response?.data?.detail || 'Login failed';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--background)'
            }}
        >
            {/* Animated Background Orbs */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div
                    className="animate-float"
                    style={{
                        position: 'absolute',
                        width: '600px',
                        height: '600px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
                        top: '-20%',
                        right: '-10%',
                        animationDuration: '8s'
                    }}
                />
                <div
                    className="animate-float"
                    style={{
                        position: 'absolute',
                        width: '500px',
                        height: '500px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)',
                        top: '30%',
                        left: '-15%',
                        animationDuration: '10s',
                        animationDelay: '2s'
                    }}
                />
                <div
                    className="animate-float"
                    style={{
                        position: 'absolute',
                        width: '400px',
                        height: '400px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 70%)',
                        bottom: '-10%',
                        right: '20%',
                        animationDuration: '12s',
                        animationDelay: '4s'
                    }}
                />
            </div>

            {/* Login Content */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '420px', zIndex: 10 }}>
                {/* Logo Area */}
                <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div
                        className="animate-glow"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '80px',
                            height: '80px',
                            borderRadius: '1.5rem',
                            marginBottom: '1.5rem',
                            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                            boxShadow: '0 8px 32px var(--primary-glow)'
                        }}
                    >
                        <FiDollarSign size={40} color="white" />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
                        <span className="gradient-text">Chit</span>
                        <span style={{ color: 'var(--text)' }}>Funds</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                        Secure Management System
                    </p>
                </div>

                {/* Login Card */}
                <div className="card glass animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="card-body" style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '1.5rem' }}>
                            Welcome Back
                        </h2>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Phone */}
                            <div className="input-group">
                                <label>Phone Number</label>
                                <div style={{ position: 'relative' }}>
                                    <FiPhone
                                        style={{
                                            position: 'absolute',
                                            left: '1rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'var(--text-muted)'
                                        }}
                                    />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Enter phone number"
                                        className="input"
                                        style={{ paddingLeft: '3rem' }}
                                        autoComplete="tel"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="input-group">
                                <label>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <FiLock
                                        style={{
                                            position: 'absolute',
                                            left: '1rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'var(--text-muted)'
                                        }}
                                    />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter password"
                                        className="input"
                                        style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '1rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'var(--text-muted)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 0,
                                            display: 'flex'
                                        }}
                                    >
                                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%' }}
                            >
                                {loading ? (
                                    <div className="spinner spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                                ) : (
                                    <>
                                        Sign In
                                        <FiArrowRight />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Demo Credentials */}
                        <div
                            style={{
                                marginTop: '1.5rem',
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                background: 'rgba(0, 0, 0, 0.2)'
                            }}
                        >
                            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.75rem' }}>
                                Demo Credentials
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-dim)' }}>Phone:</span>
                                    <code style={{ color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                        9999999999
                                    </code>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-dim)' }}>Password:</span>
                                    <code style={{ color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                        admin123
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p
                    className="animate-fade-in"
                    style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '1.5rem', animationDelay: '300ms' }}
                >
                    Secure • Reliable • Trusted
                </p>
            </div>
        </div>
    );
}
