import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function GET() {
    await dbConnect();

    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: 'ADMIN' });
    if (existingAdmin) {
        return NextResponse.json({ message: 'Admin already exists' }, { status: 400 });
    }

    // Create default admin
    const hashedPassword = await hashPassword('admin123');
    const admin = await User.create({
        name: 'System Admin',
        email: 'admin@dsignxt.com',
        password: hashedPassword,
        role: 'ADMIN',
    });

    return NextResponse.json({ message: 'Admin created successfully', user: admin });
}
