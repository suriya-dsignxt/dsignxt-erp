'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import AdvancedTable from '@/components/ui/AdvancedTable';
import ModernGlassCard from '@/components/ui/ModernGlassCard';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Mail, Phone, Briefcase, Calendar, ShieldCheck, MapPin } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function AdminEmployeeProfiles() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/employee-profiles')
            .then(res => res.json())
            .then(data => {
                setEmployees(data.employees || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load profiles", err);
                setLoading(false);
            });
    }, []);

    const columns = [
        {
            header: 'Profile',
            accessor: (emp: any) => (
                <div className="flex items-center gap-4">
                    <div className="relative w-10 h-10">
                        {emp.photo ? (
                            <Image src={emp.photo} alt={emp.name || 'Employee'} fill className="object-cover rounded-full border border-gray-200" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200">
                                {emp.name?.charAt(0) || '?'}
                            </div>
                        )}
                        <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${emp.profile?.completed ? 'bg-green-500' : 'bg-yellow-400'}`}></span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="font-bold text-navy-900 leading-tight">{emp.name || 'Unknown'}</div>
                            <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border ${emp.status === 'Active' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                {emp.status || 'Unknown'}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500">{emp.email || '-'}</div>
                    </div>
                </div>
            ),
            sortable: true
        },
        {
            header: 'Role & Dept',
            accessor: (emp: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-navy-900 text-sm">{emp.profile?.designation || 'Not Set'}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">{emp.profile?.department || '-'}</span>
                </div>
            )
        },
        {
            header: 'Joined',
            accessor: (emp: any) => (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} className="text-orange-400" />
                    {emp.joinedAt ? new Date(emp.joinedAt).toLocaleDateString() : 'N/A'}
                </div>
            ),
            sortable: true
        },
        {
            header: 'Action',
            accessor: (emp: any) => (
                <Link
                    href={`/admin/employee-profiles/${emp._id}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-navy-50 text-navy-700 hover:bg-navy-900 hover:text-white transition-all text-xs font-bold gap-1"
                >
                    <Eye size={14} /> View
                </Link>
            )
        }
    ];

    // Grid View Card Renderer
    const renderEmployeeCard = (emp: any) => (
        <ModernGlassCard className="!p-0 overflow-hidden flex flex-col h-full group hover:-translate-y-1 transition-transform duration-300">
            {/* Banner / Header */}
            <div className="h-24 bg-gradient-to-r from-navy-900 to-indigo-900 relative">
                <div className="absolute inset-0 bg-black/10"></div>
                {/* Status Badge */}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    {emp.status === 'Inactive' && (
                        <span className="px-2 py-1 bg-red-500/20 backdrop-blur-md text-red-100 text-[10px] font-bold rounded-lg border border-white/20 shadow-sm uppercase tracking-wider">
                            Deactivated
                        </span>
                    )}
                    {emp.profile?.completed ? (
                        <span className="px-2 py-1 bg-green-500/20 backdrop-blur-md text-white text-[10px] font-bold rounded-lg border border-white/20 shadow-sm flex items-center gap-1">
                            <ShieldCheck size={10} /> Verified
                        </span>
                    ) : (
                        <span className="px-2 py-1 bg-yellow-500/20 backdrop-blur-md text-yellow-100 text-[10px] font-bold rounded-lg border border-white/20 shadow-sm">
                            Pending
                        </span>
                    )}
                </div>
            </div>

            <div className="px-6 pb-6 flex-1 flex flex-col -mt-10 relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg mb-3">
                    <div className="w-full h-full rounded-xl overflow-hidden relative bg-gray-100">
                        {emp.photo ? (
                            <Image src={emp.photo} alt={emp.name || 'Employee'} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-black text-navy-300 bg-navy-50">
                                {emp.name?.charAt(0) || '?'}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="font-bold text-lg text-navy-900 leading-tight group-hover:text-orange-600 transition-colors">
                        {emp.name || 'Unknown'}
                    </h3>
                    <p className="text-sm text-indigo-600 font-semibold mt-0.5">{emp.profile?.designation || 'No Designation'}</p>
                    {emp.profile?.department && (
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{emp.profile.department}</p>
                    )}
                </div>

                <div className="space-y-2.5 mb-6 flex-1">
                    <div className="flex items-center gap-2.5 text-xs font-medium text-gray-500">
                        <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                            <Mail size={12} />
                        </div>
                        <span className="truncate">{emp.email}</span>
                    </div>
                    {emp.profile?.phoneNumber && (
                        <div className="flex items-center gap-2.5 text-xs font-medium text-gray-500">
                            <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                <Phone size={12} />
                            </div>
                            <span>{emp.profile.phoneNumber}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2.5 text-xs font-medium text-gray-500">
                        <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                            <Calendar size={12} />
                        </div>
                        <span>Joined {emp.joinedAt ? new Date(emp.joinedAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>

                <Link
                    href={`/admin/employee-profiles/${emp._id}`}
                    className="w-full py-2.5 rounded-xl bg-gray-50 hover:bg-navy-900 text-navy-700 hover:text-white font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-2 border border-gray-100 hover:border-navy-900 group-hover:shadow-lg group-hover:shadow-navy-900/10"
                >
                    View Full Profile
                </Link>
            </div>
        </ModernGlassCard>
    );

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-mesh-gradient">
            <Sidebar />
            <main className="md:ml-64 p-4 md:p-8 flex-1">
                <PageHeader
                    title="Employee Database"
                    subtitle="Directory of all registered staff members"
                    breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Employees' }]}
                />

                <div className="mt-8">
                    <AdvancedTable
                        data={employees}
                        columns={columns}
                        keyField="_id"
                        isLoading={loading}
                        searchPlaceholder="Search directory..."
                        renderGridLayout={renderEmployeeCard}
                        initialViewMode="grid"
                    />
                </div>
            </main>
        </div>
    );
}
