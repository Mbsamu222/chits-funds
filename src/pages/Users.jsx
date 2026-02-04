import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { FiPlus, FiUsers, FiEdit, FiEye, FiPhone, FiMail, FiUserCheck, FiUserX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Users() {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            // Handle paginated response
            const data = response.data.items || response.data;
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editUser) {
                await api.put(`/users/${editUser.id}`, formData);
                toast.success('User updated successfully');
            } else {
                await api.post('/users', formData);
                toast.success('User created successfully');
            }
            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            const message = error.response?.data?.detail || 'Failed to save user';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (user) => {
        setEditUser(user);
        setFormData({
            name: user.name,
            phone: user.phone,
            email: user.email || '',
            address: user.address || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditUser(null);
        setFormData({ name: '', phone: '', email: '', address: '' });
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        user.phone.includes(searchValue)
    );

    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="avatar avatar-md avatar-gradient" style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.1)' }}>
                        {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p style={{ fontWeight: 600, color: 'var(--text)' }}>{row.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FiPhone size={10} /> {row.phone}
                        </p>
                    </div>
                </div>
            )
        },
        {
            key: 'email',
            label: 'Email',
            className: 'hidden md:table-cell',
            render: (row) => (
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {row.email ? (
                        <><FiMail size={14} /> {row.email}</>
                    ) : (
                        <span style={{ color: 'var(--text-dim)' }}>—</span>
                    )}
                </span>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <span className={`badge ${row.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/users/${row.id}`); }}
                        className="btn btn-sm btn-secondary"
                        title="View Details"
                    >
                        <FiEye size={14} />
                    </button>
                    {isAdmin() && (
                        <button
                            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                            className="btn btn-sm btn-ghost"
                            title="Edit User"
                        >
                            <FiEdit size={14} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    // Mobile card render
    const mobileCardRender = (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="avatar avatar-lg avatar-gradient" style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.1)', flexShrink: 0 }}>
                {row.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <FiPhone size={12} /> {row.phone}
                </div>
                {row.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                        <FiMail size={10} /> {row.email}
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <span className={`badge ${row.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/users/${row.id}`); }}
                        className="btn btn-icon-sm btn-secondary"
                    >
                        <FiEye size={14} />
                    </button>
                    {isAdmin() && (
                        <button
                            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                            className="btn btn-icon-sm btn-ghost"
                        >
                            <FiEdit size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    const activeUsers = users.filter(u => u.is_active).length;
    const inactiveUsers = users.filter(u => !u.is_active).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 800, letterSpacing: '-0.025em' }}>
                            User <span style={{ color: 'var(--primary)' }}>Management</span>
                        </h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            Manage all registered users
                        </p>
                    </div>
                    {isAdmin() && (
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="btn btn-primary"
                        >
                            <FiPlus /> Add User
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                flexShrink: 0
                            }}
                        >
                            <FiUsers size={20} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Total</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{users.length}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                flexShrink: 0
                            }}
                        >
                            <FiUserCheck size={20} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Active</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>{activeUsers}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                flexShrink: 0
                            }}
                        >
                            <FiUserX size={20} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Inactive</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)' }}>{inactiveUsers}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={filteredUsers}
                loading={loading}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onRowClick={(row) => navigate(`/users/${row.id}`)}
                emptyMessage="No users found"
                emptyIcon={<FiUsers size={32} />}
                mobileCardRender={mobileCardRender}
            />



            {/* Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editUser ? 'Edit User' : 'Add New User'}
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="btn btn-primary"
                        >
                            {saving ? (
                                <div className="spinner spinner-sm" />
                            ) : editUser ? (
                                'Update'
                            ) : (
                                'Create'
                            )}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="input-group">
                        <label>Full Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input"
                            placeholder="Enter full name"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Phone Number *</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="input"
                            placeholder="Enter phone number"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="input"
                            placeholder="Enter email (optional)"
                        />
                    </div>

                    <div className="input-group">
                        <label>Address</label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="input"
                            rows={3}
                            placeholder="Enter address (optional)"
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
}
