'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import {
    Plus,
    CheckSquare,
    Calendar,
    User as UserIcon,
    Flag,
    Link as LinkIcon,
    Edit2,
    Trash2,
    X,
    Filter,
    Search,
    ArrowUpRight,
    MessageSquare,
    Loader2,
    Upload,
    FileText,
    Clock
} from 'lucide-react';
import ModernGlassCard from '@/components/ui/ModernGlassCard';
import { cn } from '@/lib/utils';
import TaskComments from '@/components/TaskComments';
import { toast } from 'sonner';

interface Task {
    _id: string;
    title: string;
    description?: string;
    assignedTo: {
        _id: string;
        name: string;
        email: string;
    };
    goalId?: {
        _id: string;
        title: string;
        period: string;
    };
    priority: 'Low' | 'Medium' | 'High';
    status: 'Pending' | 'In Progress' | 'Completed';
    createdAt: string;
    dueDate?: string;
    employeeEstimatedDeadline?: string;
    attachments?: Array<{
        filename: string;
        url: string;
        uploadedAt: string;
        uploadedBy: string;
    }>;
}

interface User {
    _id: string;
    name: string;
    email: string;
}

interface Goal {
    _id: string;
    title: string;
    period: string;
}

export default function AdminTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState<string>('All');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        goalId: '',
        priority: 'Medium',
        status: 'Pending',
        startDate: '',
        endDate: '',
        estimatedHours: '',
        dueDate: '',
        employeeEstimatedDeadline: ''
    });
    const [isUploading, setIsUploading] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [tasksRes, usersRes, goalsRes] = await Promise.all([
                fetch('/api/admin/tasks'),
                fetch('/api/admin/users'),
                fetch('/api/admin/goals')
            ]);

            const tasksData = await tasksRes.json();
            const usersData = await usersRes.json();
            const goalsData = await goalsRes.json();

            setTasks(tasksData.tasks || []);
            setEmployees(usersData.users?.filter((u: any) => u.role === 'EMPLOYEE') || []);
            setGoals(goalsData.goals || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (task?: Task) => {
        if (task) {
            setEditingTask(task);
            setFormData({
                title: task.title,
                description: task.description || '',
                assignedTo: task.assignedTo?._id || '',
                goalId: task.goalId?._id || '',
                priority: task.priority,
                status: task.status,
                startDate: (task as any).startDate ? new Date((task as any).startDate).toISOString().split('T')[0] : '',
                endDate: (task as any).endDate ? new Date((task as any).endDate).toISOString().split('T')[0] : '',
                estimatedHours: (task as any).estimatedHours?.toString() || '',
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                employeeEstimatedDeadline: task.employeeEstimatedDeadline ? new Date(task.employeeEstimatedDeadline).toISOString().slice(0, 16) : ''
            });
        } else {
            setEditingTask(null);
            setFormData({
                title: '',
                description: '',
                assignedTo: '',
                goalId: '',
                priority: 'Medium',
                status: 'Pending',
                startDate: '',
                endDate: '',
                estimatedHours: '',
                dueDate: '',
                employeeEstimatedDeadline: ''
            });
        }
        setIsModalOpen(true);
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate date range on frontend
        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (start > end) {
                toast.error('Start date must be before end date');
                return;
            }
        }

        const url = editingTask ? `/api/admin/tasks/${editingTask._id}` : '/api/admin/tasks';
        const method = editingTask ? 'PATCH' : 'POST';

        // Clean up empty fields before sending
        const payload: any = { ...formData };
        if (!payload.goalId) delete payload.goalId;
        if (!payload.startDate) delete payload.startDate;
        if (!payload.endDate) delete payload.endDate;
        if (!payload.estimatedHours) delete payload.estimatedHours;

        // Convert estimatedHours to number if present
        if (payload.estimatedHours) {
            payload.estimatedHours = parseFloat(payload.estimatedHours);
        }

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchData();
                toast.success(editingTask ? 'Task updated successfully' : 'Task assigned successfully');
            } else {
                const error = await res.json();
                toast.error(error.message || 'Something went wrong');
            }
        } catch (error) {
            console.error('Error saving task:', error);
            toast.error('Failed to save task');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const res = await fetch(`/api/admin/tasks/${id}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const filteredTasks = tasks.filter(task => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            task.title.toLowerCase().includes(query) ||
            task.assignedTo.name.toLowerCase().includes(query);
        const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;

        return matchesSearch && matchesPriority;
    });

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'High': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'Medium': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
            case 'Low': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            default: return 'text-white/40 bg-white/5 border-white/10';
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-mesh-gradient">
            <Sidebar />
            <main className="md:ml-64 p-4 md:p-8 flex-1 overflow-x-hidden pb-12">
                <div className="space-y-8">
                    {/* Header section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-navy-900 tracking-tight">
                                Task Management
                            </h1>
                            <p className="text-gray-500 font-medium mt-1">Assign, track, and manage employee tasks</p>
                        </div>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-navy-900 hover:bg-navy-800 text-white rounded-xl shadow-lg shadow-navy-900/20 transition-all duration-300 group"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                            <span>Assign New Task</span>
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-navy-900 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search tasks or assignees..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-navy-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-900/10 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                            {['All', 'High', 'Medium', 'Low'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setFilterPriority(p)}
                                    className={cn(
                                        "px-6 py-4 rounded-2xl border text-sm font-semibold transition-all whitespace-nowrap shadow-sm",
                                        filterPriority === p
                                            ? "bg-navy-900 text-white border-navy-900"
                                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-navy-900" />
                            <p>Loading tasks...</p>
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl bg-white/50">
                            <CheckSquare className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-xl font-medium text-navy-900">No tasks found</p>
                            <p className="text-sm">Try adjusting filters or assign a new task.</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50">
                                            <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Task Details</th>
                                            <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Assignee</th>
                                            <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Priority</th>
                                            <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Due Date</th>
                                            <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Goal Context</th>
                                            <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Attachments</th>
                                            <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredTasks.map((task) => {
                                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';
                                            return (
                                                <tr key={task._id} className={cn("hover:bg-gray-50/80 transition-colors group", isOverdue ? "bg-red-50/50" : "")}>
                                                    <td className="px-6 py-6">
                                                        <div className="flex flex-col">
                                                            <span className={cn("font-bold transition-colors", isOverdue ? "text-red-700" : "text-navy-900 group-hover:text-blue-600")}>{task.title}</span>
                                                            <span className="text-xs text-gray-500 line-clamp-1 mt-1">{task.description || 'No description'}</span>
                                                            {isOverdue && <span className="text-[10px] font-bold text-red-600 uppercase mt-1 flex items-center gap-1"><Flag size={10} /> Overdue</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 text-gray-600">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-navy-900/20">
                                                                {task.assignedTo.name.charAt(0)}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold text-navy-900">{task.assignedTo.name}</span>
                                                                <span className="text-[10px] text-gray-400">{task.assignedTo.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <span className={cn("px-3 py-1 rounded-full border text-xs font-bold", getPriorityColor(task.priority))}>
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-6 text-sm font-medium">
                                                        {task.dueDate ? (
                                                            <span className={cn("flex items-center gap-1.5", isOverdue ? "text-red-600 font-bold" : "text-gray-600")}>
                                                                <Calendar size={14} className={isOverdue ? "text-red-500" : "text-gray-400"} />
                                                                {new Date(task.dueDate).toLocaleDateString()}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 italic text-xs">No Deadline</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        {task.goalId ? (
                                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 w-fit">
                                                                <LinkIcon className="w-3 h-3" />
                                                                <span className="text-xs font-medium truncate max-w-[120px]">{task.goalId.title}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">No Goal Linked</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <span className={cn(
                                                            "text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-md",
                                                            task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                                task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                                                        )}>
                                                            {task.status}
                                                        </span>
                                                        {task.employeeEstimatedDeadline && (
                                                            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-blue-600">
                                                                <Clock className="w-3 h-3" />
                                                                Est: {new Date(task.employeeEstimatedDeadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        {task.attachments && task.attachments.length > 0 ? (
                                                            <div className="flex -space-x-2">
                                                                {task.attachments.slice(0, 3).map((att, i) => (
                                                                    <div key={i} title={att.filename} className="w-7 h-7 rounded-lg bg-gray-100 border border-white flex items-center justify-center text-gray-500 shadow-sm">
                                                                        <FileText size={14} />
                                                                    </div>
                                                                ))}
                                                                {task.attachments.length > 3 && (
                                                                    <div className="w-7 h-7 rounded-lg bg-navy-900 text-white text-[10px] flex items-center justify-center font-bold border border-white shadow-sm">
                                                                        +{task.attachments.length - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-300">None</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-6 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleOpenModal(task)}
                                                                className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-all"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(task._id)}
                                                                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="grid grid-cols-1 md:hidden gap-4">
                                {filteredTasks.map((task) => (
                                    <ModernGlassCard key={task._id} className="p-5 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex justify-between w-full gap-2">
                                                    <h3 className="font-bold text-navy-900 line-clamp-2">{task.title}</h3>
                                                    {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed' && (
                                                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full whitespace-nowrap">Overdue</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={cn("px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase", getPriorityColor(task.priority))}>
                                                        {task.priority} Priority
                                                    </span>
                                                    {task.dueDate && (
                                                        <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                                            <Calendar size={10} />
                                                            {new Date(task.dueDate).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleOpenModal(task)} className="p-2 bg-gray-100 rounded-lg text-gray-500"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(task._id)} className="p-2 bg-red-50 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>

                                        {task.goalId && (
                                            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                                                <LinkIcon className="w-3 h-3 text-blue-500" />
                                                <span className="text-xs text-blue-700 line-clamp-1">{task.goalId.title}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between py-2 border-t border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-navy-900 flex items-center justify-center text-[10px] font-bold text-white">
                                                    {task.assignedTo.name.charAt(0)}
                                                </div>
                                                <span className="text-xs text-gray-600">{task.assignedTo.name}</span>
                                            </div>
                                            <span className={cn(
                                                "text-xs font-bold uppercase",
                                                task.status === 'Completed' ? 'text-emerald-600' :
                                                    task.status === 'In Progress' ? 'text-blue-600' : 'text-gray-400'
                                            )}>{task.status}</span>
                                        </div>
                                    </ModernGlassCard>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Creation/Editing Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
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
                            className="bg-white w-full max-w-lg max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col my-8"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                                <h2 className="text-xl font-black text-navy-900 flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                        <CheckSquare className="w-5 h-5" />
                                    </div>
                                    {editingTask ? 'Edit Task' : 'Assign New Task'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-navy-900 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1">
                                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-navy-900">Task Title</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-300 font-medium"
                                            placeholder="e.g., Q1 Financial Report"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-navy-900">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
                                        <textarea
                                            rows={3}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-300 resize-none resize-y"
                                            placeholder="Add specific instructions, deadlines, or context..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-navy-900">Assign To</label>
                                            <div className="relative">
                                                <select
                                                    required
                                                    value={formData.assignedTo}
                                                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none cursor-pointer hover:bg-gray-50"
                                                >
                                                    <option value="" disabled>Select employee</option>
                                                    {employees.map(emp => (
                                                        <option key={emp._id} value={emp._id}>
                                                            {emp.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-navy-900">Priority Level</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.priority}
                                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none cursor-pointer hover:bg-gray-50"
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="High">High</option>
                                                </select>
                                                <Flag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        {/* This is the div that needs to be closed */}
                                    </div>

                                    {/* Timeline Section */}
                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-navy-900" />
                                            <label className="text-sm font-bold text-navy-900">Timeline & Effort</label>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Start Date</label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        value={formData.startDate}
                                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-300 font-medium text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">End Date <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        required
                                                        value={formData.endDate}
                                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-300 font-medium text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Estimated Hours</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    value={formData.estimatedHours}
                                                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-300 font-medium"
                                                    placeholder="e.g., 8"
                                                />
                                            </div>
                                            {formData.startDate && formData.endDate && new Date(formData.startDate) <= new Date(formData.endDate) && (
                                                <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Duration: {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))} day(s)
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-navy-900 uppercase tracking-wider">Attachments</label>
                                            <label className="cursor-pointer">
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file && editingTask) {
                                                            if (file.size > 2 * 1024 * 1024) {
                                                                toast.error('File too large (Max 2MB)');
                                                                return;
                                                            }
                                                            setIsUploading(editingTask._id);
                                                            const formData = new FormData();
                                                            formData.append('file', file);
                                                            try {
                                                                const upRes = await fetch('/api/upload', { method: 'POST', body: formData });
                                                                const upData = await upRes.json();
                                                                if (upRes.ok) {
                                                                    const attachment = {
                                                                        filename: upData.filename,
                                                                        url: upData.url,
                                                                        uploadedAt: new Date().toISOString(),
                                                                        uploadedBy: 'Admin'
                                                                    };
                                                                    await fetch(`/api/admin/tasks/${editingTask._id}`, {
                                                                        method: 'PATCH',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ attachments: [...(editingTask.attachments || []), attachment] })
                                                                    });
                                                                    fetchData();
                                                                    toast.success('File uploaded');
                                                                }
                                                            } catch (err) { toast.error('Upload failed'); }
                                                            finally { setIsUploading(null); }
                                                        }
                                                    }}
                                                />
                                                <span className="text-xs text-blue-600 font-bold flex items-center gap-1">
                                                    {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                                    Add Attachment
                                                </span>
                                            </label>
                                        </div>
                                        {editingTask?.attachments && editingTask.attachments.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-2">
                                                {editingTask.attachments.map((att, i) => (
                                                    <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-3 hover:bg-gray-100 transition-all group">
                                                        <div className="p-2 bg-white rounded-lg text-gray-400 group-hover:text-blue-500">
                                                            <FileText size={16} />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-xs font-bold text-navy-900 truncate">{att.filename}</span>
                                                            <span className="text-[10px] text-gray-400">by {att.uploadedBy}</span>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200 text-center">No attachments yet</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-navy-900">Link to Strategic Goal <span className="text-gray-400 font-normal">(Optional)</span></label>
                                        <div className="relative">
                                            <select
                                                value={formData.goalId}
                                                onChange={(e) => setFormData({ ...formData, goalId: e.target.value })}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none cursor-pointer hover:bg-gray-50"
                                            >
                                                <option value="">No Linked Goal</option>
                                                {goals.map(goal => (
                                                    <option key={goal._id} value={goal._id}>
                                                        {goal.period}: {goal.title}
                                                    </option>
                                                ))}
                                            </select>
                                            <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 font-semibold transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="flex-1 px-4 py-3 rounded-xl bg-navy-900 text-white font-bold hover:bg-navy-800 transition-all shadow-lg shadow-navy-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" /> : (editingTask ? 'Update Task' : 'Assign Task')}
                                        </button>
                                    </div>
                                </form>

                                {editingTask && (
                                    <div className="mt-8 pt-8 border-t border-gray-100">
                                        <div className="flex items-center gap-2 mb-4">
                                            <MessageSquare className="w-4 h-4 text-navy-900" />
                                            <h3 className="font-bold text-navy-900">Discussion</h3>
                                        </div>
                                        <div className="h-[400px]">
                                            <TaskComments taskId={editingTask._id} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                    </div>
                )
                }
            </AnimatePresence >
        </div >
    );
}
