import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    onClothTypesChange,
    addClothType,
    updateClothType,
    deleteClothType,
    getHousehold,
    getHouseholdMembers,
} from '../firebase/services';

const CLOTH_ICONS = ['👕', '👖', '🧥', '👗', '🩳', '🧣', '🧤', '🩱', '👔', '🥻', '🩲', '🧦'];

export default function SettingsPage() {
    const { user, userProfile, logout } = useAuth();
    const [clothTypes, setClothTypes] = useState([]);
    const [household, setHousehold] = useState(null);
    const [members, setMembers] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newIcon, setNewIcon] = useState('👕');
    const [loading, setLoading] = useState(false);

    const householdId = userProfile?.householdId;
    const isAdmin = userProfile?.role === 'admin';

    useEffect(() => {
        if (!householdId) return;
        const unsub = onClothTypesChange(householdId, setClothTypes);
        getHousehold(householdId).then((h) => {
            setHousehold(h);
            if (h?.members) {
                getHouseholdMembers(h.members).then(setMembers);
            }
        });
        return unsub;
    }, [householdId]);

    function openAddModal() {
        setEditingType(null);
        setNewName('');
        setNewPrice('');
        setNewIcon('👕');
        setShowAddModal(true);
    }

    function openEditModal(type) {
        setEditingType(type);
        setNewName(type.name);
        setNewPrice(String(type.price));
        setNewIcon(type.icon || '👕');
        setShowAddModal(true);
    }

    async function handleSave(e) {
        e.preventDefault();
        if (!newName.trim() || !newPrice) return;
        setLoading(true);
        try {
            const data = {
                name: newName.trim(),
                price: parseFloat(newPrice),
                icon: newIcon,
            };
            if (editingType) {
                await updateClothType(householdId, editingType.id, data);
            } else {
                await addClothType(householdId, data);
            }
            setShowAddModal(false);
            setNewName('');
            setNewPrice('');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(typeId) {
        if (!window.confirm('Delete this cloth type?')) return;
        await deleteClothType(householdId, typeId);
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Settings</h1>
                <p>Manage cloth types, prices & household</p>
            </div>

            {/* Cloth Types */}
            <div className="section-header">
                <h2>Cloth Types & Prices</h2>
                <button className="btn btn-sm btn-primary" onClick={openAddModal}>
                    + Add
                </button>
            </div>

            {clothTypes.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">👕</div>
                    <p>No cloth types yet. Add your first one!</p>
                </div>
            ) : (
                clothTypes.map((type) => (
                    <div key={type.id} className="cloth-type-item">
                        <span className="ct-icon">{type.icon || '👕'}</span>
                        <div className="ct-info">
                            <div className="ct-name">{type.name}</div>
                            <div className="ct-price">₹{type.price} per item</div>
                        </div>
                        <div className="ct-actions">
                            <button
                                className="btn btn-icon btn-ghost"
                                onClick={() => openEditModal(type)}
                                title="Edit"
                            >
                                ✏️
                            </button>
                            <button
                                className="btn btn-icon btn-ghost"
                                onClick={() => handleDelete(type.id)}
                                title="Delete"
                            >
                                🗑
                            </button>
                        </div>
                    </div>
                ))
            )}

            {/* Household Info */}
            <div style={{ marginTop: '40px' }}>
                <div className="section-header">
                    <h2>Household</h2>
                </div>
                {household && (
                    <div className="card-flat" style={{ marginBottom: '16px' }}>
                        <div className="detail-row">
                            <span style={{ color: 'var(--color-text-secondary)' }}>Name</span>
                            <span style={{ fontWeight: 600 }}>{household.name}</span>
                        </div>
                        <div className="detail-row">
                            <span style={{ color: 'var(--color-text-secondary)' }}>Invite Code</span>
                            <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary-light)', letterSpacing: '0.05em' }}>
                                {household.inviteCode}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span style={{ color: 'var(--color-text-secondary)' }}>Members</span>
                            <span style={{ fontWeight: 600 }}>{household.members?.length || 0}</span>
                        </div>
                    </div>
                )}

                {members.length > 0 && (
                    <div className="card-flat" style={{ marginBottom: '16px' }}>
                        {members.map((m) => (
                            <div key={m.id} className="detail-row" style={{ alignItems: 'center' }}>
                                <span style={{ fontWeight: 500 }}>
                                    {m.displayName || m.email}
                                    {m.id === user.uid && (
                                        <span style={{
                                            marginLeft: '8px',
                                            fontSize: '0.75rem',
                                            color: 'var(--color-primary-light)',
                                            fontWeight: 400,
                                        }}>
                                            (you)
                                        </span>
                                    )}
                                </span>
                                <span className={`badge ${m.role === 'admin' ? 'badge-warning' : 'badge-success'}`}>
                                    {m.role || 'member'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Account */}
            <div style={{ marginTop: '24px' }}>
                <div className="section-header">
                    <h2>Account</h2>
                </div>
                <div className="card-flat" style={{ marginBottom: '16px' }}>
                    <div className="detail-row">
                        <span style={{ color: 'var(--color-text-secondary)' }}>Email</span>
                        <span>{user?.email}</span>
                    </div>
                    <div className="detail-row">
                        <span style={{ color: 'var(--color-text-secondary)' }}>Name</span>
                        <span>{user?.displayName}</span>
                    </div>
                    <div className="detail-row">
                        <span style={{ color: 'var(--color-text-secondary)' }}>Role</span>
                        <span className={`badge ${userProfile?.role === 'admin' ? 'badge-warning' : 'badge-success'}`}>
                            {userProfile?.role || 'member'}
                        </span>
                    </div>
                </div>
                <button className="btn btn-danger btn-block" onClick={logout}>
                    Log Out
                </button>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingType ? 'Edit Cloth Type' : 'Add Cloth Type'}</h2>
                            <button
                                className="btn btn-icon btn-ghost"
                                onClick={() => setShowAddModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label className="form-label">Icon</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {CLOTH_ICONS.map((icon) => (
                                        <button
                                            type="button"
                                            key={icon}
                                            onClick={() => setNewIcon(icon)}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '8px',
                                                border: newIcon === icon ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                                background: newIcon === icon ? 'var(--color-primary-glow)' : 'var(--color-bg-tertiary)',
                                                fontSize: '1.2rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 150ms ease',
                                            }}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="e.g. Shirt, Pants, Saree"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Price per item (₹)</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    placeholder="e.g. 15"
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(e.target.value)}
                                    min="0"
                                    step="0.5"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary btn-block"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : editingType ? 'Update' : 'Add Cloth Type'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
