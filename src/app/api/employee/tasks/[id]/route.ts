import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { recalculateGoalProgress } from '@/lib/goals';
import { sendNotification } from '@/lib/notifications';
import User from '@/models/User';

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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { status, progressPercentage, employeeEstimatedDeadline, attachment } = body;

        // Security: Fetch task and check ownership
        const task = await Task.findById(id);
        if (!task) {
            return NextResponse.json({ message: 'Task not found' }, { status: 404 });
        }
        if (task.assignedTo.toString() !== userId) {
            return NextResponse.json({ message: 'Forbidden: You cannot modify this task' }, { status: 403 });
        }

        // Validation: Block setting "Completed" or "100%" here
        if (status === 'Completed' || progressPercentage === 100) {
            return NextResponse.json({ message: 'Please use the specialized /complete endpoint to finalize tasks' }, { status: 400 });
        }

        // Update ONLY progress and status (Pending/In Progress)
        const previousStatus = task.status;
        task.status = status || task.status;
        task.progressPercentage = progressPercentage !== undefined ? progressPercentage : task.progressPercentage;
        if (employeeEstimatedDeadline) task.employeeEstimatedDeadline = new Date(employeeEstimatedDeadline);
        if (attachment) task.attachments.push(attachment);

        await task.save();

        // Sync Goal Progress
        if (task.goalId) {
            await recalculateGoalProgress(task.goalId.toString());
        }

        // Send Notification to Admin if Task Started
        if (previousStatus === 'Pending' && task.status === 'In Progress') {
            const employee = await User.findById(userId);
            if (employee && task.assignedBy) {
                await sendNotification(
                    task.assignedBy.toString(),
                    'Task Started',
                    `${employee.name} has started working on "${task.title}"`,
                    'GENERAL', // Or TASK_UPDATE if we add that type
                    '/admin/tasks'
                );
            }
        }

        return NextResponse.json({ message: 'Task updated successfully', task });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
