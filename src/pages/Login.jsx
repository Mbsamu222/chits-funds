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
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[var(--background)] via-[#0f172a] to-[#020617] relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[700px] h-[700px] bg-[var(--primary)] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse"></div>
                <div className="absolute top-[30%] -left-[10%] w-[600px] h-[600px] bg-[var(--secondary)] rounded-full mix-blend-multiply filter blur-[100px] opacity-15 animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute -bottom-[20%] right-[20%] w-[500px] h-[500px] bg-[var(--accent)] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
            </div>

            <div className="relative w-full max-w-md z-10">
                {/* Logo Area */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] mb-6 shadow-2xl shadow-[var(--primary)]/30">
                        <FiLogIn className="text-3xl text-white" />
                    </div>
                    <h1 className="text-5xl font-extrabold tracking-tight mb-3">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400">Chit</span>
                        <span className="text-[var(--primary)]">Funds</span>
                    </h1>
                    <p className="text-[var(--text-muted)] text-lg">Secure Management System</p>
                </div>

                {/* Login Card */}
                <div className="card glass shadow-2xl animate-slide-in">
                    <div className="card-body p-8">
                        <h2 className="text-2xl font-bold text-center mb-8">Sign In</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Phone */}
                            <div className="input-group">
                                <label className="text-sm font-medium ml-1">Phone Number</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FiPhone className="text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="99999 99999"
                                        className="input pl-11 py-3 text-lg bg-black/20 focus:bg-black/30 border-white/10"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="input-group">
                                <label className="text-sm font-medium ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FiLock className="text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="input pl-11 py-3 text-lg bg-black/20 focus:bg-black/30 border-white/10"
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full py-4 text-lg shadow-xl shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40 transition-all active:scale-[0.98]"
                            >
                                {loading ? (
                                    <div className="spinner w-6 h-6 border-white/30 border-t-white"></div>
                                ) : (
                                    <>
                                        Sign In <FiArrowRight />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Demo Credentials */}
                        <div className="mt-8 p-5 rounded-xl bg-black/30 border border-white/5 text-sm backdrop-blur-sm">
                            <p className="text-[var(--text-muted)] mb-3 font-medium uppercase tracking-wider text-xs">Demo Access</p>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[var(--text-dim)]">Phone:</span>
                                <code className="text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-1 rounded">9999999999</code>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[var(--text-dim)]">Password:</span>
                                <code className="text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-1 rounded">admin123</code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
