const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://dsignxt_db_user:password@cluster.mongodb.net/?appName=Dsignxt';

async function listUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false })); // Use loose schema to see all fields

        const users = await User.find({}, 'email role status isActive').lean();

        console.log('\n--- ALL USERS ---');
        console.table(users);

        const students = users.filter(u => u.role === 'STUDENT' || u.role === 'Student');
        console.log(`\nFound ${students.length} students.`);

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

listUsers();
