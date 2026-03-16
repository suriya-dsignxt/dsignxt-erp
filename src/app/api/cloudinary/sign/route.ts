import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

async function getUserInfo() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, SECRET);
        return { userId: payload.userId, role: payload.role };
    } catch {
        return null;
    }
}

// POST: Generate Signature for Client-Side Upload
export async function POST(req: Request) {
    const userInfo = await getUserInfo();

    // Only Admin and Employees can upload
    if (!userInfo || (userInfo.role !== 'ADMIN' && userInfo.role !== 'EMPLOYEE')) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { folder } = await req.json();

        const timestamp = Math.round((new Date).getTime() / 1000);

        // Generate signature
        // Generate signature
        // We can enforce validation here
        const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
        // Try env vars first (trimmed), fallback to hardcoded if strictly necessary
        const cloudName = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME)?.trim() || 'dlsybqtuw';
        const apiKey = process.env.CLOUDINARY_API_KEY?.trim();

        console.log('[Cloudinary Sign] Signing request. Cloud Name present:', !!cloudName, 'API Secret present:', !!apiSecret);

        if (!cloudName) {
            console.error('[Cloudinary Sign] Missing Cloud Name');
            return NextResponse.json({ message: 'Server misconfiguration: Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME' }, { status: 500 });
        }

        if (!apiSecret) {
            console.error('[Cloudinary Sign] Missing API Secret');
            return NextResponse.json({ message: 'Server misconfiguration: Missing CLOUDINARY_API_SECRET' }, { status: 500 });
        }

        const signature = cloudinary.utils.api_sign_request({
            timestamp: timestamp,
            folder: folder || 'crm-uploads',
        }, apiSecret);

        return NextResponse.json({
            signature,
            timestamp,
            cloudName: cloudName,
            apiKey: apiKey
        });
    } catch (error: any) {
        console.error('Cloudinary Sign Error:', error);
        return NextResponse.json({ message: 'Failed to sign request' }, { status: 500 });
    }
}
