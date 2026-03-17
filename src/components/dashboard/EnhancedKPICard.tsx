'use client';

import Link from 'next/link';
import ModernGlassCard from '@/components/ui/ModernGlassCard';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface EnhancedKPICardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    trend?: number; // Percentage change
    link?: string; // Make card clickable
    badge?: number; // Show badge for pending items
    loading?: boolean;
    delay?: number;
}

export default function EnhancedKPICard({
    title,
    value,
    icon,
    color,
    trend,
    link,
    badge,
    loading = false,
    delay = 0
}: EnhancedKPICardProps) {
    const getTrendIcon = () => {
        if (!trend || trend === 0) return <Minus className="w-3 h-3" />;
        return trend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
    };

    const getTrendColor = () => {
        if (!trend || trend === 0) return 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800';
        return trend > 0 ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800';
    };

    const content = (
        <div className="relative h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-opacity-20 bg-').replace('bg-', 'bg-opacity-10 ')} backdrop-blur-md shadow-sm`}>
                    <div className={color.split(' ')[1]}>{icon}</div>
                </div>
                {trend !== undefined && !loading && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold ${getTrendColor()}`}>
                        {getTrendIcon()}
                        <span>{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{title}</h3>
                {loading ? (
                    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                    <p className="text-3xl font-black text-navy-900 dark:text-white tracking-tight">{value}</p>
                )}
            </div>

            {/* Badge for pending items */}
            {badge !== undefined && badge > 0 && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-lg shadow-red-500/30 border-2 border-white dark:border-navy-900 animate-pulse">
                    {badge > 99 ? '99+' : badge}
                </div>
            )}
        </div>
    );

    return (
        <ModernGlassCard
            className="h-full transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-1"
            hoverEffect={!!link}
            delay={delay}
        >
            {link ? (
                <Link href={link} className="block h-full">
                    {content}
                </Link>
            ) : content}
        </ModernGlassCard>
    );
}
