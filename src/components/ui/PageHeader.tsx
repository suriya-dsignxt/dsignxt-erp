'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: BreadcrumbItem[];
    actions?: React.ReactNode;
}

import Breadcrumbs from './Breadcrumbs';

export default function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 ? (
                    <nav className="flex items-center text-xs text-gray-500 mb-2">
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={index}>
                                {index > 0 && <ChevronRight className="w-3 h-3 mx-1" />}
                                {crumb.href ? (
                                    <Link href={crumb.href} className="hover:text-orange-600 transition-colors">
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span>{crumb.label}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                ) : (
                    <div className="mb-2">
                        <Breadcrumbs />
                    </div>
                )}

                <h1 className="text-2xl font-bold text-navy-900 dark:text-white">{title}</h1>
                {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
            </div>

            {actions && (
                <div className="flex flex-wrap gap-2 items-center">
                    {actions}
                </div>
            )}
        </div>
    );
}
