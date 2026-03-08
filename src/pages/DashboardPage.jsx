import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { onEntriesChange, onClothTypesChange, getHousehold } from '../firebase/services';

export default function DashboardPage() {
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();
    const [entries, setEntries] = useState([]);
    const [household, setHousehold] = useState(null);
    const [clothTypes, setClothTypes] = useState([]);

    const householdId = userProfile?.householdId;

    useEffect(() => {
        if (!householdId) return;

        getHousehold(householdId).then(setHousehold);

        const unsubEntries = onEntriesChange(householdId, setEntries);
        const unsubTypes = onClothTypesChange(householdId, setClothTypes);

        return () => {
            unsubEntries();
            unsubTypes();
        };
    }, [householdId]);

    const unpaidEntries = entries.filter((e) => e.status !== 'paid');
    const netBalance = entries.reduce((sum, e) => sum + (e.totalAmount - (e.paidAmount || 0)), 0);
    const isCredit = netBalance < 0;
    const totalEntries = entries.length;
    const thisMonthEntries = entries.filter((e) => {
        if (!e.pickupDate) return false;
        const d = e.pickupDate.toDate ? e.pickupDate.toDate() : new Date(e.pickupDate);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlySpend = thisMonthEntries.reduce((sum, e) => sum + (e.totalAmount || 0), 0);

    function formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function formatCurrency(amount) {
        return `₹${(amount || 0).toLocaleString('en-IN')}`;
    }

    function getItemsSummary(entry) {
        if (!entry.items || entry.items.length === 0) return 'No items';
        const totalQty = entry.items.reduce((s, i) => s + i.quantity, 0);
        const types = entry.items.length;
        return `${totalQty} item${totalQty !== 1 ? 's' : ''} · ${types} type${types !== 1 ? 's' : ''}`;
    }

    const recentEntries = entries.slice(0, 5);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>
                    {household?.name || 'Your Household'} · Hi, {user?.displayName || 'there'}!
                </p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">{isCredit ? '✅' : '💰'}</div>
                    <div className="stat-value" style={{ color: isCredit ? 'var(--color-success)' : undefined }}>
                        {isCredit ? `+${formatCurrency(Math.abs(netBalance))}` : formatCurrency(netBalance)}
                    </div>
                    <div className="stat-label">{isCredit ? 'Credit' : 'Unpaid Balance'}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-value">{unpaidEntries.length}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-value">{formatCurrency(monthlySpend)}</div>
                    <div className="stat-label">This Month</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">👕</div>
                    <div className="stat-value">{clothTypes.length}</div>
                    <div className="stat-label">Cloth Types</div>
                </div>
            </div>

            <div className="section-header">
                <h2>Recent Entries</h2>
                {entries.length > 5 && (
                    <button className="section-link" onClick={() => navigate('/history')}>
                        View All →
                    </button>
                )}
            </div>

            {recentEntries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🧺</div>
                    <p>No laundry entries yet. Tap + to log your first pickup!</p>
                </div>
            ) : (
                recentEntries.map((entry) => (
                    <div
                        key={entry.id}
                        className="entry-card"
                        onClick={() => navigate(`/entry/${entry.id}`)}
                    >
                        <div className="entry-card-header">
                            <span className="entry-card-date">{formatDate(entry.pickupDate)}</span>
                            <span className={`badge ${entry.status === 'paid' ? 'badge-success' :
                                entry.status === 'partial' ? 'badge-warning' : 'badge-danger'
                                }`}>
                                {entry.status === 'paid' ? '✓ Paid' :
                                    entry.status === 'partial' ? '◐ Partial' : '○ Unpaid'}
                            </span>
                        </div>
                        <div className="entry-card-items">{getItemsSummary(entry)}</div>
                        <div className="entry-card-footer">
                            <span className="entry-card-amount">{formatCurrency(entry.totalAmount)}</span>
                            <span className="entry-card-user">by {entry.createdByName || 'Unknown'}</span>
                        </div>
                    </div>
                ))
            )}

            <button className="fab" onClick={() => navigate('/new-entry')} title="New Entry">
                +
            </button>
        </div>
    );
}
