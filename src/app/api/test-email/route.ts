import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Debug: Direct checks instead of iteration
        const directChecks = {
            SMTP_USER_LENGTH: process.env.SMTP_USER?.length || 0,
            SMTP_PASS_LENGTH: process.env.SMTP_PASS?.length || 0,
            MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
            ADMIN_EMAIL: process.env.ADMIN_EMAIL,
            NODE_ENV: process.env.NODE_ENV,
            VERCEL: process.env.VERCEL
        };

        const result = await sendEmail({
            to: process.env.ADMIN_EMAIL || 'support@dsignxt.com',
            subject: 'Test Email from CRM 🚀',
            html: '<h1>It Works!</h1><p>Your email integration is fully configured and working.</p>'
        });

        const envDiagnostics = {
            hasValUser: !!process.env.VAL_SMTP_USER,
            valUserLen: process.env.VAL_SMTP_USER?.length || 0,
            hasValPass: !!process.env.VAL_SMTP_PASS,
            valPassLen: process.env.VAL_SMTP_PASS?.length || 0,
            hasValAdmin: !!process.env.VAL_ADMIN_EMAIL,
            hasUser: !!process.env.SMTP_USER,
            hasPass: !!process.env.SMTP_PASS,
            now: new Date().toISOString()
        };

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Email sent successfully!',
                result,
                envDiagnostics
            });
        } else {
            return NextResponse.json({
                success: false,
                message: 'Email failed to send.',
                error: result.error,
                details: (result as any).details,
                envDiagnostics
            }, { status: 500 });
        }
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: 'Internal server error during email test.',
            error: error.message,
            envDiagnostics: {
                errorAt: 'GET_CATCH',
                now: new Date().toISOString()
            }
        }, { status: 500 });
    }
}
