import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import LeaveRequest from '@/models/LeaveRequest';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        const query: any = {};
        if (userId) query.userId = userId;

        const leaves = await LeaveRequest.find(query)
            .populate('userId', 'name email')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 });
        return NextResponse.json({ leaves });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
