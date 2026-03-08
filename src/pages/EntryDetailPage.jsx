import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLaundryEntry, updateLaundryEntry, deleteLaundryEntry } from '../firebase/services';

export default function EntryDetailPage() {
    const { entryId } = useParams();
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();
    const [entry, setEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [showPayModal, setShowPayModal] = useState(false);
    const [updating, setUpdating] = useState(false);

    const householdId = userProfile?.householdId;

    useEffect(() => {
        if (!householdId || !entryId) return;
        getLaundryEntry(householdId, entryId)
            .then(setEntry)
            .finally(() => setLoading(false));
    }, [householdId, entryId]);

    function formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return d.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }

    function formatCurrency(amount) {
        return `₹${(amount || 0).toLocaleString('en-IN')}`;
    }

    async function handleMarkPaid() {
        setUpdating(true);
        try {
            await updateLaundryEntry(householdId, entryId, {
                status: 'paid',
                paidAmount: entry.totalAmount,
                paidBy: user.displayName || user.email,
                paidDate: new Date(),
            });
            setEntry((prev) => ({
                ...prev,
                status: 'paid',
                paidAmount: prev.totalAmount,
                paidBy: user.displayName || user.email,
                paidDate: new Date(),
            }));
        } finally {
            setUpdating(false);
        }
    }

    async function handlePartialPayment(e) {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) return;
        setUpdating(true);
        try {
            const newPaidAmount = (entry.paidAmount || 0) + amount;
            const newStatus = newPaidAmount >= entry.totalAmount ? 'paid' : 'partial';
            await updateLaundryEntry(householdId, entryId, {
                status: newStatus,
                paidAmount: newPaidAmount,
                paidBy: user.displayName || user.email,
                paidDate: new Date(),
            });
            setEntry((prev) => ({
                ...prev,
                status: newStatus,
                paidAmount: newPaidAmount,
                paidBy: user.displayName || user.email,
                paidDate: new Date(),
            }));
            setShowPayModal(false);
            setPaymentAmount('');
        } finally {
            setUpdating(false);
        }
    }

    async function handleDelete() {
        if (!window.confirm('Delete this entry? This cannot be undone.')) return;
        setUpdating(true);
        try {
            await deleteLaundryEntry(householdId, entryId);
            navigate('/');
        } finally {
            setUpdating(false);
        }
    }

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
            </div>
        );
    }

    if (!entry) {
        return (
            <div className="page-container">
                <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <p>Entry not found</p>
                </div>
            </div>
        );
    }

    const balance = entry.totalAmount - (entry.paidAmount || 0);

    return (
        <div className="page-container">
            <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>{formatDate(entry.pickupDate)}</h1>
                    <p>Logged by {entry.createdByName || 'Unknown'}</p>
                </div>
                <span className={`badge ${entry.status === 'paid' ? 'badge-success' :
                    entry.status === 'partial' ? 'badge-warning' : 'badge-danger'
                    }`}>
                    {entry.status === 'paid' ? '✓ Paid' :
                        entry.status === 'partial' ? '◐ Partial' : '○ Unpaid'}
                </span>
            </div>

            {/* Items */}
            <div className="detail-section">
                <h3>Items</h3>
                <div className="card-flat">
                    {entry.items?.map((item, i) => (
                        <div key={i} className="detail-row">
                            <span>{item.clothTypeName} × {item.quantity}</span>
                            <span style={{ fontWeight: 600, color: 'var(--color-accent-light)' }}>
                                {formatCurrency(item.subtotal)}
                            </span>
                        </div>
                    ))}
                    <div className="detail-row" style={{
                        borderTop: '1px solid var(--color-border)',
                        marginTop: '8px',
                        paddingTop: '12px',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                    }}>
                        <span>Total</span>
                        <span style={{ color: 'var(--color-accent-light)' }}>
                            {formatCurrency(entry.totalAmount)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {entry.notes && (
                <div className="detail-section">
                    <h3>Notes</h3>
                    <div className="card-flat">
                        <p style={{ color: 'var(--color-text-secondary)' }}>{entry.notes}</p>
                    </div>
                </div>
            )}

            {/* Payment */}
            <div className="payment-section">
                <h3>💳 Payment</h3>
                <div className="payment-info-grid">
                    <div className="payment-info-item">
                        <div className="label">Total</div>
                        <div className="value">{formatCurrency(entry.totalAmount)}</div>
                    </div>
                    <div className="payment-info-item">
                        <div className="label">Paid</div>
                        <div className="value" style={{ color: 'var(--color-success)' }}>
                            {formatCurrency(entry.paidAmount)}
                        </div>
                    </div>
                    <div className="payment-info-item">
                        <div className="label">{balance < 0 ? 'Overpaid' : 'Balance'}</div>
                        <div className="value" style={{ color: balance > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                            {balance < 0 ? `+${formatCurrency(Math.abs(balance))}` : formatCurrency(balance)}
                        </div>
                    </div>
                    {entry.paidBy && (
                        <div className="payment-info-item">
                            <div className="label">Paid By</div>
                            <div className="value" style={{ fontSize: 'var(--font-size-sm)' }}>{entry.paidBy}</div>
                        </div>
                    )}
                </div>

                {entry.status !== 'paid' && balance > 0 && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className="btn btn-success"
                            style={{ flex: 1 }}
                            onClick={handleMarkPaid}
                            disabled={updating}
                        >
                            {updating ? '...' : '✓ Mark Fully Paid'}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowPayModal(true)}
                            disabled={updating}
                        >
                            Partial
                        </button>
                    </div>
                )}
            </div>

            {/* Delete */}
            <div style={{ marginTop: '32px' }}>
                <button
                    className="btn btn-danger btn-block"
                    onClick={handleDelete}
                    disabled={updating}
                >
                    🗑 Delete Entry
                </button>
            </div>

            {/* Partial Payment Modal */}
            {showPayModal && (
                <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Record Payment</h2>
                            <button
                                className="btn btn-icon btn-ghost"
                                onClick={() => setShowPayModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                            Balance remaining: {formatCurrency(balance)}
                        </p>
                        <form onSubmit={handlePartialPayment}>
                            <div className="form-group">
                                <label className="form-label">Amount Paid</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    placeholder={`Balance: ₹${balance}`}
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    min={1}
                                    required
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary btn-block"
                                disabled={updating}
                            >
                                {updating ? 'Recording...' : 'Record Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
