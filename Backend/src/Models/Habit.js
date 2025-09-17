import mongoose from "mongoose";

const habitSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        index: true
    }, // optional for group habits
    title: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 60
    },
    description: {
        type: String,
        maxlength: 300
    },
    frequencyType: {
        type: String,
        enum: ["daily", "weekly", "monthly", "custom"],
        required: true
    },
    daysOfWeek: [
        {
            type: Number,
            min: 0,
            max: 6
        }
    ], // required when weekly
    timesPerPeriod: {
        type: Number,
        min: 1
    },
    colorTag: {
        type: String
    },
    icon: {
        type: String
    },
    // New optional enrichment fields
    durationMinutes: {
        type: Number,
        min: 1
    },
    targetCount: {
        type: Number,
        min: 1
    },
    customConfig: {
        type: mongoose.Schema.Types.Mixed
    },
    // Scheduling window (inclusive) and optional reminder time (HH:MM 24h)
    startDate: {
        type: String,
        match: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/
    },
    endDate: {
        type: String,
        match: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/
    },
    reminderTime: {
        type: String,
        match: /^([01][0-9]|2[0-3]):[0-5][0-9]$/
    },
    isArchived: {
        type: Boolean,
        default: false,
        index: true
    }
}, { timestamps: true });

habitSchema.index({ user: 1, isArchived: 1 });
habitSchema.index({ user: 1, frequencyType: 1 });
// group field already declared with index:true; removing duplicate explicit index

const Habit = mongoose.model("Habit", habitSchema);
export default Habit;
