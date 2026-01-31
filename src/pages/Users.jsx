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
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold">
                        {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-medium">{row.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{row.phone}</p>
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
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Users</h1>
                    <p className="text-[var(--text-muted)]">Manage chit fund members</p>
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
