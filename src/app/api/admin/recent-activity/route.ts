import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import AuditLog from '@/models/AuditLog';

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

export async function GET() {
    await dbConnect();

    // Secure this route
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const { payload } = await jwtVerify(token, SECRET);
        if (payload.role !== 'ADMIN') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    } catch {
        return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
    }

    try {
        // Fetch last 15 audit log entries with user population
        const activities = await AuditLog.find({})
            .sort({ createdAt: -1 })
            .limit(15)
            .populate('performedBy', 'name email')
            .lean();

        // Format activities with user-friendly messages and icons
        const formattedActivities = activities.map((activity: any) => {
            let icon = '📋';
            let message = activity.actionType || 'Unknown Action';
            let color = 'gray';

            const userName = activity.performedBy?.name || 'User';
            const userEmail = activity.performedBy?.email || '';
            const metadata = activity.metadata || {};

            // Format based on actionType
            switch (activity.actionType) {
                case 'CREATE':
                    if (activity.entityType === 'User') {
                        icon = '👤';
                        message = `New user created: ${metadata.userName || userName}`;
                        color = 'green';
                    } else if (activity.entityType === 'Event') {
                        icon = '📅';
                        message = `Event created: ${metadata.title || 'New Event'}`;
                        color = 'blue';
                    } else if (activity.entityType === 'Announcement') {
                        icon = '📢';
                        message = `Announcement posted: ${metadata.title || 'New Announcement'}`;
                        color = 'orange';
                    } else if (activity.entityType === 'Goal') {
                        icon = '🎯';
                        message = `Goal created: ${metadata.title || 'New Goal'}`;
                        color = 'purple';
                    } else {
                        icon = '✨';
                        message = `${activity.entityType} created by ${userName}`;
                        color = 'blue';
                    }
                    break;

                case 'UPDATE':
                    if (activity.entityType === 'Attendance') {
                        icon = '✅';
                        message = `Attendance updated for ${metadata.userName || userName}`;
                        color = 'blue';
                    } else if (activity.entityType === 'LeaveRequest') {
                        if (metadata.status === 'APPROVED') {
                            icon = '✅';
                            message = `Leave approved for ${metadata.userName || userName}`;
                            color = 'green';
                        } else if (metadata.status === 'REJECTED') {
                            icon = '❌';
                            message = `Leave rejected for ${metadata.userName || userName}`;
                            color = 'red';
                        } else {
                            icon = '📝';
                            message = `Leave request updated for ${metadata.userName || userName}`;
                            color = 'yellow';
                        }
                    } else if (activity.entityType === 'MonthlySalary') {
                        if (metadata.status === 'APPROVED') {
                            icon = '💰';
                            message = `Salary approved for ${metadata.userName || userName}`;
                            color = 'green';
                        } else if (metadata.status === 'PAID') {
                            icon = '💵';
                            message = `Salary marked as paid for ${metadata.userName || userName}`;
                            color = 'green';
                        } else {
                            icon = '💰';
                            message = `Salary updated for ${metadata.userName || userName}`;
                            color = 'purple';
                        }
                    } else {
                        icon = '🔄';
                        message = `${activity.entityType} updated by ${userName}`;
                        color = 'blue';
                    }
                    break;

                case 'DELETE':
                    icon = '🗑️';
                    message = `${activity.entityType} deleted by ${userName}`;
                    color = 'red';
                    break;

                case 'MARK_ATTENDANCE':
                    icon = '✅';
                    message = `Attendance marked by ${userName}`;
                    color = 'blue';
                    break;

                case 'APPROVE':
                    if (activity.entityType === 'Attendance') {
                        icon = '🟢';
                        message = `Attendance approved for ${metadata.userName || userName}`;
                        color = 'green';
                    } else if (activity.entityType === 'LeaveRequest') {
                        icon = '✅';
                        message = `Leave approved for ${metadata.userName || userName}`;
                        color = 'green';
                    } else {
                        icon = '✅';
                        message = `${activity.entityType} approved by ${userName}`;
                        color = 'green';
                    }
                    break;

                case 'REJECT':
                    icon = '❌';
                    message = `${activity.entityType} rejected by ${userName}`;
                    color = 'red';
                    break;

                case 'PASSWORD_RESET':
                    icon = '🔐';
                    message = `Password reset for ${metadata.userName || userName}`;
                    color = 'red';
                    break;

                default:
                    icon = '📋';
                    message = `${activity.actionType || 'Action'} on ${activity.entityType || 'entity'}`;
                    color = 'gray';
            }

            return {
                id: activity._id,
                action: activity.actionType,
                message,
                icon,
                color,
                performedBy: userEmail || userName,
                timestamp: activity.createdAt,
                timeAgo: getTimeAgo(activity.createdAt)
            };
        });

        return NextResponse.json({
            activities: formattedActivities,
            total: formattedActivities.length
        });

    } catch (err: any) {
        console.error('Recent Activity Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

// Helper function to format time ago
function getTimeAgo(timestamp: Date | null | undefined): string {
    if (!timestamp) {
        return 'Unknown time';
    }

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
        return 'Invalid date';
    }

    const now = new Date();
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (secondsAgo < 60) return 'Just now';
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} minutes ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)} hours ago`;
    if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)} days ago`;
    return date.toLocaleDateString();
}
