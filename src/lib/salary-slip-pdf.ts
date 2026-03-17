import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SalaryData {
    employeeName: string;
    employeeEmail: string;
    employeeId: string;
    month: number;
    year: number;
    workingDays: number;
    presentDays: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    perDayRate: number;
    calculatedSalary: number;
    status: string;
    generatedAt: Date;
    paidAt?: Date;
    paymentMethod?: string;
    transactionReference?: string;
}

export function generateSalarySlipPDF(salaryData: SalaryData) {
    const doc = new jsPDF();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    // Header
    doc.setFillColor(13, 27, 62); // Navy-900
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Dsignxt', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Salary Slip', 105, 30, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Employee Details
    let yPos = 55;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Details', 20, yPos);

    yPos += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${salaryData.employeeName}`, 20, yPos);
    yPos += 7;
    doc.text(`Email: ${salaryData.employeeEmail}`, 20, yPos);
    yPos += 7;
    doc.text(`Employee ID: ${salaryData.employeeId}`, 20, yPos);
    yPos += 7;
    doc.text(`Period: ${monthNames[salaryData.month]} ${salaryData.year}`, 20, yPos);

    // Salary Breakdown Table
    yPos += 15;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Salary Breakdown', 20, yPos);

    yPos += 5;
    autoTable(doc, {
        startY: yPos,
        head: [['Description', 'Value']],
        body: [
            ['Working Days in Month', salaryData.workingDays.toString()],
            ['Days Present', salaryData.presentDays.toString()],
            ['Paid Leave Days', salaryData.paidLeaveDays.toString()],
            ['Unpaid Leave Days', salaryData.unpaidLeaveDays.toString()],
            ['Total Paid Days', (salaryData.presentDays + salaryData.paidLeaveDays).toString()],
            ['Per Day Rate', `₹${salaryData.perDayRate.toFixed(2)}`],
        ],
        theme: 'striped',
        headStyles: {
            fillColor: [13, 27, 62],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 10,
            cellPadding: 5
        },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 'auto', halign: 'right' }
        }
    });

    // Final Amount
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(240, 253, 244); // Light green background
    doc.rect(20, finalY, 170, 15, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Salary:', 25, finalY + 10);
    doc.setTextColor(22, 163, 74); // Green-600
    doc.text(`₹${salaryData.calculatedSalary.toLocaleString()}`, 185, finalY + 10, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    // Payment Details (if paid)
    if (salaryData.status === 'Paid' && salaryData.paidAt) {
        const paymentY = finalY + 25;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Details', 20, paymentY);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Payment Date: ${new Date(salaryData.paidAt).toLocaleDateString()}`, 20, paymentY + 7);
        if (salaryData.paymentMethod) {
            doc.text(`Payment Method: ${salaryData.paymentMethod}`, 20, paymentY + 14);
        }
        if (salaryData.transactionReference) {
            doc.text(`Transaction Reference: ${salaryData.transactionReference}`, 20, paymentY + 21);
        }
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('This is a computer-generated document. No signature is required.', 105, pageHeight - 20, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, pageHeight - 15, { align: 'center' });
    doc.text('© Dsignxt Inc. All rights reserved.', 105, pageHeight - 10, { align: 'center' });

    // Save the PDF
    const fileName = `Salary_${salaryData.employeeName.replace(/\s+/g, '_')}_${monthNames[salaryData.month]}_${salaryData.year}.pdf`;
    doc.save(fileName);
}
