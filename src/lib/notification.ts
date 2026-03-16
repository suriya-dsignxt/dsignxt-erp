import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';

interface SendNotificationParams {
    recipientId: string;
    recipientRole: 'ADMIN' | 'EMPLOYEE';
    title: string;
    message: string;
    type: string;
    entityType?: string;
    entityId?: string;
}

/**
 * Sends a system notification to a specific user.
 * This operation is asynchronous and non-blocking (fails silently on error).
 */
export async function sendNotification({
    recipientId,
    recipientRole,
    title,
    message,
    type,
    entityType,
    entityId
}: SendNotificationParams) {
    try {
        // Ensure DB connection (though usually already connected in API routes)
        await dbConnect();

        await Notification.create({
            recipientId,
            recipientRole,
            title,
            message,
            type,
            entityType,
            entityId,
            isRead: false,
            createdAt: new Date()
        });

        console.log(`[NOTIFICATION] Sent to ${recipientRole} (${recipientId}): ${title}`);
    } catch (error) {
        // Fail silently to avoid blocking the main business logic
        console.error("FAILED TO SEND NOTIFICATION:", error);
    }
}

/**
 * Broadcasts a notification to all Admins.
 */
export async function notifyAdmins({
    title,
    message,
    type,
    entityType,
    entityId
}: Omit<SendNotificationParams, 'recipientId' | 'recipientRole'>) {
    try {
        await dbConnect();
        // Dynamically import User to avoid potential circular deps if User uses this lib later
        const User = (await import('@/models/User')).default;

        const admins = await User.find({ role: 'ADMIN' }).select('_id');

        if (admins.length === 0) return;

        const notifications = admins.map((admin: any) => ({
            recipientId: admin._id,
            recipientRole: 'ADMIN',
            title,
            message,
            type,
            entityType,
            entityId,
            isRead: false,
            createdAt: new Date()
        }));

        await Notification.insertMany(notifications);
        console.log(`[NOTIFICATION] Broadcast to ${admins.length} Admins: ${title}`);

    } catch (error) {
        console.error("FAILED TO NOTIFY ADMINS:", error);
    }
}
