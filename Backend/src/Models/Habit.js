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
    isArchived: {
        type: Boolean,
        default: false,
        index: true
    }
}, { timestamps: true });

habitSchema.index({ user: 1, isArchived: 1 });
habitSchema.index({ user: 1, frequencyType: 1 });
habitSchema.index({ group: 1 });

const Habit = mongoose.model("Habit", habitSchema);
export default Habit;
