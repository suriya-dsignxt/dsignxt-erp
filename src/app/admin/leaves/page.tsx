'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AdvancedTable from '@/components/ui/AdvancedTable';
import ModernGlassCard from '@/components/ui/ModernGlassCard';
import PageHeader from '@/components/ui/PageHeader';
import { CheckCircle, XCircle, Clock, Calendar, FileText, Check, X, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLeaves() {
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'Pending' | 'History'>('Pending');

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const res = await fetch(`/api/admin/leaves?t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.leaves) setLeaves(data.leaves);
        } catch (e) {
            console.error("Fetch leaves failed", e);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected') => {
        setActionLoading(id + status);
        const previousLeaves = [...leaves];
        
        // Optimistic UI Update
        setLeaves(prev => prev.map(l => l._id === id ? { ...l, status } : l));

        toast.promise(async () => {
            const res = await fetch(`/api/admin/leaves/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update status');
            }
            await fetchLeaves();
            return `Leave request ${status} successfully`;
        }, {
            loading: `Updating status to ${status}...`,
            success: (data) => {
                setActionLoading(null);
                return data;
            },
            error: (err) => {
                setActionLoading(null);
                setLeaves(previousLeaves);
                return `Error: ${err.message}`;
            }
        });
    };

    const handleDeleteLeave = async (id: string) => {
        if (!confirm('Are you sure you want to remove this leave request? This action cannot be undone.')) return;

        setActionLoading(id + 'delete');
        const previousLeaves = [...leaves];
        setLeaves(prev => prev.filter(l => l._id !== id));

        toast.promise(async () => {
            const res = await fetch(`/api/admin/leaves/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to delete leave request');
            }
            await fetchLeaves();
            return 'Leave request deleted successfully';
        }, {
            loading: 'Deleting leave request...',
            success: (data) => {
                setActionLoading(null);
                return data;
            },
            error: (err) => {
                setActionLoading(null);
                setLeaves(previousLeaves);
                return `Error: ${err.message}`;
            }
        });
    };

    // Derived Data for Summary
    const pendingCount = leaves.filter(l => l.status === 'Pending').length;
    const approvedToday = leaves.filter(l =>
        l.status === 'Approved' &&
        new Date() >= new Date(l.fromDate) &&
        new Date() <= new Date(l.toDate)
    ).length;

    // Filter Data based on Tab
    const filteredData = activeTab === 'Pending'
        ? leaves.filter(l => l.status === 'Pending')
        : leaves.filter(l => l.status !== 'Pending');

    const columns = [
        {
            header: "Employee",
            accessor: (item: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-white border border-indigo-50 flex items-center justify-center text-indigo-700 font-bold shadow-sm">
                        {item.userId?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                        <div className="font-bold text-navy-900 leading-tight">{item.userId?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 font-medium">{item.userId?.email}</div>
                    </div>
                </div>
            ),
            sortable: true
        },
        {
            header: "Leave Details",
            accessor: (item: any) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${item.leaveType === 'Sick Leave' ? 'bg-red-50 text-red-600 border border-red-100' :
                                item.leaveType === 'Casual Leave' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                    'bg-gray-50 text-gray-600 border border-gray-100'
                            }`}>
                            {item.leaveType}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                        <Calendar size={12} className="text-orange-400" />
                        {new Date(item.fromDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        <span className="text-gray-300">→</span>
                        {new Date(item.toDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        <span className="text-gray-300">•</span>
                        <span className="text-navy-700">
                            {Math.ceil((new Date(item.toDate).getTime() - new Date(item.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: "Reason",
            accessor: (item: any) => (
                <div className="max-w-xs group relative">
                    <p className="truncate text-sm text-gray-600 font-medium">{item.reason}</p>
                    {item.reason && item.reason.length > 30 && (
                        <div className="absolute hidden group-hover:block z-10 bg-black/80 text-white text-xs p-2 rounded-lg shadow-xl -top-8 left-0 min-w-[200px] pointer-events-none">
                            {item.reason}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: "Status",
            accessor: (item: any) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${item.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' :
                        item.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-yellow-50 text-yellow-700 border-yellow-100'
                    }`}>
                    {item.status === 'Approved' && <CheckCircle size={12} />}
                    {item.status === 'Rejected' && <XCircle size={12} />}
                    {item.status === 'Pending' && <Clock size={12} />}
                    {item.status}
                </span>
            ),
            sortable: true
        },
        {
            header: "Actions",
            accessor: (item: any) => {
                return (
                    <div className="flex gap-2 items-center">
                        {item.status === 'Pending' ? (
                            <>
                                <button
                                    onClick={() => handleStatusUpdate(item._id, 'Approved')}
                                    disabled={actionLoading === item._id + 'Approved'}
                                    className="p-2 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-lg transition-all shadow-sm border border-green-100 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                                    title="Approve Request"
                                >
                                    {actionLoading === item._id + 'Approved' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(item._id, 'Rejected')}
                                    disabled={actionLoading === item._id + 'Rejected'}
                                    className="p-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all shadow-sm border border-red-100 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                                    title="Reject Request"
                                >
                                    {actionLoading === item._id + 'Rejected' ? <Loader2 size={16} className="animate-spin" /> : <X size={16} strokeWidth={3} />}
                                </button>
                            </>
                        ) : (
                            <span className="text-gray-300 text-xs font-medium italic mr-2 flex items-center gap-1">
                                <CheckCircle size={10} className="text-gray-300" />
                                {item.status}
                            </span>
                        )}
                        <button
                            onClick={() => handleDeleteLeave(item._id)}
                            disabled={actionLoading === item._id + 'delete'}
                            className="p-2 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all shadow-sm border border-gray-100 hover:border-red-100 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                            title="Remove Permanently"
                        >
                            {actionLoading === item._id + 'delete' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-mesh-gradient">
            <Sidebar />
            <main className="md:ml-64 p-4 md:p-8 flex-1 overflow-x-hidden">
                <PageHeader
                    title="Leave Management"
                    subtitle="Review and manage employee time-off requests"
                    breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Leaves' }]}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-6">
                    <ModernGlassCard className="flex items-center justify-between !p-6 bg-gradient-to-br from-white to-orange-50/50">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Review</p>
                            <h2 className="text-4xl font-black text-navy-900">{pendingCount}</h2>
                            <p className="text-xs text-orange-500 font-bold mt-1 flex items-center gap-1">
                                <AlertCircle size={12} /> Action Required
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
                            <Clock size={28} />
                        </div>
                    </ModernGlassCard>

                    <ModernGlassCard className="flex items-center justify-between !p-6 bg-gradient-to-br from-white to-blue-50/50">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">On Leave Today</p>
                            <h2 className="text-4xl font-black text-navy-900">{approvedToday}</h2>
                            <p className="text-xs text-blue-500 font-bold mt-1 flex items-center gap-1">
                                <CheckCircle size={12} /> Active
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                            <Calendar size={28} />
                        </div>
                    </ModernGlassCard>
                </div>

                <ModernGlassCard className="!p-0 overflow-hidden">
                    <div className="flex border-b border-gray-100 bg-white/50 backdrop-blur-sm px-6">
                        <button
                            onClick={() => setActiveTab('Pending')}
                            className={`px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${activeTab === 'Pending'
                                ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                                : 'border-transparent text-gray-500 hover:text-navy-900 hover:bg-gray-50'
                                }`}
                        >
                            Pending
                            {pendingCount > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'Pending' ? 'bg-orange-100 text-orange-800' : 'bg-gray-200 text-gray-600'}`}>
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('History')}
                            className={`px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'History'
                                ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                                : 'border-transparent text-gray-500 hover:text-navy-900 hover:bg-gray-50'
                                }`}
                        >
                            History Log
                        </button>
                    </div>

                    <AdvancedTable
                        data={filteredData}
                        columns={columns}
                        keyField="_id"
                        isLoading={loading}
                        searchPlaceholder="Search requests..."
                    />
                </ModernGlassCard>
            </main>
        </div>
    );
}
