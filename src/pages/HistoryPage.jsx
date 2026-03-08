import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { onEntriesChange } from '../firebase/services';

export default function HistoryPage() {
    const { userProfile } = useAuth();
    const navigate = useNavigate();
    const [entries, setEntries] = useState([]);
    const [filter, setFilter] = useState('all');

    const householdId = userProfile?.householdId;

    useEffect(() => {
        if (!householdId) return;
        const unsub = onEntriesChange(householdId, setEntries);
        return unsub;
    }, [householdId]);

    const filteredEntries = entries.filter((e) => {
        if (filter === 'all') return true;
        return e.status === filter;
    });

    const totalBalance = Math.max(0, entries
        .filter((e) => e.status !== 'paid')
        .reduce((sum, e) => sum + Math.max(0, e.totalAmount - (e.paidAmount || 0)), 0));

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
        return `${totalQty} item${totalQty !== 1 ? 's' : ''}`;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>History</h1>
                <p>
                    {entries.length} total entries ·{' '}
                    <span style={{ color: totalBalance > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        {formatCurrency(totalBalance)} outstanding
                    </span>
                </p>
            </div>

            <div className="filter-bar">
                {[
                    { key: 'all', label: 'All' },
                    { key: 'pending', label: '○ Unpaid' },
                    { key: 'partial', label: '◐ Partial' },
                    { key: 'paid', label: '✓ Paid' },
                ].map((f) => (
                    <button
                        key={f.key}
                        className={`filter-chip ${filter === f.key ? 'active' : ''}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {filteredEntries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p>
                        {filter === 'all'
                            ? 'No entries yet'
                            : `No ${filter} entries`}
                    </p>
                </div>
            ) : (
                filteredEntries.map((entry) => (
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
