import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const { login, signup } = useAuth();
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isSignup) {
                if (!displayName.trim()) throw new Error('Please enter your name');
                await signup(email, password, displayName.trim());
            } else {
                await login(email, password);
            }
        } catch (err) {
            setError(
                err.code === 'auth/user-not-found'
                    ? 'No account found with this email'
                    : err.code === 'auth/wrong-password'
                        ? 'Incorrect password'
                        : err.code === 'auth/email-already-in-use'
                            ? 'Email already registered'
                            : err.code === 'auth/weak-password'
                                ? 'Password should be at least 6 characters'
                                : err.message || 'Something went wrong'
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="app-bg" />
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="logo-icon">🧺</div>
                    <h1>LaundryLog</h1>
                    <p>Household laundry, simplified</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {isSignup && (
                        <div className="form-group">
                            <label className="form-label">Your Name</label>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="e.g. Swapnil"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                autoComplete="name"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            className="form-input"
                            type="email"
                            placeholder="you@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete={isSignup ? 'new-password' : 'current-password'}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block btn-lg"
                        disabled={loading}
                    >
                        {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Log In'}
                    </button>
                </form>

                <div className="auth-switch">
                    {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button onClick={() => { setIsSignup(!isSignup); setError(''); }}>
                        {isSignup ? 'Log In' : 'Sign Up'}
                    </button>
                </div>
            </div>
        </div>
    );
}
