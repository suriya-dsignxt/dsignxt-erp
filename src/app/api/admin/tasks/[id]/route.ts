import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import Goal from '@/models/Goal';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { recalculateGoalProgress } from '@/lib/goals';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

async function getAdminId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, SECRET);
        if (payload.role !== 'ADMIN') return null;
        return payload.userId;
    } catch {
        return null;
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        const adminId = await getAdminId();
        if (!adminId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, description, assignedTo, goalId, priority, status, dueDate, employeeEstimatedDeadline, attachments } = body;

        // Validation: If assignedTo is being changed, ensure it's still an Employee
        if (assignedTo) {
            const targetUser = await User.findById(assignedTo);
            if (!targetUser) {
                return NextResponse.json({ message: 'Assigned user not found' }, { status: 404 });
            }
            if (targetUser.role !== 'EMPLOYEE') {
                return NextResponse.json({ message: 'Tasks can only be assigned to Employees' }, { status: 400 });
            }
        }

        // Validation: If goalId is being changed, ensure Goal exists
        if (goalId) {
            const goal = await Goal.findById(goalId);
            if (!goal) {
                return NextResponse.json({ message: 'Goal not found' }, { status: 404 });
            }
        }

        const originalTask = await Task.findById(id);
        if (!originalTask) {
            return NextResponse.json({ message: 'Task not found' }, { status: 404 });
        }
        const oldGoalId = originalTask.goalId;

        // Security: Mongoose model hook handles progress/completedAt logic.
        // We exclude completedAt from the update body to prevent manual overrides.
        const task = await Task.findByIdAndUpdate(
            id,
            {
                title,
                description,
                assignedTo,
                goalId,
                priority,
                status,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                employeeEstimatedDeadline: employeeEstimatedDeadline ? new Date(employeeEstimatedDeadline) : undefined,
                attachments
            },
            { new: true }
        ).populate('assignedTo', 'name email').populate('goalId', 'title');

        if (!task) {
            return NextResponse.json({ message: 'Task not found' }, { status: 404 });
        }

        // Sync Goal Progress (Old goal if it changed, and new goal)
        if (oldGoalId) await recalculateGoalProgress(oldGoalId.toString());
        if (goalId && goalId !== oldGoalId?.toString()) {
            await recalculateGoalProgress(goalId);
        } else if (task.goalId && !oldGoalId) {
            await recalculateGoalProgress(task.goalId.toString());
        }

        return NextResponse.json({ message: 'Task updated successfully', task });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        const adminId = await getAdminId();
        if (!adminId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const taskToDelete = await Task.findById(id);
        const goalIdToSync = taskToDelete?.goalId;

        const task = await Task.findByIdAndDelete(id);

        if (!task) {
            return NextResponse.json({ message: 'Task not found' }, { status: 404 });
        }

        // Sync Goal Progress
        if (goalIdToSync) {
            await recalculateGoalProgress(goalIdToSync.toString());
        }

        return NextResponse.json({ message: 'Task deleted successfully' });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
