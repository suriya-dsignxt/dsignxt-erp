'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import ModernGlassCard from '@/components/ui/ModernGlassCard';
import { generateSalarySlipPDF } from '@/lib/salary-slip-pdf';
import { Download, IndianRupee, Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function MySalary() {
    const [salaries, setSalaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSalaries();
    }, []);

    const fetchSalaries = async () => {
        try {
            const res = await fetch('/api/employee/salary');
            const data = await res.json();
            setSalaries(data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (rec: any) => {
        generateSalarySlipPDF({
            employeeName: rec.employeeId?.name || 'Employee',
            employeeEmail: rec.employeeId?.email || '',
            employeeId: rec.employeeId?._id || '',
            month: rec.month,
            year: rec.year,
            workingDays: rec.workingDays,
            presentDays: rec.presentDays,
            paidLeaveDays: rec.paidLeaveDays || 0,
            unpaidLeaveDays: rec.unpaidLeaveDays || 0,
            perDayRate: rec.perDayRate,
            calculatedSalary: rec.calculatedSalary,
            status: rec.status,
            generatedAt: rec.generatedAt,
            paidAt: rec.paidAt,
            paymentMethod: rec.paymentMethod,
            transactionReference: rec.transactionReference
        });
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'Paid': return { color: 'bg-green-500', text: 'Paid', icon: CheckCircle };
            case 'Approved': return { color: 'bg-blue-500', text: 'Approved', icon: CheckCircle };
            case 'Draft': return { color: 'bg-yellow-500', text: 'Processing', icon: AlertCircle };
            default: return { color: 'bg-gray-400', text: status, icon: AlertCircle };
        }
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-mesh-gradient">
            <Sidebar />
            <main className="md:ml-64 p-4 md:p-8 flex-1 pb-24">
                <PageHeader
                    title="My Salary History"
                    subtitle="View your monthly payout details and download payslips"
                />

                <div className="flex flex-col gap-6 max-w-5xl mx-auto">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                        </div>
                    ) : salaries.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <div className="text-6xl mb-4 grayscale">💰</div>
                            <h3 className="text-xl font-bold text-navy-900 dark:text-white">No Payment History</h3>
                            <p className="text-gray-500 dark:text-gray-400">Salary records will appear here once generated.</p>
                        </div>
                    ) : salaries.map((rec, idx) => {
                        const { color, text, icon: Icon } = getStatusInfo(rec.status);
                        return (
                            <ModernGlassCard key={rec._id} delay={idx * 0.1} className="!p-0 overflow-hidden group">
                                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center relative overflow-hidden">
                                    {/* Decorative Blob */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-100 to-transparent rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                                    {/* Date & Badge */}
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`p-2 rounded-lg text-white shadow-lg shadow-orange-500/20 bg-gradient-to-br from-navy-900 to-navy-800`}>
                                                <Calendar size={20} />
                                            </div>
                                            <h3 className="text-2xl font-black text-navy-900 dark:text-white">
                                                {monthNames[rec.month]} {rec.year}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-sm ${color}`}>
                                                <Icon size={12} strokeWidth={3} /> {text}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">#{rec._id.slice(-6).toUpperCase()}</span>
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="flex-1 w-full bg-white/50 dark:bg-navy-800/50 rounded-2xl p-4 border border-white/60 dark:border-white/10 backdrop-blur-sm">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Net Payable</span>
                                            {rec.presentDays > 0 && <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded border border-green-100 dark:border-green-800">{rec.presentDays} Days Present</span>}
                                        </div>
                                        <div className="text-3xl font-black text-navy-900 dark:text-white tracking-tight flex items-baseline gap-1">
                                            <span className="text-lg text-gray-400 dark:text-gray-500 font-bold">₹</span>
                                            {rec.calculatedSalary.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                            <TrendingUp size={12} className="text-blue-500" />
                                            Rate: <span className="font-bold text-navy-700 dark:text-orange-400">₹{rec.perDayRate}/day</span>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div>
                                        <button
                                            onClick={() => handleDownload(rec)}
                                            className="w-full md:w-auto px-6 py-3 bg-navy-900 hover:bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-navy-900/20 hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2 group-hover:-translate-y-1"
                                        >
                                            <Download size={18} />
                                            Download Slip
                                        </button>
                                    </div>
                                </div>

                                {/* Detailed Breakdown */}
                                <div className="bg-white dark:bg-navy-900/50 border-t border-gray-100 dark:border-gray-800 p-6">
                                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Attendance Breakdown</h5>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                                        {/* Working Days */}
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-black text-blue-700">{rec.workingDays}</div>
                                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1">Working Days</div>
                                        </div>

                                        {/* Full Days */}
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-black text-green-700">
                                                {rec.halfDays ? rec.presentDays - rec.halfDays : rec.presentDays}
                                            </div>
                                            <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mt-1">Full Days</div>
                                        </div>

                                        {/* Half Days */}
                                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-black text-orange-700">{rec.halfDays || 0}</div>
                                            <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mt-1">Half Days</div>
                                        </div>

                                        {/* Paid Leave */}
                                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-black text-purple-700">{rec.paidLeaveDays || 0}</div>
                                            <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mt-1">Paid Leave</div>
                                        </div>

                                        {/* Unpaid Days */}
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-black text-red-700">{rec.unpaidLeaveDays || 0}</div>
                                            <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-1">Unpaid Days</div>
                                        </div>
                                    </div>

                                    {/* Payable Days Formula */}
                                    <div className="bg-gradient-to-r from-indigo-50/50 to-blue-50/50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4">
                                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">How Your Salary Was Calculated</div>
                                        <div className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                            {rec.halfDays ? rec.presentDays - rec.halfDays : rec.presentDays} Full + ({rec.halfDays || 0} × 0.5) + {rec.paidLeaveDays || 0} Paid Leave =
                                            <span className="font-black text-indigo-700 ml-1">
                                                {((rec.halfDays ? rec.presentDays - rec.halfDays : rec.presentDays) + (rec.halfDays || 0) * 0.5 + (rec.paidLeaveDays || 0)).toFixed(1)} payable days
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            {((rec.halfDays ? rec.presentDays - rec.halfDays : rec.presentDays) + (rec.halfDays || 0) * 0.5 + (rec.paidLeaveDays || 0)).toFixed(1)} days × ₹{rec.perDayRate}/day = ₹{rec.calculatedSalary.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </ModernGlassCard>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
