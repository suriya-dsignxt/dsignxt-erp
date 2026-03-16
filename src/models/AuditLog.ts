import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
    actionType: {
        type: String,
        required: true,
    },
    entityType: {
        type: String,
        required: true,
    },
    entityId: {
        type: String, // Storing as String to accommodate ObjectId or other IDs flexibly
        required: true,
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    performerRole: {
        type: String,
        enum: ['ADMIN', 'EMPLOYEE'],
        required: true,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true, // Prevent updates to timestamp
    },
});

// Indexes for fast filtering
AuditLogSchema.index({ actionType: 1 });
AuditLogSchema.index({ entityType: 1 });
AuditLogSchema.index({ performedBy: 1 });
AuditLogSchema.index({ createdAt: -1 });

// Prevent updates/deletes? Mongoose middleware or just business logic? 
// The prompt asks for rules, usually implemented in API, but we can set strict query options if needed.
// For now, this schema definition supports the requirements.

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
