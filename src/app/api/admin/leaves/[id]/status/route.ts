import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import LeaveRequest from '@/models/LeaveRequest';
import Attendance from '@/models/Attendance';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { logAction } from '@/lib/audit';
import { sendNotification } from '@/lib/notification';
import { sendEmail } from '@/lib/email';
import { EmailTemplates } from '@/lib/email-templates';

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
    await dbConnect();
    const userInfo = await getUserInfo();

    if (!userInfo || userInfo.role !== 'ADMIN' && userInfo.role !== 'admin') {
        console.warn(`[AUTH] Unauthorized leave update attempt by ${userInfo?.userId} with role ${userInfo?.role}`);
        return NextResponse.json({ message: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    try {
        const { id } = await params;
        const { status } = await req.json();
        console.log(`[ACTION] Leave ${status} for ${id} by ${userInfo.userId}`);

        if (!['Approved', 'Rejected'].includes(status)) {
            return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
        }

        const leave = await LeaveRequest.findById(id);
        if (!leave) {
            return NextResponse.json({ message: 'Leave request not found' }, { status: 404 });
        }

        // Strict "Approve OR Reject only once" rule
        if (leave.status !== 'Pending') {
            return NextResponse.json({ message: `Leave request has already been ${leave.status}. Action is final.` }, { status: 400 });
        }

        // Conflict Check: If Approving Leave, ensure no Approved Attendance exists for these dates
        if (status === 'Approved') {
            const conflictingAttendance = await Attendance.findOne({
                userId: leave.userId,
                status: 'Approved',
                date: { $gte: leave.fromDate, $lte: leave.toDate }
            });

            if (conflictingAttendance) {
                return NextResponse.json({
                    message: `Cannot approve leave. User has an approved attendance record on ${new Date(conflictingAttendance.date).toLocaleDateString()}.`
                }, { status: 409 });
            }
        }

        leave.status = status;
        leave.reviewedBy = userInfo.userId;
        leave.reviewedAt = new Date();

        await leave.save();

        // Notify Employee (DB Notification)
        console.log(`[AUDIT] Notifying Employee ${leave.userId} of Leave ${status}`);
        await sendNotification({
            recipientId: leave.userId.toString(),
            recipientRole: 'EMPLOYEE',
            title: `Leave Request ${status}`,
            message: `Your leave request for ${new Date(leave.fromDate).toLocaleDateString()} has been ${status}.`,
            type: status === 'Approved' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
            entityType: 'LeaveRequest',
            entityId: id
        });

        // Notify Employee (Email)
        try {
            // Need to populate userId to get email
            const user = await import('@/models/User').then(m => m.default.findById(leave.userId).select('name email'));
            if (user && user.email) {
                await sendEmail({
                    to: user.email,
                    subject: `Leave Request ${status} 📅`,
                    html: EmailTemplates.leaveStatus(
                        user.name,
                        leave.leaveType,
                        `${new Date(leave.fromDate).toLocaleDateString()} - ${new Date(leave.toDate).toLocaleDateString()}`,
                        status,
                        userInfo.role // or get Admin name if available
                    )
                });
                console.info(`[EMAIL] Leave status email sent to ${user.email}`);
            }
        } catch (emailError) {
            console.error(`[EMAIL ERROR] Failed to send leave status email:`, emailError);
        }

        // Audit Log
        await logAction({
            action: status === 'Approved' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
            entityType: 'LeaveRequest',
            entityId: id,
            performedBy: userInfo.userId as string,
            role: 'ADMIN',
            metadata: { originalStatus: leave.status, newStatus: status }
        });

        return NextResponse.json({ message: `Leave ${status} successfully`, leave });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
