'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ModernGlassCard from '@/components/ui/ModernGlassCard';
import PageHeader from '@/components/ui/PageHeader';
import { useRouter } from 'next/navigation';
import { DollarSign, User, Calendar, Edit2, Save, X, Calculator, ShieldCheck, AlertCircle } from 'lucide-react';

export default function SalaryProfiles() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmp, setSelectedEmp] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);

    // Form States
    const [monthlySalary, setMonthlySalary] = useState('');
    const [effectiveFrom, setEffectiveFrom] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            const res = await fetch('/api/admin/salary/profile');
            const data = await res.json();
            if (data.employees) {
                setEmployees(data.employees);
            }
        } catch (error) {
            console.error('Failed to fetch profiles');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (emp: any) => {
        setSelectedEmp(emp);
        setMonthlySalary(emp.salaryProfile?.monthlySalary || '');
        setEffectiveFrom(emp.salaryProfile?.effectiveFrom ? new Date(emp.salaryProfile.effectiveFrom).toISOString().split('T')[0] : '');
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/salary/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: selectedEmp._id,
                    monthlySalary,
                    effectiveFrom
                })
            });

            if (res.ok) {
                setShowModal(false);
                fetchProfiles();
                alert('Salary Profile Saved!');
            } else {
                alert('Failed to save');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-mesh-gradient">
            <Sidebar />
            <main className="md:ml-64 p-4 md:p-8 flex-1 pb-24 text-navy-900">
                <PageHeader
                    title="Salary Profiles"
                    subtitle="Manage compensation structures and rates"
                    breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Salaries' }]}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="h-48 rounded-2xl bg-white/50 animate-pulse"></div>
                        ))
                    ) : (
                        employees.map((emp, idx) => (
                            <ModernGlassCard key={emp._id} delay={idx * 0.05} className="!p-0 flex flex-col group overflow-hidden">
                                <div className="p-6 flex items-start justify-between relative">
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-white border border-indigo-50 flex items-center justify-center text-indigo-700 font-bold shadow-sm">
                                            {emp.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-navy-900 leading-tight group-hover:text-indigo-600 transition-colors">
                                                {emp.name || 'Unknown'}
                                            </h3>
                                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mt-0.5">{emp.role || 'No Role'}</p>
                                        </div>
                                    </div>
                                    {emp.salaryProfile && (
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                                            <DollarSign size={120} />
                                        </div>
                                    )}
                                </div>

                                <div className="px-6 py-4 bg-gray-50/50 flex-1 flex flex-col gap-4 border-t border-b border-gray-100 backdrop-blur-sm">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Monthly</span>
                                            <div className="font-bold text-xl text-navy-900">
                                                {emp.salaryProfile ? (
                                                    `$${Number(emp.salaryProfile.monthlySalary).toLocaleString()}`
                                                ) : (
                                                    <span className="text-gray-400 text-sm italic font-medium">Not Set</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Daily Rate</span>
                                            <div className="font-bold text-lg text-orange-600">
                                                {emp.salaryProfile ? (
                                                    `$${emp.calculatedPerDayRate}`
                                                ) : (
                                                    <span className="text-gray-400 text-sm italic font-medium">-</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 flex items-center justify-between">
                                    {emp.salaryProfile ? (
                                        <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                            <ShieldCheck size={12} /> Active Profile
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
                                            <AlertCircle size={12} /> Pending Setup
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleEdit(emp)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-navy-900/10 hover:shadow-indigo-600/20 active:scale-95"
                                    >
                                        <Edit2 size={12} /> {emp.salaryProfile ? 'Modify' : 'Assign'}
                                    </button>
                                </div>
                            </ModernGlassCard>
                        ))
                    )}
                </div>

                {/* Glass Modal */}
                {showModal && selectedEmp && (
                    <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                                <div>
                                    <h2 className="text-xl font-black text-navy-900 tracking-tight">Compensation</h2>
                                    <p className="text-xs text-gray-500 font-medium mt-1">Configure salary for <span className="text-indigo-600">{selectedEmp?.name || 'Unknown'}</span></p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Monthly Salary (USD)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            required
                                            value={monthlySalary}
                                            onChange={e => setMonthlySalary(e.target.value)}
                                            className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-lg font-bold text-navy-900 font-mono"
                                            placeholder="0.00"
                                        />
                                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Effective From</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={effectiveFrom}
                                            onChange={e => setEffectiveFrom(e.target.value)}
                                            className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-navy-900"
                                        />
                                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium px-1">Leave empty to apply changes immediately.</p>
                                </div>

                                {monthlySalary && (
                                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center gap-3">
                                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                            <Calculator size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Estimated Daily Rate</p>
                                            <p className="text-sm font-bold text-navy-900">
                                                ${(Number(monthlySalary) / 30).toFixed(2)} <span className="text-xs font-normal text-gray-500">per day (approx)</span>
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-6 py-2.5 bg-navy-900 text-white rounded-xl hover:bg-green-600 font-bold shadow-lg shadow-navy-900/20 hover:shadow-green-600/30 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2 text-sm"
                                    >
                                        {isSaving ? <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" /> : <Save size={16} />}
                                        Save Profile
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
