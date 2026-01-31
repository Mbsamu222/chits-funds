import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { FiPlus, FiEye, FiEdit, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Users() {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        fetchUsers();
    }, [search]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users', { params: { search } });
            setUsers(response.data);
        } catch (error) {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

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
            const message = error.response?.data?.detail || 'Operation failed';
            toast.error(message);
        }
    };

    const openEditModal = (user) => {
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

    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (row) => (
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[var(--primary)]/20 ring-2 ring-white/5">
                        {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-[var(--text)]">{row.name}</p>
                        <p className="text-xs text-[var(--text-muted)] font-medium bg-[var(--surface-light)] px-2 py-0.5 rounded-full inline-block mt-1">{row.phone}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'email',
            label: 'Email',
            className: 'hidden md:table-cell',
            render: (row) => row.email || '-'
        },
        {
            key: 'address',
            label: 'Address',
            className: 'hidden lg:table-cell',
            render: (row) => row.address ? (
                <span className="truncate max-w-[200px] block">{row.address}</span>
            ) : '-'
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
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/users/${row.id}`); }}
                        className="p-2 rounded-lg hover:bg-[var(--surface-light)] text-[var(--primary)]"
                        title="View Details"
                    >
                        <FiEye />
                    </button>
                    {isAdmin() && (
                        <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(row); }}
                            className="p-2 rounded-lg hover:bg-[var(--surface-light)] text-[var(--secondary)]"
                            title="Edit"
                        >
                            <FiEdit />
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Users</h1>
                    <p className="text-[var(--text-muted)] mt-1 text-lg">Manage chit fund members and their details</p>
                </div>
                {isAdmin() && (
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn btn-primary shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40 hover:-translate-y-0.5 transition-all"
                    >
                        <FiPlus className="text-xl" /> <span className="font-semibold">Add User</span>
                    </button>
                )}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="stat-card group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-gradient-to-br from-[var(--primary)] to-indigo-600 text-white shadow-lg shadow-[var(--primary)]/30 group-hover:scale-110 transition-transform">
                            <FiUsers size={24} />
                        </div>
                        <div>
                            <p className="stat-label mb-1">Total Users</p>
                            <p className="stat-value text-[var(--text)]">{users.length}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-gradient-to-br from-[var(--success)] to-emerald-600 text-white shadow-lg shadow-[var(--success)]/30 group-hover:scale-110 transition-transform">
                            <div className="font-bold text-xl">A</div>
                        </div>
                        <div>
                            <p className="stat-label mb-1">Active Users</p>
                            <p className="stat-value text-[var(--text)]">{users.filter(u => u.is_active).length}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-gradient-to-br from-[var(--text-muted)] to-gray-600 text-white shadow-lg shadow-gray-500/30 group-hover:scale-110 transition-transform">
                            <div className="font-bold text-xl">I</div>
                        </div>
                        <div>
                            <p className="stat-label mb-1">Inactive Users</p>
                            <p className="stat-value text-[var(--text)]">{users.filter(u => !u.is_active).length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={users}
                loading={loading}
                searchValue={search}
                onSearchChange={setSearch}
                onRowClick={(row) => navigate(`/users/${row.id}`)}
                emptyMessage="No users found"
            />

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editUser ? 'Edit User' : 'Add New User'}
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleSubmit} className="btn btn-primary">
                            {editUser ? 'Update' : 'Create'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
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
                        <div className="relative">
                            <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="input pl-11"
                                placeholder="Enter phone number"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Email</label>
                        <div className="relative">
                            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input pl-11"
                                placeholder="Enter email (optional)"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Address</label>
                        <div className="relative">
                            <FiMapPin className="absolute left-4 top-3 text-[var(--text-muted)]" />
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="input pl-11 min-h-[80px]"
                                placeholder="Enter address (optional)"
                            />
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
