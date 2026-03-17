import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import Task from '@/models/Task';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, SECRET);
        return payload.userId;
    } catch {
        return null;
    }
}

export async function GET() {
    await dbConnect();
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // --- Deadline Reminder Logic ---
        const now = new Date();
        const fifteenMinsFromNow = new Date(now.getTime() + 15 * 60 * 1000);

        // Find tasks for this user with deadlines in the next 15 mins that haven't been notified yet
        // We'll check both original due date and employee estimate
        const upcomingTasks = await Task.find({
            assignedTo: userId,
            status: { $ne: 'Completed' },
            $or: [
                { dueDate: { $gt: now, $lt: fifteenMinsFromNow } },
                { employeeEstimatedDeadline: { $gt: now, $lt: fifteenMinsFromNow } }
            ]
        });

        for (const task of upcomingTasks) {
            const isEmployeeEstimate = task.employeeEstimatedDeadline && task.employeeEstimatedDeadline > now && task.employeeEstimatedDeadline < fifteenMinsFromNow;
            const deadlineType = isEmployeeEstimate ? 'your estimated deadline' : 'the assigned deadline';
            const message = `Reminder: Task "${task.title}" is reaching ${deadlineType} in less than 15 minutes.`;

            // Avoid duplicate reminders within the same 15-min window
            const existing = await Notification.findOne({
                recipientId: userId,
                type: 'TASK_REMINDER',
                message,
                createdAt: { $gt: new Date(now.getTime() - 15 * 60 * 1000) }
            });

            if (!existing) {
                await Notification.create({
                    recipientId: userId,
                    title: 'Upcoming Deadline',
                    message,
                    type: 'TASK_REMINDER',
                    isRead: false
                });
            }
        }
        // -------------------------------

        // Fetch unread notifications, sorted by newest first
        const notifications = await Notification.find({ recipientId: userId, isRead: false })
            .sort({ createdAt: -1 })
            .limit(20);

        return NextResponse.json({ notifications });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function PATCH() {
    // Bulk mark all as read
    await dbConnect();
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await Notification.updateMany(
            { recipientId: userId, isRead: false },
            { $set: { isRead: true } }
        );

        return NextResponse.json({ message: 'All notifications marked as read' });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
