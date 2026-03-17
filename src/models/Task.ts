import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        goalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Goal',
            required: false,
        },
        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            default: 'Medium',
        },
        status: {
            type: String,
            enum: ['Pending', 'In Progress', 'Completed'],
            default: 'Pending',
        },
        progressPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        startDate: {
            type: Date,
            required: false,
        },
        endDate: {
            type: Date,
            required: false,
        },
        estimatedHours: {
            type: Number,
            required: false,
            min: 0,
            max: 1000,
        },
        dueDate: {
            type: Date,
            required: false,
        },
        employeeEstimatedDeadline: {
            type: Date,
            required: false,
        },
        attachments: [{
            filename: String,
            url: String, // Stringified base64 or path
            uploadedAt: { type: Date, default: Date.now },
            uploadedBy: String // Email or User ID
        }],
        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ status: 1 });

// Pre-save hook to handle status/progress/completedAt syncing and date validation
TaskSchema.pre('save', async function () {
    // Validate date range
    if (this.startDate && this.endDate && new Date(this.startDate) > new Date(this.endDate)) {
        throw new Error('Start date must be before end date');
    }

    // Backward compatibility: sync dueDate with endDate
    if (this.endDate && !this.dueDate) {
        this.dueDate = this.endDate;
    }

    // If status is "Completed", ensure progress is 100% and completedAt is set
    if (this.status === 'Completed') {
        this.progressPercentage = 100;
        if (!this.completedAt) {
            this.completedAt = new Date();
        }
    } else {
        // If status is changed back from "Completed", clear completedAt
        if (this.isModified('status')) {
            this.completedAt = null;
        }
    }
});

// Prevent compilation errors during hot reload
if (process.env.NODE_ENV !== 'production') {
    if (mongoose.models.Task) {
        delete mongoose.models.Task;
    }
}

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
