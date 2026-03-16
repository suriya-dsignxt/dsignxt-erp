'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ModernGlassCard from '@/components/ui/ModernGlassCard';
import PageHeader from '@/components/ui/PageHeader';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, X, User, CheckCircle, XCircle, Clock, Calendar as CalendarIcon, Filter, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAttendance() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [dayRecords, setDayRecords] = useState<any[]>([]);
    const [actionId, setActionId] = useState<string | null>(null);

    useEffect(() => {
        fetchAttendance();
    }, [currentMonth]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/attendance?t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.attendance) {
                setAttendanceData(data.attendance);
            }
        } catch (e) {
            console.error("Fetch attendance failed", e);
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    // Calendar Generation Logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const getDayStats = (date: Date) => {
        const records = attendanceData.filter(a => isSameDay(new Date(a.date), date));
        const present = records.filter(a => a.status === 'Present' || a.status === 'Approved').length;
        const absent = records.filter(a => a.status === 'Absent' || a.status === 'Rejected').length;
        const pending = records.filter(a => a.status === 'Pending').length;
        return { present, absent, pending, records };
    };

    const handleDateClick = (date: Date) => {
        const stats = getDayStats(date);
        setDayRecords(stats.records);
        setSelectedDate(date);
    };

    const handleUpdateStatus = async (id: string, action: 'approve' | 'reject') => {
        setActionId(id + action); // Set loading state for this specific button
        const updatedStatus = action === 'approve' ? 'Approved' : 'Rejected';
        
        // Optimistic UI Update
        const previousRecords = [...dayRecords];
        const previousAttendance = [...attendanceData];
        
        setDayRecords(prev => prev.map(r => r._id === id ? { ...r, status: updatedStatus } : r));
        setAttendanceData(prev => prev.map(r => r._id === id ? { ...r, status: updatedStatus } : r));

        toast.promise(async () => {
            const res = await fetch(`/api/admin/attendance/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: updatedStatus })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update status');
            }
            await fetchAttendance();
            return `Attendance ${action}d successfully`;
        }, {
            loading: `Processing ${action}...`,
            success: (data) => {
                setActionId(null);
                return data;
            },
            error: (err) => {
                setActionId(null);
                setDayRecords(previousRecords);
                setAttendanceData(previousAttendance);
                return `Error: ${err.message}`;
            },
        });
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-mesh-gradient">
            <Sidebar />
            <main className="md:ml-64 p-4 md:p-8 flex-1 overflow-x-hidden relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-navy-900 tracking-tight">Attendance</h1>
                        <p className="text-gray-500 font-medium mt-1">Monitor daily check-ins and absences</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/50 backdrop-blur-md p-1.5 rounded-xl shadow-sm border border-white/60">
                        <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg transition-all text-navy-700 hover:shadow-sm">
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="text-lg font-bold text-navy-900 min-w-[160px] text-center">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h2>
                        <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg transition-all text-navy-700 hover:shadow-sm">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <ModernGlassCard className="!p-0 overflow-hidden shadow-xl border-t border-white/50">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50 backdrop-blur-sm">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 auto-rows-fr bg-white/30 backdrop-blur-md min-h-[600px]">
                        {loading ? (
                            <div className="col-span-7 flex flex-col justify-center items-center h-full text-gray-400">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4"></div>
                                <p className="text-sm font-medium">Loading calendar data...</p>
                            </div>
                        ) : calendarDays.map((day, dayIdx) => {
                            const stats = getDayStats(day);
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isToday = isSameDay(day, new Date());
                            const hasData = stats.present > 0 || stats.absent > 0 || stats.pending > 0;
                            const isSelected = selectedDate && isSameDay(day, selectedDate);

                            return (
                                <div
                                    key={day.toString()}
                                    onClick={() => handleDateClick(day)}
                                    className={`
                                        min-h-[80px] md:min-h-[100px] border-b border-r border-gray-50/50 p-1 md:p-2 transition-all cursor-pointer group relative
                                        ${!isCurrentMonth ? 'bg-gray-50/30 text-gray-300' : 'bg-transparent text-navy-900'}
                                        ${isToday ? 'bg-orange-50/30' : ''}
                                        ${isSelected ? 'bg-navy-900/5 ring-inset ring-2 ring-navy-900/10 z-10' : 'hover:bg-white/40'}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`
                                            text-xs md:text-sm font-bold w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-lg transition-all
                                            ${isToday ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110' : ''}
                                            ${isSelected && !isToday ? 'bg-navy-900 text-white shadow-md' : ''}
                                        `}>
                                            {format(day, 'd')}
                                        </span>
                                        {stats.pending > 0 && (
                                            <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse shadow-sm ring-2 ring-white" title="Pending Approvals"></span>
                                        )}
                                    </div>

                                    {hasData && (
                                        <div className="space-y-1.5 mt-2">
                                            {stats.present > 0 && (
                                                <div className="flex items-center text-[10px] text-green-700 bg-green-100/50 px-2 py-1 rounded-md border border-green-100 font-bold backdrop-blur-sm group-hover:scale-105 transition-transform">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></div>
                                                    <span className="mr-1">{stats.present}</span>
                                                    <span className="hidden xl:inline opacity-70">Present</span>
                                                </div>
                                            )}
                                            {stats.absent > 0 && (
                                                <div className="flex items-center text-[10px] text-red-700 bg-red-100/50 px-2 py-1 rounded-md border border-red-100 font-bold backdrop-blur-sm group-hover:scale-105 transition-transform">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></div>
                                                    <span className="mr-1">{stats.absent}</span>
                                                    <span className="hidden xl:inline opacity-70">Absent</span>
                                                </div>
                                            )}
                                            {stats.pending > 0 && (
                                                <div className="flex items-center text-[10px] text-orange-700 bg-orange-100/50 px-2 py-1 rounded-md border border-orange-100 font-bold backdrop-blur-sm group-hover:scale-105 transition-transform">
                                                    <Clock size={10} className="mr-1.5" />
                                                    <span className="mr-1">{stats.pending}</span>
                                                    <span className="hidden xl:inline opacity-70">Pending</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </ModernGlassCard>

                {/* Glass Slide-over Panel */}
                {selectedDate && (
                    <div
                        className="fixed inset-0 z-50 flex justify-end bg-navy-900/20 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => setSelectedDate(null)}
                    >
                        <div
                            className="bg-white/90 h-full w-full md:w-[480px] shadow-2xl p-0 overflow-hidden flex flex-col border-l border-white/50 backdrop-filter backdrop-blur-xl animate-slide-in-right"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Panel Header */}
                            <div className="p-8 pb-4 border-b border-gray-100 flex justify-between items-start bg-gradient-to-b from-white to-gray-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-navy-900 tracking-tight">{format(selectedDate, 'MMMM d, yyyy')}</h2>
                                    <div className="flex items-center gap-2 mt-1 text-gray-500 font-medium text-sm">
                                        <CalendarIcon size={14} className="text-orange-500" />
                                        <span>Daily Attendance Report</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedDate(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-navy-900"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Panel Content */}
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                                {dayRecords.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 opacity-60">
                                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                            <Filter size={32} />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-600">No Records Found</h3>
                                        <p className="max-w-[200px]">There are no attendance logs for this specific date.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {dayRecords.map((record: any, idx) => (
                                            <div
                                                key={record._id}
                                                className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:border-orange-100 hover:-translate-y-0.5"
                                                style={{ animationDelay: `${idx * 0.05}s` }}
                                            >
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-white rounded-2xl flex items-center justify-center text-indigo-700 font-black text-lg border border-indigo-100 shadow-sm">
                                                        {record.userId?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-navy-900 leading-tight">{record.userId?.name || 'Unknown User'}</h3>
                                                        <p className="text-xs text-gray-500 font-medium">{record.userId?.email}</p>
                                                    </div>
                                                    <span className={`ml-auto px-3 py-1 text-xs font-bold rounded-full border ${record.status === 'Present' || record.status === 'Approved'
                                                        ? 'bg-green-100 text-green-700 border-green-200'
                                                        : record.status === 'Absent'
                                                            ? 'bg-red-100 text-red-700 border-red-200'
                                                            : 'bg-orange-100 text-orange-700 border-orange-200'
                                                        }`}>
                                                        {record.status}
                                                    </span>
                                                </div>

                                                <div className="flex rounded-xl bg-gray-50 border border-gray-100 overflow-hidden mb-4">
                                                    <div className="flex-1 p-3 text-center border-r border-gray-100 hover:bg-white transition-colors">
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check In</div>
                                                        <div className="text-navy-900 font-mono font-bold">
                                                            {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 p-3 text-center hover:bg-white transition-colors">
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check Out</div>
                                                        <div className="text-navy-900 font-mono font-bold">
                                                            {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {record.status === 'Pending' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleUpdateStatus(record._id, 'approve');
                                                            }}
                                                            disabled={actionId === record._id + 'approve'}
                                                            className="flex-1 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-bold text-sm transition-colors flex items-center justify-center gap-2 border border-green-200 disabled:opacity-50"
                                                        >
                                                            {actionId === record._id + 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} 
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleUpdateStatus(record._id, 'reject');
                                                            }}
                                                            disabled={actionId === record._id + 'reject'}
                                                            className="flex-1 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm transition-colors flex items-center justify-center gap-2 border border-red-200 disabled:opacity-50"
                                                        >
                                                            {actionId === record._id + 'reject' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <style jsx global>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}
