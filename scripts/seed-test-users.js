const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const adminHash = await bcrypt.hash('admin123', 10);
        const userHash = await bcrypt.hash('password123', 10);

        const db = mongoose.connection.db;
        const users = db.collection('users');

        // Admin
        await users.updateOne({ email: 'admin@promptix.com' }, {
            $set: { password: adminHash, role: 'ADMIN', isOnboardingCompleted: true }
        }, { upsert: true });

        // Employee
        await users.updateOne({ email: 'empolyee2@gamil.com' }, {
            $set: { password: userHash, role: 'EMPLOYEE', isOnboardingCompleted: true }
        }, { upsert: true });

        // Student
        await users.updateOne({ email: 'student2@gmail.com' }, {
            $set: { password: userHash, role: 'STUDENT', isOnboardingCompleted: false }
        }, { upsert: true });

        console.log('Test roles and passwords updated successfully');
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
seed();
