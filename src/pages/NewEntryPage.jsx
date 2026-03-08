import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { onClothTypesChange, addLaundryEntry } from '../firebase/services';

export default function NewEntryPage() {
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();
    const [clothTypes, setClothTypes] = useState([]);
    const [items, setItems] = useState({});
    const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const householdId = userProfile?.householdId;

    useEffect(() => {
        if (!householdId) return;
        const unsub = onClothTypesChange(householdId, setClothTypes);
        return unsub;
    }, [householdId]);

    function updateQuantity(typeId, delta) {
        setItems((prev) => {
            const current = prev[typeId] || 0;
            const newQty = Math.max(0, current + delta);
            if (newQty === 0) {
                const { [typeId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [typeId]: newQty };
        });
    }

    function setQuantity(typeId, value) {
        const qty = parseInt(value, 10);
        if (isNaN(qty) || qty < 0) return;
        setItems((prev) => {
            if (qty === 0) {
                const { [typeId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [typeId]: qty };
        });
    }

    const selectedItems = Object.entries(items)
        .filter(([, qty]) => qty > 0)
        .map(([typeId, qty]) => {
            const type = clothTypes.find((t) => t.id === typeId);
            return {
                clothTypeId: typeId,
                clothTypeName: type?.name || 'Unknown',
                quantity: qty,
                pricePerItem: type?.price || 0,
                subtotal: qty * (type?.price || 0),
            };
        });

    const totalAmount = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);

    async function handleSubmit() {
        if (selectedItems.length === 0) {
            setError('Please add at least one item');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await addLaundryEntry(householdId, {
                pickupDate: new Date(pickupDate),
                items: selectedItems,
                totalAmount,
                status: 'pending',
                paidAmount: 0,
                paidBy: null,
                notes: notes.trim() || null,
                createdBy: user.uid,
                createdByName: user.displayName || 'Unknown',
            });
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page-container">
            <button className="back-btn" onClick={() => navigate(-1)}>
                ← Back
            </button>

            <div className="page-header">
                <h1>New Entry</h1>
                <p>Log laundry items for pickup</p>
            </div>

            <div className="form-group">
                <label className="form-label">Pickup Date</label>
                <input
                    className="form-input"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                />
            </div>

            {error && <div className="error-message">{error}</div>}

            {clothTypes.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">👕</div>
                    <p>No cloth types configured yet</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/settings')}
                    >
                        Add Cloth Types
                    </button>
                </div>
            ) : (
                <>
                    <div className="section-header">
                        <h2>Items</h2>
                    </div>

                    {clothTypes.map((type) => {
                        const qty = items[type.id] || 0;
                        const subtotal = qty * (type.price || 0);
                        return (
                            <div key={type.id} className="item-row">
                                <span style={{ fontSize: '1.3rem' }}>{type.icon || '👕'}</span>
                                <div className="item-name">
                                    <div>{type.name}</div>
                                    <div className="item-price">₹{type.price} each</div>
                                </div>
                                <div className="qty-stepper">
                                    <button onClick={() => updateQuantity(type.id, -1)}>−</button>
                                    <input
                                        className="qty-value"
                                        type="number"
                                        value={qty}
                                        onChange={(e) => setQuantity(type.id, e.target.value)}
                                        min="0"
                                        style={{
                                            width: '40px',
                                            textAlign: 'center',
                                            fontWeight: 600,
                                            background: 'var(--color-bg-secondary)',
                                            border: 'none',
                                            color: 'var(--color-text)',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: 'var(--font-size-md)',
                                        }}
                                    />
                                    <button onClick={() => updateQuantity(type.id, 1)}>+</button>
                                </div>
                                <span className="item-subtotal">
                                    {subtotal > 0 ? `₹${subtotal}` : '—'}
                                </span>
                            </div>
                        );
                    })}

                    {selectedItems.length > 0 && (
                        <div className="total-bar">
                            {selectedItems.map((item) => (
                                <div key={item.clothTypeId} className="total-row">
                                    <span>
                                        {item.clothTypeName} × {item.quantity}
                                    </span>
                                    <span>₹{item.subtotal}</span>
                                </div>
                            ))}
                            <div className="total-row grand-total">
                                <span>Total</span>
                                <span className="total-amount">₹{totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    )}

                    <div className="form-group" style={{ marginTop: '24px' }}>
                        <label className="form-label">Notes (optional)</label>
                        <textarea
                            className="form-input"
                            placeholder="e.g. Include starch for shirts"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <button
                        className="btn btn-primary btn-block btn-lg"
                        onClick={handleSubmit}
                        disabled={loading || selectedItems.length === 0}
                    >
                        {loading ? 'Saving...' : `Save Entry · ₹${totalAmount.toLocaleString('en-IN')}`}
                    </button>
                </>
            )}
        </div>
    );
}
