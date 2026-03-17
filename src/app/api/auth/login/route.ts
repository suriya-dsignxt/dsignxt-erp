import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { comparePassword, signToken } from '@/lib/auth';
import { serialize } from 'cookie';

export async function POST(req: Request) {
    try {
        await dbConnect();

        const { email, password } = await req.json();
        console.log(`[Login Attempt] Email: ${email}`);

        if (!email || !password) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        const user = await User.findOne({ email });
        if (!user) {
            console.log(`[Login Failed] User not found: ${email}`);
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            console.log(`[Login Failed] Password mismatch for: ${email}`);
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        console.log(`[Login Success] User: ${email}, Role: ${user.role}`);

        const token = signToken({
            userId: user._id,
            role: user.role,
            isOnboardingCompleted: user.isOnboardingCompleted || false
        });

        const cookie = serialize('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
            sameSite: 'strict',
        });

        // Check for Employee Profile Completion
        let redirectUrl = null;
        if (user.role === 'EMPLOYEE') {
            const EmployeeProfile = (await import('@/models/EmployeeProfile')).default;
            const profile = await EmployeeProfile.findOne({ userId: user._id });

            if (!profile || !profile.profileCompleted) {
                redirectUrl = '/employee/profile-setup';
            }
        }

        const response = NextResponse.json({
            message: 'Login successful',
            user: { name: user.name, email: user.email, role: user.role },
            forceRedirect: redirectUrl
        });

        response.headers.set('Set-Cookie', cookie);

        return response;
    } catch (error: any) {
        console.error('Login Error:', error);
        return NextResponse.json({
            message: 'Internal Server Error',
            error: error.message,
            stack: error.stack // Temporarily expose stack for debugging
        }, { status: 500 });
    }
}
