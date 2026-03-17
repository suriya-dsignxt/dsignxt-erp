import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import LeaveRequest from '@/models/LeaveRequest';
import Attendance from '@/models/Attendance';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { notifyAdmins } from '@/lib/notification';
import { sendEmail } from '@/lib/email';
import { EmailTemplates } from '@/lib/email-templates';
import User from '@/models/User';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, SECRET);
        if (payload.role !== 'EMPLOYEE') return null; // Strict Role Check
        return payload.userId;
    } catch {
        return null;
    }
}

export async function GET() {
    await dbConnect();
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const leaves = await LeaveRequest.find({ userId }).sort({ createdAt: -1 });
        return NextResponse.json({ leaves });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        console.log('[DEBUG] Leave POST body:', body);
        const { fromDate, toDate, reason, leaveType } = body;

        const start = new Date(fromDate);
        const end = new Date(toDate);
        console.log('[DEBUG] Parsed dates:', { start, end });

        if (start > end) {
            return NextResponse.json({ message: 'End date must be after start date' }, { status: 400 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start < today) {
            return NextResponse.json({ message: 'Cannot apply leave for past dates' }, { status: 400 });
        }

        // Check for overlap with existing Leave
        const existingLeave = await LeaveRequest.findOne({
            userId,
            status: { $ne: 'Rejected' },
            $or: [
                { fromDate: { $lte: end }, toDate: { $gte: start } }
            ]
        });

        if (existingLeave) {
            return new Response(JSON.stringify({ message: 'Leave request overlaps with an existing leave record' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check for overlap with Attendance
        const conflictingAttendance = await Attendance.findOne({
            userId,
            date: { $gte: start, $lte: end },
            status: { $ne: 'Rejected' }
        });

        if (conflictingAttendance) {
            console.log('[DEBUG] Conflicting attendance found:', conflictingAttendance);
            return new Response(JSON.stringify({
                message: `Cannot apply for leave on ${new Date(conflictingAttendance.date).toLocaleDateString()} because an attendance record exists.`
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const isPaid = leaveType !== 'Unpaid';

        const leave = await LeaveRequest.create({
            userId,
            fromDate: start,
            toDate: end,
            reason,
            leaveType: leaveType || 'Casual',
            isPaid,
            status: 'Pending',
        });
        console.log('[DEBUG] Leave created:', leave._id);

        // Notify Admins (DB Notification)
        try {
            await notifyAdmins({
                title: 'New Leave Request',
                message: `${userId} has requested leave from ${new Date(start).toLocaleDateString()} to ${new Date(end).toLocaleDateString()}.`,
                type: 'LEAVE_SUBMITTED',
                entityType: 'LeaveRequest',
                entityId: leave._id.toString()
            });

            // Notify Admin (Email)
            const employee = await User.findById(userId).select('name');
            if (employee) {
                await sendEmail({
                    to: process.env.ADMIN_EMAIL || 'support@dsignxt.com',
                    subject: `🚨 New Leave Request: ${employee.name}`,
                    html: EmailTemplates.adminLeaveRequestAlert(
                        employee.name,
                        leaveType || 'Casual',
                        start.toLocaleDateString(),
                        end.toLocaleDateString(),
                        reason
                    )
                });
                console.log(`[EMAIL] Admin alert sent for Leave Request from ${employee.name}`);
            }
        } catch (notifyErr) {
            console.error('[ERROR] Failed to notify admins:', notifyErr);
        }

        return NextResponse.json({ message: 'Leave applied', leave });
    } catch (err: any) {
        console.error('[ERROR] Leave POST failed:', err);
        // Fallback to plain Response to ensure body is readable even if JSON serialization fails
        return new Response(JSON.stringify({ message: err.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
