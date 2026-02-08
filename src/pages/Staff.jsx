import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { FiPlus, FiUsers, FiUserCheck, FiShield, FiUserX, FiEdit } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Staff() {
    const { isAdmin } = useAuth();
    const [staff, setStaff] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        role: 'staff'
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const response = await api.get('/staff');
            setStaff(response.data);
        } catch (error) {
            toast.error('Failed to fetch staff');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            // Handle paginated response
            const data = response.data.items || response.data;
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Failed to fetch users');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const staffData = {
                name: formData.name,
                phone: formData.phone,
                email: formData.email || null,
                password: formData.password,
                role: formData.role
            };
            await api.post('/staff', staffData);
            toast.success('Staff created successfully');
            setShowModal(false);
            resetForm();
            fetchStaff();
        } catch (error) {
            const message = error.response?.data?.detail || 'Failed to create staff';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await api.put(`/staff/${editingStaff.id}`, {
                name: formData.name,
                phone: formData.phone,
                email: formData.email || null,
                is_active: formData.is_active
            });
            toast.success('Staff updated successfully');
            setShowModal(false);
            setEditMode(false);
            setEditingStaff(null);
            resetForm();
            fetchStaff();
        } catch (error) {
            const message = error.response?.data?.detail || 'Failed to update staff';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const openEditModal = (staffMember) => {
        setEditingStaff(staffMember);
        setFormData({
            name: staffMember.name,
            phone: staffMember.phone,
            email: staffMember.email || '',
            password: '',
            role: staffMember.role,
            is_active: staffMember.is_active
        });
        setEditMode(true);
        setShowModal(true);
    };

    const openAssignModal = async (staffMember) => {
        setSelectedStaff(staffMember);
        await fetchUsers();

        try {
            const response = await api.get(`/staff/${staffMember.id}/users`);
            setSelectedUsers(response.data.users.map(u => u.id));
        } catch (error) {
            setSelectedUsers([]);
        }

        setShowAssignModal(true);
    };

    const handleAssignUsers = async () => {
        setSaving(true);
        try {
            await api.post(`/staff/${selectedStaff.id}/assign-users`, {
                user_ids: selectedUsers
            });
            toast.success('Users assigned successfully');
            setShowAssignModal(false);
        } catch (error) {
            toast.error('Failed to assign users');
        } finally {
            setSaving(false);
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const resetForm = () => {
        setFormData({ name: '', phone: '', email: '', password: '', role: 'staff', is_active: true });
        setEditMode(false);
        setEditingStaff(null);
    };

    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        s.phone.includes(searchValue)
    );

    const activeStaff = staff.filter(s => s.is_active).length;
    const adminCount = staff.filter(s => s.role === 'admin').length;

    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className={`avatar avatar-md ${row.role === 'admin' ? 'avatar-gold' : 'avatar-gradient'}`}
                        style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.1)' }}>
                        {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p style={{ fontWeight: 600 }}>{row.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.phone}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'role',
            label: 'Role',
            render: (row) => (
                <span className={`badge ${row.role === 'admin' ? 'badge-warning' : 'badge-primary'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    {row.role === 'admin' && <FiShield size={10} />}
                    {row.role.toUpperCase()}
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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(row); }}
                        className="btn btn-sm btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        title="Edit Staff"
                    >
                        <FiEdit size={14} />
                    </button>
                    {row.role !== 'admin' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); openAssignModal(row); }}
                            className="btn btn-sm btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            title="Assign Users"
                        >
                            <FiUsers size={14} />
                            <span className="hide-mobile">Assign</span>
                        </button>
                    )}
                </div>
            )
        }
    ];

    const mobileCardRender = (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className={`avatar avatar-lg ${row.role === 'admin' ? 'avatar-gold' : 'avatar-gradient'}`}
                style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.1)', flexShrink: 0 }}>
                {row.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700 }}>{row.name}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{row.phone}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <span className={`badge ${row.role === 'admin' ? 'badge-warning' : 'badge-primary'}`}>
                        {row.role.toUpperCase()}
                    </span>
                    <span className={`badge ${row.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {row.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
            {row.role !== 'admin' && (
                <button
                    onClick={(e) => { e.stopPropagation(); openAssignModal(row); }}
                    className="btn btn-icon-sm btn-secondary"
                >
                    <FiUsers size={16} />
                </button>
            )}
        </div>
    );

    if (!isAdmin()) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                }}>
                    <FiShield style={{ color: 'var(--danger)' }} size={32} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Access Denied</h2>
                <p style={{ color: 'var(--text-muted)' }}>This page is for administrators only.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 800, letterSpacing: '-0.025em' }}>
                        Staff <span style={{ color: 'var(--primary)' }}>Management</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Manage staff members and user assignments
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="btn btn-primary"
                >
                    <FiPlus /> Add Staff
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                flexShrink: 0
                            }}
                        >
                            <FiUserCheck size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Total</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 800 }}>{staff.length}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                flexShrink: 0
                            }}
                        >
                            <FiShield size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Admins</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--warning)' }}>{adminCount}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                flexShrink: 0
                            }}
                        >
                            <FiUsers size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Active</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--success)' }}>{activeStaff}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={filteredStaff}
                loading={loading}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                emptyMessage={staff.length === 0 ? "No staff members yet" : "No staff match your search"}
                emptyIcon={<FiUserCheck size={32} />}
                emptyAction={staff.length === 0 && (
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn btn-primary"
                        style={{ marginTop: '1rem' }}
                    >
                        <FiPlus /> Add First Staff Member
                    </button>
                )}
                mobileCardRender={mobileCardRender}
            />



            {/* Add/Edit Staff Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); resetForm(); }}
                title={editMode ? `Edit Staff: ${editingStaff?.name}` : "Add New Staff"}
                footer={
                    <>
                        <button onClick={() => { setShowModal(false); resetForm(); }} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button onClick={editMode ? handleEdit : handleSubmit} disabled={saving} className="btn btn-primary">
                            {saving ? <div className="spinner spinner-sm" /> : (editMode ? 'Save Changes' : 'Create')}
                        </button>
                    </>
                }
            >
                <form onSubmit={editMode ? handleEdit : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

                    {!editMode && (
                        <div className="input-group">
                            <label>Password *</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input"
                                placeholder="Enter password"
                                required
                            />
                        </div>
                    )}

                    {!editMode && (
                        <div className="input-group">
                            <label>Role</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="input"
                            >
                                <option value="staff">Staff</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    )}

                    {editMode && (
                        <div className="input-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                />
                                <span>Active Status</span>
                            </label>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Inactive staff cannot log in to the system.
                            </p>
                        </div>
                    )}
                </form>
            </Modal>


            {/* Assign Users Modal */}
            <Modal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                title={`Assign Users to ${selectedStaff?.name}`}
                size="lg"
                footer={
                    <>
                        <button onClick={() => setShowAssignModal(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleAssignUsers} disabled={saving} className="btn btn-primary">
                            {saving ? <div className="spinner spinner-sm" /> : `Assign (${selectedUsers.length})`}
                        </button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {users.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No users available</p>
                    ) : (
                        users.map((user) => (
                            <label
                                key={user.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: selectedUsers.includes(user.id) ? 'rgba(99, 102, 241, 0.15)' : 'var(--surface-light)',
                                    border: selectedUsers.includes(user.id) ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent'
                                }}
                            >
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '0.375rem',
                                    border: '2px solid',
                                    borderColor: selectedUsers.includes(user.id) ? 'var(--primary)' : 'var(--surface-lighter)',
                                    background: selectedUsers.includes(user.id) ? 'var(--primary)' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    flexShrink: 0
                                }}>
                                    {selectedUsers.includes(user.id) && (
                                        <svg style={{ width: '12px', height: '12px', color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={() => toggleUserSelection(user.id)}
                                    style={{ display: 'none' }}
                                />
                                <div className="avatar avatar-sm avatar-gradient">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{user.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.phone}</p>
                                </div>
                            </label>
                        ))
                    )}
                </div>
            </Modal>
        </div>
    );
}
