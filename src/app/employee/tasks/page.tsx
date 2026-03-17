'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import {
    CheckCircle2,
    Circle,
    PlayCircle,
    Link as LinkIcon,
    Loader2,
    Calendar,
    Target,
    MessageSquare,
    X,
    Upload,
    FileText,
    History
} from 'lucide-react';
import ModernGlassCard from '@/components/ui/ModernGlassCard';
import { cn } from '@/lib/utils';
import TaskComments from '@/components/TaskComments';
import { toast } from 'sonner';

// Debounce helper for progress updates
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

interface Task {
    _id: string;
    title: string;
    description?: string;
    goalId?: {
        _id: string;
        title: string;
    };
    priority: 'Low' | 'Medium' | 'High';
    status: 'Pending' | 'In Progress' | 'Completed';
    progressPercentage: number;
    completedAt?: string;
    createdAt: string;
    dueDate?: string;
    employeeEstimatedDeadline?: string;
    attachments: Array<{
        filename: string;
        url: string;
        uploadedAt: string;
        uploadedBy: string;
    }>;
}

export default function EmployeeTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string>(''); // For highlighting own comments
    const [isUploading, setIsUploading] = useState<string | null>(null);

    useEffect(() => {
        fetchTasks();
        // Fetch current user info for comments
        fetch('/api/auth/me').then(res => res.json()).then(data => {
            if (data.user) setCurrentUserEmail(data.user.email);
        }).catch(err => console.error(err));
    }, []);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/employee/tasks');
            const data = await res.json();
            setTasks(data.tasks || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateTask = async (taskId: string, payload: any) => {
        setUpdatingIds(prev => new Set(prev).add(taskId));
        try {
            const res = await fetch(`/api/employee/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (res.ok) {
                setTasks(prev => prev.map(t => t._id === taskId ? data.task : t));
                if (payload.employeeEstimatedDeadline !== undefined) {
                    toast.success('Commitment deadline updated');
                }
            } else {
                toast.error(data.message || 'Update failed');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error('An error occurred during update');
        } finally {
            setUpdatingIds(prev => {
                const next = new Set(prev);
                next.delete(taskId);
                return next;
            });
        }
    };

    const handleComplete = async (taskId: string) => {
        if (!confirm('Mark this task as fully complete?')) return;

        setUpdatingIds(prev => new Set(prev).add(taskId));
        try {
            const res = await fetch(`/api/employee/tasks/${taskId}/complete`, { method: 'PATCH' });
            if (res.ok) {
                const data = await res.json();
                setTasks(prev => prev.map(t => t._id === taskId ? data.task : t));
            }
        } catch (error) {
            console.error('Error completing task:', error);
        } finally {
            setUpdatingIds(prev => {
                const next = new Set(prev);
                next.delete(taskId);
                return next;
            });
        }
    };

    const handleFileUpload = async (taskId: string, file: File) => {
        if (file.size > 2 * 1024 * 1024) {
            alert('File too large (Max 2MB)');
            return;
        }

        setIsUploading(taskId);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                const attachment = {
                    filename: data.filename,
                    url: data.url,
                    uploadedAt: new Date().toISOString(),
                    uploadedBy: currentUserEmail
                };

                await updateTask(taskId, { attachment });
                toast.success('File uploaded and attached to task');
            } else {
                toast.error(data.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('An error occurred during upload');
        } finally {
            setIsUploading(null);
        }
    };

    const handleOpenModal = (task: Task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'High': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'Medium': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
            case 'Low': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            default: return 'text-white/40 bg-white/5 border-white/10';
        }
    };

    const activeTasks = tasks.filter(t => t.status !== 'Completed');
    const completedTasks = tasks.filter(t => t.status === 'Completed');

    return (<div className="flex flex-col md:flex-row min-h-screen bg-mesh-gradient">
        <Sidebar />
        <main className="md:ml-64 p-4 md:p-8 flex-1 overflow-x-hidden pb-12">
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-black text-navy-900 tracking-tight">
                        My Priorities
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Track progress and deliver results</p>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-navy-900" />
                        <p>Loading your tasks...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl bg-white/50">
                        <CheckCircle2 className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-xl font-medium text-navy-900">All caught up!</p>
                        <p className="text-sm">You have no pending tasks right now.</p>
                    </div>
                ) : (
                    <div className="space-y-10">

                        {/* Active Tasks Grid */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-navy-900">Active Tasks</h2>
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold border border-blue-200">
                                    {activeTasks.length}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {activeTasks.map((task) => (
                                        <motion.div
                                            key={task._id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                        >
                                            <ModernGlassCard className={cn(
                                                "h-full flex flex-col justify-between relative overflow-hidden group border-l-4 bg-white/60",
                                                task.priority === 'High' ? 'border-l-red-500' :
                                                    task.priority === 'Medium' ? 'border-l-orange-500' : 'border-l-blue-500'
                                            )}>
                                                {/* Status Badge & Overdue Indicator */}
                                                <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                                                        task.status === 'In Progress' ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                                                    )}>
                                                        {task.status}
                                                    </span>
                                                    {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed' && (
                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-red-100 text-red-600 border-red-200 animate-pulse">
                                                            Overdue
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="p-6 space-y-4">
                                                    <div className="space-y-2 pr-12">
                                                        <h3 className="font-bold text-lg text-navy-900 group-hover:text-blue-600 transition-colors">
                                                            {task.title}
                                                        </h3>
                                                        {task.description && (
                                                            <p className="text-sm text-gray-500 line-clamp-2">
                                                                {task.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        {task.goalId && (
                                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 w-fit">
                                                                <Target className="w-3 h-3 text-blue-500" />
                                                                <span className="text-xs text-blue-700 font-medium line-clamp-1">{task.goalId.title}</span>
                                                            </div>
                                                        )}
                                                        {task.dueDate && (
                                                            <div className={cn(
                                                                "flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit",
                                                                new Date(task.dueDate) < new Date() && task.status !== 'Completed'
                                                                    ? "bg-red-50 border-red-100 text-red-700"
                                                                    : "bg-gray-50 border-gray-100 text-gray-600"
                                                            )}>
                                                                <Calendar className="w-3 h-3" />
                                                                <span className="text-xs font-medium">
                                                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="pt-4 space-y-4">
                                                        {/* Deadline Declaration */}
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between items-center">
                                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">My Commitment Deadline</label>
                                                                {task.employeeEstimatedDeadline && (
                                                                    <span className="text-[10px] text-blue-600 font-bold">Set</span>
                                                                )}
                                                            </div>
                                                            <input
                                                                type="datetime-local"
                                                                value={task.employeeEstimatedDeadline ? new Date(task.employeeEstimatedDeadline).toISOString().slice(0, 16) : ''}
                                                                onChange={(e) => updateTask(task._id, { employeeEstimatedDeadline: e.target.value })}
                                                                className="w-full bg-white/50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                            />
                                                        </div>

                                                        {/* Attachments Section */}
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Attachments</label>
                                                                <label className="cursor-pointer group">
                                                                    <input
                                                                        type="file"
                                                                        className="hidden"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) handleFileUpload(task._id, file);
                                                                        }}
                                                                        disabled={isUploading === task._id}
                                                                    />
                                                                    <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold hover:text-blue-700">
                                                                        {isUploading === task._id ? (
                                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                                        ) : (
                                                                            <Upload className="w-3 h-3" />
                                                                        )}
                                                                        Add File
                                                                    </div>
                                                                </label>
                                                            </div>
                                                            
                                                            {task.attachments && task.attachments.length > 0 ? (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {task.attachments.slice(-3).map((att, idx) => (
                                                                        <a
                                                                            key={idx}
                                                                            href={att.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-md border border-gray-200 text-[10px] text-gray-600 hover:bg-gray-200 transition-colors max-w-[150px]"
                                                                        >
                                                                            <FileText className="w-3 h-3 flex-shrink-0" />
                                                                            <span className="truncate">{att.filename}</span>
                                                                        </a>
                                                                    ))}
                                                                    {task.attachments.length > 3 && (
                                                                        <span className="text-[10px] text-gray-400">+{task.attachments.length - 3} more</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <p className="text-[10px] text-gray-400 italic">No files uploaded</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50/50">
                                                    {task.status === 'Pending' && (
                                                        <button
                                                            onClick={() => updateTask(task._id, { status: 'In Progress', progressPercentage: 10 })}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-sm font-semibold text-gray-600 border border-gray-200 transition-all shadow-sm"
                                                        >
                                                            <PlayCircle className="w-4 h-4" /> Start
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleComplete(task._id)}
                                                        disabled={updatingIds.has(task._id)}
                                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 text-sm font-bold text-emerald-700 transition-all shadow-sm"
                                                    >
                                                        {updatingIds.has(task._id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                        Mark Complete
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(task)}
                                                        className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-navy-900 border border-gray-200 transition-all"
                                                        title="Discussion"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </ModernGlassCard>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Completed Section (Collapsed/Secondary) */}
                        {completedTasks.length > 0 && (
                            <div className="space-y-4 pt-8 border-t border-gray-200">
                                <h2 className="text-lg font-bold text-gray-400 uppercase tracking-wider">Completed Recently</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {completedTasks.map((task) => (
                                        <div key={task._id} className="p-4 rounded-xl bg-white border border-gray-200 flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity shadow-sm">
                                            <div className="p-2 rounded-full bg-emerald-100 text-emerald-600">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-navy-900 line-clamp-1">{task.title}</p>
                                                <p className="text-xs text-gray-400">
                                                    Verified Complete • {new Date(task.completedAt || new Date()).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Task Details & Discussion Modal */}
            <AnimatePresence>
                {isModalOpen && selectedTask && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative z-10"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h2 className="text-xl font-black text-navy-900 line-clamp-1">
                                        {selectedTask.title}
                                    </h2>
                                    <p className="text-xs text-gray-500 font-medium">Task Discussion</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-navy-900 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm text-gray-600 leading-relaxed">
                                    {selectedTask.description || 'No description provided.'}
                                </div>

                                <div className="h-[350px]">
                                    <TaskComments taskId={selectedTask._id} currentUserEmail={currentUserEmail} />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    </div>
    );
}
