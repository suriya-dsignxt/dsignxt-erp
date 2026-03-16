import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { EmailTemplates } from '@/lib/email-templates';

export async function GET(req: Request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const role = searchParams.get('role');
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        const query: any = {};

        if (role) query.role = role;
        if (status) query.status = status;

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Use Aggregation to get users without passwords
        const users = await User.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            {
                $project: {
                    password: 0, // Exclude password
                    __v: 0
                }
            }
        ]);
        return NextResponse.json({ users });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const body = await req.json();
        const { name, email, password, role, status, mentorId, phone, photo } = body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            mentorId,
            phone,
            photo,
        });

        console.info(`[AUDIT] User Created: ${user.email} (${user.role}) by Admin`);

        // Send Welcome Email
        if (role === 'EMPLOYEE' || role === 'Employee') {
            try {
                await sendEmail({
                    to: email,
                    subject: 'Welcome to the Team! 🎉',
                    html: EmailTemplates.welcomeEmail(name, email, role)
                });
                console.info(`[EMAIL] Welcome email sent to ${email}`);
            } catch (emailError) {
                console.error(`[EMAIL ERROR] Failed to send welcome email:`, emailError);
                // Don't fail the request if email fails, just log it
            }
        }

        return NextResponse.json({ message: 'User created', user });
    } catch (err: any) {
        console.error(`[ERROR] Create User Failed: ${err.message}`);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
