import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Attendance from '@/models/Attendance';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { logAction } from '@/lib/audit';
import { sendNotification } from '@/lib/notification';
import { sendEmail } from '@/lib/email';
import { EmailTemplates } from '@/lib/email-templates';
import User from '@/models/User';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

async function getUserInfo() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, SECRET);
        return { userId: payload.userId, role: payload.role as string };
    } catch {
        return null;
    }
}
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    console.log("[API DEBUG] Attendance PUT started");
    await dbConnect();
    const userInfo = await getUserInfo();

    console.log(`[API DEBUG] userInfo: ${JSON.stringify(userInfo)}`);

    // 1. Strict Admin Check
    if (!userInfo || (userInfo.role !== 'ADMIN' && userInfo.role !== 'admin')) {
        console.warn(`[AUTH] Unauthorized attendance update attempt by ${userInfo?.userId} with role ${userInfo?.role}`);
        return NextResponse.json({ message: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { status } = body;
        console.log(`[API DEBUG] ID: ${id}, Status: ${status}`);

        if (!['Approved', 'Rejected'].includes(status)) {
            return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
        }

        const record = await Attendance.findById(id);
        if (!record) {
            console.log(`[API DEBUG] Record not found: ${id}`);
            return NextResponse.json({ message: 'Attendance record not found' }, { status: 404 });
        }

        console.log(`[API DEBUG] Current record status: ${record.status}`);
        // Strict "Approve OR Reject only once" rule
        if (record.status !== 'Pending') {
            console.log(`[API DEBUG] Record already processed: ${record.status}`);
            return NextResponse.json({ message: `Attendance request has already been ${record.status}. Action is final.` }, { status: 400 });
        }

        record.status = status;
        record.approvedBy = userInfo.userId;
        record.approvedAt = new Date();

        await record.save();
        console.log("[API DEBUG] Record saved successfully");

        // Notify Employee (DB Notification)
        try {
            console.log(`[API DEBUG] Sending DB notification to ${record.userId}`);
            await sendNotification({
                recipientId: record.userId.toString(),
                recipientRole: 'EMPLOYEE',
                title: `Attendance ${status}`,
                message: `Your attendance for ${new Date(record.date).toLocaleDateString()} has been ${status}.`,
                type: status === 'Approved' ? 'ATTENDANCE_APPROVED' : 'ATTENDANCE_REJECTED',
                entityType: 'Attendance',
                entityId: id
            });
            console.log("[API DEBUG] DB notification sent");
        } catch (notifierError: any) {
            console.error("[API DEBUG] Notification failed", notifierError);
        }

        // Notify Employee (Email)
        try {
            const employeeUser = await User.findById(record.userId).select('email name');
            if (employeeUser && employeeUser.email) {
                console.log(`[API DEBUG] Sending email to ${employeeUser.email}`);
                await sendEmail({
                    to: employeeUser.email,
                    subject: `⏱️ Attendance Update: ${status}`,
                    html: EmailTemplates.attendanceActionEmail(
                        new Date(record.date).toLocaleDateString(),
                        status,
                        employeeUser.name
                    )
                });
                console.log("[API DEBUG] Email sent");
            }
        } catch (error) {
            console.error(`[EMAIL ERROR] Failed to send attendance email`, error);
        }

        // Audit Log
        try {
            console.log("[API DEBUG] Logging action to AuditLog");
            await logAction({
                action: status === 'Approved' ? 'ATTENDANCE_APPROVED' : 'ATTENDANCE_REJECTED',
                entityType: 'Attendance',
                entityId: id,
                performedBy: userInfo.userId as string,
                role: 'ADMIN',
                metadata: { originalStatus: 'Pending', newStatus: status }
            });
            console.log("[API DEBUG] Audit log complete");
        } catch (auditError) {
            console.error("[API DEBUG] Audit logging failed", auditError);
        }

        return NextResponse.json({ message: `Attendance ${status} successfully`, record });

    } catch (err: any) {
        console.error("[API DEBUG] Catch block triggered", err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
