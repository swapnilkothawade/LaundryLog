import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createHousehold, joinHousehold } from '../firebase/services';

export default function JoinHouseholdPage() {
    const { user, refreshProfile } = useAuth();
    const [mode, setMode] = useState(null); // null | 'create' | 'join'
    const [householdName, setHouseholdName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [createdCode, setCreatedCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleCreate(e) {
        e.preventDefault();
        if (!householdName.trim()) return;
        setError('');
        setLoading(true);
        try {
            const result = await createHousehold(householdName.trim(), user.uid);
            setCreatedCode(result.inviteCode);
            await refreshProfile();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleJoin(e) {
        e.preventDefault();
        if (!inviteCode.trim()) return;
        setError('');
        setLoading(true);
        try {
            await joinHousehold(inviteCode.trim(), user.uid);
            await refreshProfile();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (createdCode) {
        return (
            <div className="household-page">
                <div className="app-bg" />
                <div className="household-card">
                    <h1>🎉 Household Created!</h1>
                    <p>Share this invite code with your household members</p>
                    <div className="invite-code-display">
                        <div className="code">{createdCode}</div>
                        <div className="label">Invite Code</div>
                    </div>
                    <button
                        className="btn btn-primary btn-block btn-lg"
                        onClick={() => window.location.reload()}
                    >
                        Get Started →
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="household-page">
            <div className="app-bg" />
            <div className="household-card">
                <h1>Welcome to LaundryLog</h1>
                <p>Set up or join your household to get started</p>

                {error && <div className="error-message">{error}</div>}

                {!mode && (
                    <div className="household-options">
                        <div className="household-option">
                            <h3>🏠 Create a Household</h3>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>
                                Start fresh and invite your family members
                            </p>
                            <button
                                className="btn btn-primary btn-block"
                                onClick={() => setMode('create')}
                            >
                                Create Household
                            </button>
                        </div>
                        <div className="household-option">
                            <h3>🔑 Join a Household</h3>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>
                                Enter an invite code from a family member
                            </p>
                            <button
                                className="btn btn-secondary btn-block"
                                onClick={() => setMode('join')}
                            >
                                Join with Code
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'create' && (
                    <div className="household-option" style={{ marginTop: '16px' }}>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label className="form-label">Household Name</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="e.g. The Kothawade Home"
                                    value={householdName}
                                    onChange={(e) => setHouseholdName(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => setMode(null)}
                                >
                                    ← Back
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                    style={{ flex: 1 }}
                                >
                                    {loading ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {mode === 'join' && (
                    <div className="household-option" style={{ marginTop: '16px' }}>
                        <form onSubmit={handleJoin}>
                            <div className="form-group">
                                <label className="form-label">Invite Code</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="e.g. ABC123"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    required
                                    style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, textAlign: 'center', fontSize: '1.25rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => setMode(null)}
                                >
                                    ← Back
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                    style={{ flex: 1 }}
                                >
                                    {loading ? 'Joining...' : 'Join Household'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
