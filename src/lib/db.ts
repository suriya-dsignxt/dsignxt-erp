import mongoose from 'mongoose';

async function dbConnect() {
    const MONGODB_URI = process.env.MONGODB_URI?.trim();

    if (!MONGODB_URI) {
        throw new Error(
            'Please define the MONGODB_URI environment variable inside .env.local'
        );
    }

    /**
     * Global is used here to maintain a cached connection across hot reloads
     * in development.
     */
    let cached = (global as any).mongoose;

    if (!cached) {
        cached = (global as any).mongoose = { conn: null, promise: null };
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        console.log('[DB] New connection attempt...');
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((instance) => {
            console.log('[DB] Connection successful');
            return instance;
        }).catch(err => {
            console.error('[DB] Connection failed:', err);
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        console.error('[DB] Cached promise error:', e);
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
