import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const user = token ? await verifyToken(token) : null;

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        // 2MB Limit
        const MAX_SIZE = 2 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ message: 'File too large (Max 2MB)' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // In a real app, we'd upload to S3. For now, we'll return a base64 string
        // or a mock path if we were saving to disk. Let's use base64 for immediate feedback.
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        return NextResponse.json({
            message: 'File uploaded successfully',
            filename: file.name,
            url: dataUrl
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
