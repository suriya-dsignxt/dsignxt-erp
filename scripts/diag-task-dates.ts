import mongoose from 'mongoose';
import dbConnect from '../src/lib/db';
import Task from '../src/models/Task';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function diagnose() {
    await dbConnect();
    console.log('Connected to database.');

    const tasks = await Task.find({ employeeEstimatedDeadline: { $exists: true } }).limit(5);
    
    console.log('\n--- Task Deadline Diagnostic ---');
    tasks.forEach(task => {
        console.log(`\nTask ID: ${task._id}`);
        console.log(`Title: ${task.title}`);
        console.log(`Stored employeeEstimatedDeadline (Raw): ${task.employeeEstimatedDeadline}`);
        if (task.employeeEstimatedDeadline) {
            const date = new Date(task.employeeEstimatedDeadline);
            console.log(`Parsed as Date (UTC): ${date.toISOString()}`);
            console.log(`Parsed as Date (Local IST if run here): ${date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        }
    });

    process.exit(0);
}

diagnose().catch(err => {
    console.error(err);
    process.exit(1);
});
