'use client';

import { useEffect, useState } from 'react';
import ModernGlassCard from '@/components/ui/ModernGlassCard';
import { Clock, Activity as ActivityIcon } from 'lucide-react';

interface Activity {
    id: string;
    action: string;
    message: string;
    icon: string;
    color: string;
    performedBy: string;
    timestamp: Date;
    timeAgo: string;
}

export default function RecentActivityFeed() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();
        const interval = setInterval(fetchActivities, 30 * 1000); // 30s
        return () => clearInterval(interval);
    }, []);

    const fetchActivities = async () => {
        try {
            const res = await fetch('/api/admin/recent-activity');
            if (res.ok) {
                const data = await res.json();
                setActivities(data.activities || []);
            }
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const getColorClass = (color: string) => {
        const colors: Record<string, string> = {
            green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
            blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
            yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
            red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
            purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
            orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
            gray: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800'
        };
        return colors[color] || colors.gray;
    };

    if (loading) {
        return (
            <ModernGlassCard>
                <div className="h-6 w-1/3 bg-gray-200 rounded mb-4 animate-pulse"></div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </ModernGlassCard>
        );
    }

    if (activities.length === 0) {
        return (
            <ModernGlassCard>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <ActivityIcon size={18} />
                        </div>
                        <h3 className="text-lg font-bold text-navy-900 dark:text-white">Recent Activity</h3>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <ActivityIcon className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium text-gray-500">No recent activity</p>
                    <p className="text-xs text-gray-400 mt-1">Activity will appear here once actions are performed</p>
                </div>
            </ModernGlassCard>
        );
    }

    return (
        <ModernGlassCard className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                        <ActivityIcon size={18} />
                    </div>
                    <h3 className="text-lg font-bold text-navy-900 dark:text-white">Recent Activity</h3>
                </div>
                <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full border border-green-100 dark:border-green-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Live
                </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 max-h-[500px]">
                {activities.map((activity, index) => (
                    <div key={activity.id} className="relative flex gap-4 group">
                        {/* Timeline Line */}
                        {index !== activities.length - 1 && (
                            <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors"></div>
                        )}

                        <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-xl ${getColorClass(activity.color)} border flex items-center justify-center shadow-sm transition-transform group-hover:scale-110`}>
                            <span className="text-sm">{activity.icon}</span>
                        </div>

                        <div className="flex-1 min-w-0 pb-1">
                            <p className="text-sm text-gray-900 dark:text-gray-100 font-medium leading-snug">
                                {activity.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <Clock size={10} className="text-gray-400 dark:text-gray-500" />
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{activity.timeAgo}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
            `}</style>
        </ModernGlassCard>
    );
}
