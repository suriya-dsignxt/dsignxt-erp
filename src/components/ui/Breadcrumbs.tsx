'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);

    // Map segment names to readable labels if needed
    const getLabel = (segment: string) => {
        // Handle dynamic IDs (simple check for length/digits) or specific keywords
        if (segment.match(/^[0-9a-fA-F]{24}$/)) return 'Detail'; // Mongoose ID
        if (segment === 'admin') return 'Admin Portal';
        return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    };

    return (
        <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <Link
                href={segments.includes('admin') ? '/admin/dashboard' : '/employee/dashboard'}
                className="hover:text-navy-900 dark:hover:text-white transition-colors flex items-center gap-1"
            >
                <Home size={14} />
            </Link>

            {segments.map((segment, index) => {
                const isLast = index === segments.length - 1;
                // Don't link the last segment
                const href = `/${segments.slice(0, index + 1).join('/')}`;

                return (
                    <div key={href} className="flex items-center space-x-2">
                        <ChevronRight size={14} className="text-gray-300" />
                        {isLast ? (
                            <span className="font-semibold text-navy-900 dark:text-white">
                                {getLabel(segment)}
                            </span>
                        ) : (
                            <Link
                                href={href}
                                className="hover:text-navy-900 dark:hover:text-white transition-colors hover:underline decoration-navy-900/20 dark:decoration-white/20 underline-offset-4"
                            >
                                {getLabel(segment)}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
