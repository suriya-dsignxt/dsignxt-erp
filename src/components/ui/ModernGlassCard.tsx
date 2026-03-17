'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ModernGlassCardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    subtitle?: string;
    hoverEffect?: boolean;
    headerAction?: React.ReactNode;
    delay?: number;
}

export default function ModernGlassCard({
    children,
    className,
    title,
    subtitle,
    hoverEffect = false,
    headerAction,
    delay = 0
}: ModernGlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: "easeOut" }}
            className={cn(
                "glass-panel rounded-2xl p-4 md:p-6 relative overflow-hidden flex flex-col",
                hoverEffect && "glass-card-hover cursor-default",
                className
            )}
        >
            {/* Subtle Gradient Blob for depth (optional) */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

            {(title || headerAction) && (
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        {title && <h3 className="text-lg font-bold text-navy-900 dark:text-white tracking-tight">{title}</h3>}
                        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">{subtitle}</p>}
                    </div>
                    {headerAction && <div>{headerAction}</div>}
                </div>
            )}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
}
