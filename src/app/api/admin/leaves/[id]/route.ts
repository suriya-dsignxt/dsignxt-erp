import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import LeaveRequest from '@/models/LeaveRequest';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { logAction } from '@/lib/audit';

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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const userInfo = await getUserInfo();

    if (!userInfo || (userInfo.role !== 'ADMIN' && userInfo.role !== 'admin')) {
        return NextResponse.json({ message: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    try {
        const { id } = await params;
        const leave = await LeaveRequest.findById(id);

        if (!leave) {
            return NextResponse.json({ message: 'Leave request not found' }, { status: 404 });
        }

        const originalStatus = leave.status;
        await LeaveRequest.findByIdAndDelete(id);

        // Audit Log
        await logAction({
            action: 'LEAVE_DELETED',
            entityType: 'LeaveRequest',
            entityId: id,
            performedBy: userInfo.userId as string,
            role: 'ADMIN',
            metadata: { originalStatus, message: 'Leave request removed by admin' }
        });

        return NextResponse.json({ message: 'Leave request deleted successfully' });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
