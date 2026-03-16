import mongoose from 'mongoose';

const PasswordChangeRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String, // 'EMPLOYEE'
        required: true
    },
    reason: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Rejected'],
        default: 'Pending'
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    handledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    handledAt: {
        type: Date
    }
}, { timestamps: true });

// Ensure only one pending request per user is efficient to query, though we enforce logic in API
PasswordChangeRequestSchema.index({ userId: 1, status: 1 });

export default mongoose.models.PasswordChangeRequest || mongoose.model('PasswordChangeRequest', PasswordChangeRequestSchema);
