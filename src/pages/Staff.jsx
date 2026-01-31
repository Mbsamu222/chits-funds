import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { FiPlus, FiUsers, FiEdit } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Staff() {
    const { isAdmin } = useAuth();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
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
            setUsers(response.data);
        } catch (error) {
            toast.error('Failed to fetch users');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await api.post('/staff', formData);
            toast.success('Staff created successfully');
            setShowModal(false);
            resetForm();
            fetchStaff();
        } catch (error) {
            const message = error.response?.data?.detail || 'Failed to create staff';
            toast.error(message);
        }
    };

    const openAssignModal = async (staffMember) => {
        setSelectedStaff(staffMember);
        await fetchUsers();

        // Fetch currently assigned users
        try {
            const response = await api.get(`/staff/${staffMember.id}/users`);
            setSelectedUsers(response.data.users.map(u => u.id));
        } catch (error) {
            setSelectedUsers([]);
        }

        setShowAssignModal(true);
    };

    const handleAssignUsers = async () => {
        try {
            await api.post(`/staff/${selectedStaff.id}/assign-users`, {
                user_ids: selectedUsers
            });
            toast.success('Users assigned successfully');
            setShowAssignModal(false);
        } catch (error) {
            toast.error('Failed to assign users');
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
        setFormData({ name: '', phone: '', email: '', password: '', role: 'staff' });
    };

    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${row.role === 'admin'
                            ? 'bg-gradient-to-br from-[var(--accent)] to-[var(--danger)]'
                            : 'bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]'
                        }`}>
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
            key: 'role',
            label: 'Role',
            render: (row) => (
                <span className={`badge ${row.role === 'admin' ? 'badge-warning' : 'badge-primary'}`}>
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
                <div className="flex items-center gap-2">
                    {row.role !== 'admin' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); openAssignModal(row); }}
                            className="btn btn-sm btn-secondary"
                        >
                            <FiUsers size={14} /> Assign Users
                        </button>
                    )}
                </div>
            )
        }
    ];

    if (!isAdmin()) {
        return (
            <div className="text-center py-12">
                <p className="text-[var(--text-muted)]">Access denied. Admin only.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Staff</h1>
                    <p className="text-[var(--text-muted)]">Manage staff members and user assignments</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="btn btn-primary"
                >
                    <FiPlus /> Add Staff
                </button>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={staff}
                loading={loading}
                emptyMessage="No staff members found"
            />

            {/* Add Staff Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Add New Staff"
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleSubmit} className="btn btn-primary">
                            Create
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

                    <div className="input-group">
                        <label>Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="select"
                        >
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </form>
            </Modal>

            {/* Assign Users Modal */}
            <Modal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                title={`Assign Users to ${selectedStaff?.name}`}
                footer={
                    <>
                        <button onClick={() => setShowAssignModal(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleAssignUsers} className="btn btn-primary">
                            Assign ({selectedUsers.length})
                        </button>
                    </>
                }
            >
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {users.length === 0 ? (
                        <p className="text-center text-[var(--text-muted)] py-4">No users available</p>
                    ) : (
                        users.map((user) => (
                            <label
                                key={user.id}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedUsers.includes(user.id)
                                        ? 'bg-[var(--primary)]/20 border border-[var(--primary)]'
                                        : 'bg-[var(--surface-light)] hover:bg-[var(--surface)]'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={() => toggleUserSelection(user.id)}
                                    className="w-5 h-5 rounded"
                                />
                                <div>
                                    <p className="font-medium">{user.name}</p>
                                    <p className="text-xs text-[var(--text-muted)]">{user.phone}</p>
                                </div>
                            </label>
                        ))
                    )}
                </div>
            </Modal>
        </div>
    );
}
