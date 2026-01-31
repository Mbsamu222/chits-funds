import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiPhone, FiLock, FiLogIn } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Login() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[var(--background)] via-[#1a1a2e] to-[var(--background)]">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--primary)] rounded-full opacity-10 blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[var(--secondary)] rounded-full opacity-10 blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold gradient-text mb-2">ChitFunds</h1>
                    <p className="text-[var(--text-muted)]">Chit Fund Management System</p>
                </div>

                {/* Login Card */}
                <div className="card glass">
                    <div className="card-body">
                        <h2 className="text-2xl font-semibold text-center mb-6">Welcome Back</h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Phone */}
                            <div className="input-group">
                                <label>Phone Number</label>
                                <div className="relative">
                                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Enter your phone"
                                        className="input pl-11"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="input-group">
                                <label>Password</label>
                                <div className="relative">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="input pl-11"
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full"
                            >
                                {loading ? (
                                    <div className="spinner w-5 h-5"></div>
                                ) : (
                                    <>
                                        <FiLogIn /> Sign In
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Demo Credentials */}
                        <div className="mt-6 p-4 rounded-lg bg-[var(--background)] text-sm">
                            <p className="text-[var(--text-muted)] mb-2">Demo Credentials:</p>
                            <p className="text-[var(--text)]">Phone: <code className="text-[var(--primary)]">9999999999</code></p>
                            <p className="text-[var(--text)]">Password: <code className="text-[var(--primary)]">admin123</code></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
