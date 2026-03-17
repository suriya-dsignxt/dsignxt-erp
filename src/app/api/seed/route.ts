import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function GET() {
    try {
        await dbConnect();

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@dsignxt.com' });
        if (existingAdmin) {
            return NextResponse.json({ message: 'Admin already exists', email: 'admin@dsignxt.com' });
        }

        // Create new Admin
        const hashedPassword = await hashPassword('admin123'); // Default password

        const newAdmin = await User.create({
            name: 'Super Admin',
            email: 'admin@dsignxt.com',
            password: hashedPassword,
            role: 'ADMIN',
            status: 'Active',
            isOnboardingCompleted: true
        });

        return NextResponse.json({
            message: 'Admin created successfully',
            email: newAdmin.email,
            password: 'admin123'
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
