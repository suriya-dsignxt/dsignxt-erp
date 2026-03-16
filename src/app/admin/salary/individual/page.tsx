'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ModernGlassCard from '@/components/ui/ModernGlassCard';
import PageHeader from '@/components/ui/PageHeader';
import { Search, Eye, Play, FileText, Download, Calendar, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { generateSalarySlipPDF } from '@/lib/salary-slip-pdf';

export default function IndividualSalaryPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [month, setMonth] = useState(new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1);
    const [year, setYear] = useState(new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear());

    const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
    const [preview, setPreview] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Fetch all employees
    useEffect(() => {
        fetchEmployees();
    }, []);

    // Fetch salary history when employee selected
    useEffect(() => {
        if (selectedEmployee) {
            fetchSalaryHistory();
        }
    }, [selectedEmployee]);

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setEmployees(data.users?.filter((u: any) => u.role === 'EMPLOYEE') || []);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchSalaryHistory = async () => {
        if (!selectedEmployee) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/salary/individual?employeeId=${selectedEmployee._id}`);
            if (res.ok) {
                const data = await res.json();
                setSalaryHistory(data.salaries || []);
            }
        } catch (error) {
            console.error('Error fetching salary history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async () => {
        if (!selectedEmployee) {
            alert('Please select an employee');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/admin/salary/individual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: selectedEmployee._id,
                    month,
                    year,
                    preview: true
                })
            });

            const data = await res.json();
            if (res.ok) {
                setPreview(data);
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Failed to preview salary');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedEmployee) {
            alert('Please select an employee');
            return;
        }

        if (!confirm(`Generate salary for ${selectedEmployee.name} - ${monthNames[month]} ${year}?`)) {
            return;
        }

        setGenerating(true);
        try {
            const res = await fetch('/api/admin/salary/individual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: selectedEmployee._id,
                    month,
                    year,
                    preview: false
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert('Salary generated successfully!');
                setPreview(null);
                fetchSalaryHistory();
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Failed to generate salary');
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadPDF = (salary: any) => {
        generateSalarySlipPDF({
            employeeName: salary.employeeId?.name || 'Unknown',
            employeeEmail: salary.employeeId?.email || '',
            employeeId: salary.employeeId?._id || '',
            month: salary.month,
            year: salary.year,
            workingDays: salary.workingDays,
            presentDays: salary.presentDays,
            paidLeaveDays: salary.paidLeaveDays || 0,
            unpaidLeaveDays: salary.unpaidLeaveDays || 0,
            perDayRate: salary.perDayRate,
            calculatedSalary: salary.calculatedSalary,
            status: salary.status,
            generatedAt: salary.generatedAt,
            paidAt: salary.paidAt,
            paymentMethod: salary.paymentMethod,
            transactionReference: salary.transactionReference
        });
    };

    const filteredEmployees = employees.filter(emp =>
        (emp?.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (emp?.email || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-mesh-gradient">
            <Sidebar />
            <main className="md:ml-64 p-4 md:p-8 flex-1 pb-24">
                <PageHeader
                    title="Individual Salary Generation"
                    subtitle="Generate and view salary for specific employees"
                    breadcrumbs={[
                        { label: 'Admin', href: '/admin/dashboard' },
                        { label: 'Salaries', href: '/admin/salary/generate' },
                        { label: 'Individual' }
                    ]}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                    {/* Employee Selector */}
                    <ModernGlassCard title="Select Employee" className="lg:col-span-1">
                        <div className="space-y-3">
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search employees..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {filteredEmployees.map((emp) => (
                                    <button
                                        key={emp._id}
                                        onClick={() => setSelectedEmployee(emp)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${selectedEmployee?._id === emp._id
                                            ? 'bg-orange-50 border-orange-300 shadow-sm'
                                            : 'bg-white border-gray-200 hover:border-orange-200'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                            {emp?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-navy-900 truncate">{emp?.name || 'Unknown User'}</div>
                                            <div className="text-xs text-gray-500 truncate">{emp?.email || 'No email provided'}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </ModernGlassCard>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {!selectedEmployee ? (
                            <ModernGlassCard className="p-12 text-center">
                                <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-bold text-gray-600">No Employee Selected</h3>
                                <p className="text-gray-400 text-sm">Select an employee from the list to view or generate salary</p>
                            </ModernGlassCard>
                        ) : (
                            <>
                                {/* Generation Controls */}
                                <ModernGlassCard title={`Generate Salary for ${selectedEmployee.name}`}>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Year</label>
                                                <select
                                                    value={year}
                                                    onChange={(e) => setYear(Number(e.target.value))}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                                >
                                                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Month</label>
                                                <select
                                                    value={month}
                                                    onChange={(e) => setMonth(Number(e.target.value))}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                                >
                                                    {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={handlePreview}
                                                disabled={loading}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                                            >
                                                <Eye size={18} />
                                                Preview Calculation
                                            </button>
                                            <button
                                                onClick={handleGenerate}
                                                disabled={generating}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                                            >
                                                <Play size={18} />
                                                Generate & Save
                                            </button>
                                        </div>
                                    </div>
                                </ModernGlassCard>

                                {/* Preview Section */}
                                {preview && (
                                    <ModernGlassCard title="Preview - Salary Breakdown" className="border-2 border-blue-200 bg-blue-50/30">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                                                    <div className="text-2xl font-black text-blue-700">{preview.breakdown.workingDays}</div>
                                                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1">Working Days</div>
                                                </div>
                                                <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                                                    <div className="text-2xl font-black text-green-700">{preview.breakdown.fullDayCount}</div>
                                                    <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mt-1">Full Days</div>
                                                </div>
                                                <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-center">
                                                    <div className="text-2xl font-black text-orange-700">{preview.breakdown.halfDayCount}</div>
                                                    <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mt-1">Half Days</div>
                                                </div>
                                                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
                                                    <div className="text-2xl font-black text-purple-700">{preview.breakdown.paidLeaveDays}</div>
                                                    <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mt-1">Paid Leave</div>
                                                </div>
                                                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
                                                    <div className="text-2xl font-black text-red-700">{preview.breakdown.unpaidLeaveDays}</div>
                                                    <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-1">Unpaid Days</div>
                                                </div>
                                            </div>

                                            <div className="bg-gradient-to-r from-indigo-50/50 to-blue-50/50 border border-indigo-100 rounded-lg p-4">
                                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Payable Days Formula</div>
                                                <div className="text-sm font-mono text-gray-700">
                                                    {preview.breakdown.fullDayCount} Full + ({preview.breakdown.halfDayCount} × 0.5) + {preview.breakdown.paidLeaveDays} Paid Leave =
                                                    <span className="font-black text-indigo-700 ml-1">{preview.breakdown.payableDays.toFixed(1)} days</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                                <div>
                                                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Per Day Rate</div>
                                                    <div className="text-lg font-bold text-navy-900">${preview.breakdown.perDayRate}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Payout</div>
                                                    <div className="text-2xl font-black text-green-600">${preview.breakdown.calculatedSalary.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </ModernGlassCard>
                                )}

                                {/* Salary History */}
                                <ModernGlassCard title="Salary History">
                                    {loading ? (
                                        <div className="py-8 text-center">
                                            <div className="animate-spin h-8 w-8 border-4 border-orange-500 rounded-full border-t-transparent mx-auto"></div>
                                        </div>
                                    ) : salaryHistory.length === 0 ? (
                                        <div className="py-8 text-center text-gray-500">
                                            No salary records found for this employee
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {salaryHistory.map((salary) => (
                                                <div key={salary._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-200 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="font-bold text-navy-900">{monthNames[salary.month]} {salary.year}</div>
                                                            <div className="text-sm text-gray-500">
                                                                {salary.presentDays}/{salary.workingDays} days • ${salary.calculatedSalary.toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${salary.status === 'Draft' ? 'bg-yellow-50 text-yellow-700' :
                                                                salary.status === 'Approved' ? 'bg-blue-50 text-blue-700' :
                                                                    'bg-green-50 text-green-700'
                                                                }`}>
                                                                {salary.status}
                                                            </span>
                                                            <button
                                                                onClick={() => handleDownloadPDF(salary)}
                                                                className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                                            >
                                                                <FileText size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ModernGlassCard>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
