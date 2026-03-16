import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Attendance from '@/models/Attendance';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        const query: any = {};
        if (userId) query.userId = userId;

        const attendance = await Attendance.find(query)
            .populate('userId', 'name email')
            .populate('approvedBy', 'name')
            .sort({ date: -1 });
        return NextResponse.json({ attendance });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
