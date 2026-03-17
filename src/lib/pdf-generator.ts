
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SalarySlipData {
    id: string;
    month: string;
    year: number;
    employeeName: string;
    employeeEmail: string;
    perDayRate: number;
    workingDays: number;
    presentDays: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    totalPaidDays: number;
    calculatedSalary: number;
    generatedAt: string;
    status: string;
}

export const generateSalarySlip = (data: SalarySlipData) => {
    const doc = new jsPDF();

    // -- Header --
    doc.setFillColor(255, 140, 0); // Orange (Dsignxt Brand)
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Dsignxt Tech Solutions', 14, 25);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Salary Slip', 180, 25, { align: 'right' });

    // -- Employee Details --
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Summary', 14, 55);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Left Col
    doc.text(`Name: ${data.employeeName}`, 14, 65);
    doc.text(`Email: ${data.employeeEmail}`, 14, 72);

    // Right Col
    doc.text(`Month: ${data.month} ${data.year}`, 150, 65);
    doc.text(`Generated: ${new Date(data.generatedAt).toLocaleDateString()}`, 150, 72);

    // -- Breakdown Table --
    autoTable(doc, {
        startY: 85,
        head: [['Description', 'Value']],
        body: [
            ['Total Working Days', data.workingDays.toString()],
            ['Present Days (Including WFH)', data.presentDays.toString()],
            ['Paid Leave (Sick Leave)', data.paidLeaveDays.toString()],
            ['Total Paid Days', data.totalPaidDays.toString()],
            ['Daily Rate', `₹${data.perDayRate.toLocaleString()}`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [20, 30, 70] }, // Navy Blue
    });

    // -- Earnings Calculation --
    // We assume calculatedSalary is the final payout.
    // Creating a "Financials" table
    const finalY = (doc as any).lastAutoTable.finalY + 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Earnings Statement', 14, finalY);

    autoTable(doc, {
        startY: finalY + 10,
        head: [['Component', 'Amount']],
        body: [
            ['Basic Salary', `₹${data.calculatedSalary.toLocaleString()}`], // Simplified for now
            // Add breakdown later if we have HRA/etc logic
            ['Total Deductions', '₹0'],
            ['Net Payable', `₹${data.calculatedSalary.toLocaleString()}`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [20, 30, 70] },
        columnStyles: {
            1: { fontStyle: 'bold', halign: 'right' }
        }
    });

    // -- Footer --
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This is a computer-generated document and does not require a signature.', 105, pageHeight - 10, { align: 'center' });
    doc.text('Dsignxt ERP v1.0', 14, pageHeight - 10);

    // Save
    doc.save(`SalarySlip_${data.employeeName.replace(/\s+/g, '_')}_${data.month}_${data.year}.pdf`);
};
