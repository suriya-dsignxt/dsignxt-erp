'use client';

import { useState, useEffect } from 'react';
import { SlidersHorizontal, Search, RefreshCw, Layers, ShieldAlert, Calendar, User, Activity } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ModernGlassCard from '@/components/ui/ModernGlassCard';
import PageHeader from '@/components/ui/PageHeader';
import AdvancedTable from '@/components/ui/AdvancedTable';

interface AuditLog {
    _id: string;
    actionType: string;
    entityType: string;
    entityId: string;
    performedBy: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
    performerRole: string;
    metadata: any;
    createdAt: string;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterAction, setFilterAction] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [performedBy, setPerformedBy] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [page, filterAction, startDate, endDate, performedBy]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });
            if (filterAction) params.append('actionType', filterAction);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (performedBy) params.append('performedBy', performedBy);

            const res = await fetch(`/api/admin/audit-logs?${params}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setTotalPages(data.pagination.pages);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: 'Activity',
            accessor: (log: AuditLog) => (
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${(log.actionType.includes('APPROVED') || log.actionType.includes('ACTIVATED') || log.actionType.includes('CREATED')) ? 'bg-green-50 text-green-600' :
                        (log.actionType.includes('REJECTED') || log.actionType.includes('DEACTIVATED') || log.actionType.includes('DELETED')) ? 'bg-red-50 text-red-600' :
                            (log.actionType.includes('UPDATED') || log.actionType.includes('EDITED')) ? 'bg-blue-50 text-blue-600' :
                                'bg-gray-50 text-gray-600'
                        }`}>
                        <Activity size={16} />
                    </div>
                    <div>
                        <span className="font-bold text-navy-900 text-sm block">
                            {log.actionType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                            {new Date(log.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: 'Performed By',
            accessor: (log: AuditLog) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                        {log.performedBy?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-navy-900">{log.performedBy?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{log.performedBy?.role}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Target Entity',
            accessor: (log: AuditLog) => (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100">
                    <Layers size={12} className="text-gray-400" />
                    {log.entityType}
                    <span className="text-gray-300 mx-1">|</span>
                    <span className="font-mono text-gray-500">#{log.entityId.substring(0, 6)}</span>
                </span>
            )
        },
        {
            header: 'Metadata',
            accessor: (log: AuditLog) => (
                <code className="text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100 max-w-xs block truncate font-mono">
                    {JSON.stringify(log.metadata)}
                </code>
            )
        }
    ];

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-mesh-gradient">
            <Sidebar />
            <main className="md:ml-64 p-4 md:p-8 flex-1 pb-24 text-navy-900">
                <PageHeader
                    title="System Audit Logs"
                    subtitle="Track security events and administrative actions"
                    breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Audit Logs' }]}
                    actions={
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="bg-white text-navy-900 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                        >
                            <SlidersHorizontal size={16} /> Filters
                        </button>
                    }
                />

                {showFilters && (
                    <ModernGlassCard className="mt-8 mb-6 !p-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Action Type</label>
                                <select
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900 outline-none transition-all"
                                    value={filterAction}
                                    onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                                >
                                    <option value="">All Actions</option>
                                    <option value="ATTENDANCE_APPROVED">Attendance Approved</option>
                                    <option value="ATTENDANCE_REJECTED">Attendance Rejected</option>
                                    <option value="LEAVE_APPROVED">Leave Approved</option>
                                    <option value="LEAVE_REJECTED">Leave Rejected</option>
                                    <option value="USER_ACTIVATED">User Activated</option>
                                    <option value="USER_DEACTIVATED">User Deactivated</option>
                                    <option value="Event Created">Event Created</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date Range</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900 outline-none transition-all"
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900 outline-none transition-all"
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">User</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Name or ID..."
                                        className="w-full px-3 py-2.5 pl-9 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900 outline-none transition-all"
                                        onChange={(e) => setPerformedBy(e.target.value)}
                                    />
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => fetchLogs()}
                                    className="w-full h-[42px] bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-lg transition-all shadow-lg shadow-navy-900/20 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={16} /> Apply Filters
                                </button>
                            </div>
                        </div>
                    </ModernGlassCard>
                )}

                <ModernGlassCard className="!p-0 overflow-hidden mt-6">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-sm font-bold text-navy-900">
                            <ShieldAlert size={18} className="text-gray-400" />
                            Activity History
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Page {page} of {totalPages}
                        </span>
                    </div>

                    <AdvancedTable
                        data={logs}
                        columns={columns}
                        isLoading={loading}
                        keyField="_id"
                        searchPlaceholder="Search logs..."
                        rowsPerPage={20}
                    />

                    <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50/30">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-navy-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                        >
                            Previous
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(Math.min(5, totalPages))].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${page === i + 1 ? 'bg-navy-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-navy-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                        >
                            Next
                        </button>
                    </div>
                </ModernGlassCard>
            </main>
        </div>
    );
}
