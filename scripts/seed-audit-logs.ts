import * as dotenv from 'dotenv';
dotenv.config();

import dbConnect from '../src/lib/db';
import AuditLog from '../src/models/AuditLog';
import User from '../src/models/User';

async function seedAuditLogs() {
    await dbConnect();

    console.log('🌱 Starting audit log seeding...');

    // Get a sample admin user for performedBy field
    const adminUser = await User.findOne({ role: 'ADMIN' }).select('email name');
    const employeeUsers = await User.find({ role: 'EMPLOYEE' }).limit(5).select('email name');

    if (!adminUser) {
        console.error('❌ No admin user found. Create an admin user first.');
        return;
    }

    // Clear existing audit logs (optional - comment out if you want to keep existing)
    // await AuditLog.deleteMany({});
    // console.log('🗑️  Cleared existing audit logs');

    const now = new Date();
    const sampleLogs = [];

    // Generate logs for the past 7 days
    for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
        const logDate = new Date(now);
        logDate.setDate(logDate.getDate() - daysAgo);
        logDate.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));

        // User Created
        if (employeeUsers[daysAgo % employeeUsers.length]) {
            sampleLogs.push({
                action: 'USER_CREATED',
                performedBy: adminUser.email,
                details: {
                    name: employeeUsers[daysAgo % employeeUsers.length].name,
                    email: employeeUsers[daysAgo % employeeUsers.length].email
                },
                timestamp: new Date(logDate.getTime() - Math.random() * 3600000)
            });
        }

        // Attendance Marked
        sampleLogs.push({
            action: 'ATTENDANCE_MARKED',
            performedBy: employeeUsers[daysAgo % employeeUsers.length]?.email || 'employee@example.com',
            details: { status: 'Present' },
            timestamp: new Date(logDate.getTime() + 2 * 3600000)
        });

        // Leave Request
        if (daysAgo % 2 === 0) {
            sampleLogs.push({
                action: 'LEAVE_REQUESTED',
                performedBy: employeeUsers[(daysAgo + 1) % employeeUsers.length]?.email || 'employee@example.com',
                details: {
                    type: ['Sick Leave', 'Casual Leave', 'Vacation'][Math.floor(Math.random() * 3)],
                    duration: Math.floor(Math.random() * 3) + 1 + ' days'
                },
                timestamp: new Date(logDate.getTime() + 3 * 3600000)
            });
        }

        // Leave Approved
        if (daysAgo % 3 === 0) {
            sampleLogs.push({
                action: 'LEAVE_APPROVED',
                performedBy: adminUser.email,
                details: {
                    userName: employeeUsers[daysAgo % employeeUsers.length]?.name || 'Employee'
                },
                timestamp: new Date(logDate.getTime() + 4 * 3600000)
            });
        }

        // Attendance Approved
        sampleLogs.push({
            action: 'ATTENDANCE_APPROVED',
            performedBy: adminUser.email,
            details: {
                userName: employeeUsers[daysAgo % employeeUsers.length]?.name || 'Employee',
                date: logDate.toISOString().split('T')[0]
            },
            timestamp: new Date(logDate.getTime() + 5 * 3600000)
        });

        // Salary Generated (monthly)
        if (daysAgo === 1) {
            sampleLogs.push({
                action: 'SALARY_GENERATED',
                performedBy: adminUser.email,
                details: {
                    month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                },
                timestamp: new Date(logDate.getTime() + 6 * 3600000)
            });
        }

        // Event Created
        if (daysAgo % 4 === 0) {
            sampleLogs.push({
                action: 'EVENT_CREATED',
                performedBy: adminUser.email,
                details: {
                    title: ['Team Meeting', 'Company Offsite', 'Training Session', 'Town Hall'][Math.floor(Math.random() * 4)]
                },
                timestamp: new Date(logDate.getTime() + 1 * 3600000)
            });
        }

        // Announcement Posted
        if (daysAgo % 5 === 0) {
            sampleLogs.push({
                action: 'ANNOUNCEMENT_POSTED',
                performedBy: adminUser.email,
                details: {
                    title: ['Holiday Notice', 'Policy Update', 'System Maintenance', 'New Benefits'][Math.floor(Math.random() * 4)]
                },
                timestamp: new Date(logDate.getTime() + 7 * 3600000)
            });
        }
    }

    // Insert all logs
    await AuditLog.insertMany(sampleLogs);

    console.log(`✅ Successfully seeded ${sampleLogs.length} audit log entries`);
    console.log('📊 Sample activities created for the past 7 days');

    process.exit(0);
}

seedAuditLogs().catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
});
