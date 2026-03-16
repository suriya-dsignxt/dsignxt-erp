'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Image from 'next/image';
import PageHeader from '@/components/ui/PageHeader';
import AdvancedTable from '@/components/ui/AdvancedTable';
import ModernGlassCard from '@/components/ui/ModernGlassCard';
import { UserPlus, Trash2, CheckCircle, XCircle, Users, Mail, Phone, Shield, Camera, X, Loader2, Edit, AlertCircle } from 'lucide-react';

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE', phone: '', photo: '' });
    const [uploading, setUploading] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    // Bulk Actions State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'ALL' | 'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let url = `/api/admin/users?t=${Date.now()}`;
            if (activeTab !== 'ALL') {
                url += `&role=${activeTab}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            if (data.users) setUsers(data.users);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
        if (!confirm(`Are you sure you want to ${action} ${selectedIds.length} users?`)) return;

        setLoading(true);
        try {
            const promises = selectedIds.map(id => {
                if (action === 'delete') {
                    return fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
                } else {
                    const newStatus = action === 'activate' ? 'Active' : 'Inactive';
                    return fetch(`/api/admin/users/${id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus }),
                    });
                }
            });

            await Promise.all(promises);
            setSelectedIds([]);
            fetchUsers();
        } catch (error) {
            console.error("Bulk action failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setUploading(true);
        const file = e.target.files[0];
        const data = new FormData();
        data.append('file', file);

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: data });
            const json = await res.json();
            if (json.url) setFormData(prev => ({ ...prev, photo: json.url }));
        } catch (err) {
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = editingUser ? `/api/admin/users/${editingUser._id}` : '/api/admin/users';
            const method = editingUser ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                closeModal();
                fetchUsers();
            } else {
                const err = await res.json();
                alert(`Operation failed: ${err.message}`);
            }
        } catch (error) {
            alert("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'EMPLOYEE', phone: '', photo: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (user: any) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            phone: user.phone || '',
            photo: user.photo || ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const columns = [
        {
            header: "User Profile",
            accessor: (user: any) => (
                <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12">
                        {user.photo ? (
                            <Image
                                src={user.photo}
                                alt={user.name}
                                fill
                                className="object-cover rounded-xl shadow-sm border border-white/50"
                            />
                        ) : (
                            <div className="w-full h-full rounded-xl bg-gradient-to-br from-indigo-100 to-white border border-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg shadow-sm">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                        )}
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    </div>
                    <div>
                        <div className="font-bold text-navy-900 leading-tight">{user?.name || 'Unknown User'}</div>
                        <div className="text-xs text-gray-500 font-medium">{user?.role || 'Unknown Role'}</div>
                    </div>
                </div>
            ),
            sortable: true,
        },
        {
            header: "Contact Info",
            accessor: (user: any) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Mail size={12} className="text-indigo-400" /> {user.email}
                    </div>
                    {user.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone size={12} className="text-indigo-400" /> {user.phone}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: "Status",
            accessor: (user: any) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${user.status === 'Active'
                    ? 'bg-green-50 text-green-700 border-green-100'
                    : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                    {user.status === 'Active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {user.status}
                </span>
            ),
            sortable: true
        },
        {
            header: "Actions",
            accessor: (user: any) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Edit User"
                    >
                        <Edit size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-mesh-gradient">
            <Sidebar />
            <main className="md:ml-64 p-4 md:p-8 flex-1 overflow-x-hidden">
                <PageHeader
                    title="User Management"
                    subtitle="Control access and manage user accounts"
                    breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Users' }]}
                    actions={
                        <button
                            onClick={openCreateModal}
                            className="bg-navy-900 hover:bg-navy-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-navy-900/20 transition-all flex items-center gap-2 hover:-translate-y-0.5"
                        >
                            <UserPlus size={18} /> Add User
                        </button>
                    }
                />

                <ModernGlassCard className="mt-6 !p-0 overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 bg-white/50 backdrop-blur-sm px-6">
                        {['EMPLOYEE', 'ADMIN', 'ALL'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab as any); setSelectedIds([]); }}
                                className={`px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === tab
                                    ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                                    : 'border-transparent text-gray-500 hover:text-navy-900 hover:bg-gray-50'
                                    }`}
                            >
                                {tab === 'ALL' ? 'All Roles' : tab}
                            </button>
                        ))}
                    </div>

                    <AdvancedTable
                        data={users}
                        columns={columns}
                        keyField="_id"
                        isLoading={loading}
                        onSelectionChange={setSelectedIds}
                        actions={
                            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                                <button onClick={() => handleBulkAction('activate')} className="p-1.5 hover:bg-white text-green-600 rounded-md shadow-sm transition-all" title="Activate Selected">
                                    <CheckCircle size={16} />
                                </button>
                                <div className="w-px h-4 bg-gray-200"></div>
                                <button onClick={() => handleBulkAction('deactivate')} className="p-1.5 hover:bg-white text-orange-600 rounded-md shadow-sm transition-all" title="Deactivate Selected">
                                    <XCircle size={16} />
                                </button>
                                <div className="w-px h-4 bg-gray-200"></div>
                                <button onClick={() => handleBulkAction('delete')} className="p-1.5 hover:bg-white text-red-600 rounded-md shadow-sm transition-all" title="Delete Selected">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        }
                    />
                </ModernGlassCard>

                {/* Create/Edit Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-200" onClick={closeModal}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h2 className="text-xl font-black text-navy-900 tracking-tight">{editingUser ? 'Edit User' : 'New User'}</h2>
                                    <p className="text-xs text-gray-500 font-medium mt-1">
                                        {editingUser ? 'Update account details' : 'Create a new system account'}
                                    </p>
                                </div>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                {/* Photo Upload */}
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="relative group">
                                        <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden relative border-2 border-dashed border-gray-300 group-hover:border-orange-500 transition-colors">
                                            {formData.photo ? (
                                                <Image src={formData.photo} alt="Preview" fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                                    <Camera size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl">
                                            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                        </label>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-navy-900">Profile Photo</h3>
                                        <p className="text-xs text-gray-500 mt-1 mb-2">Upload a clear face photo.</p>
                                        <label className="btn btn-xs bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm rounded-lg px-3 py-1.5 cursor-pointer text-xs font-bold">
                                            {uploading ? <Loader2 className="animate-spin w-3 h-3" /> : 'Choose File'}
                                            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                                        <div className="relative">
                                            <input
                                                required
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm font-semibold"
                                                placeholder="John Doe"
                                            />
                                            <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Role</label>
                                        <div className="relative">
                                            <select
                                                value={formData.role}
                                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm font-semibold appearance-none"
                                            >
                                                <option value="EMPLOYEE">Employee</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                            <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm font-semibold"
                                            placeholder="john@example.com"
                                        />
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</label>
                                        <div className="relative">
                                            <input
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm font-semibold"
                                                placeholder="+1 234..."
                                            />
                                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Password {editingUser && <span className="text-gray-400 font-normal lowercase">(optional)</span>}
                                        </label>
                                        <input
                                            type="password"
                                            required={!editingUser}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm font-semibold"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 mt-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-navy-900 text-white rounded-xl hover:bg-orange-500 font-bold shadow-lg shadow-navy-900/20 hover:shadow-orange-500/30 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2 text-sm"
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <SaveIcon />}
                                        {loading ? 'Saving...' : 'Save User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

const SaveIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
);
