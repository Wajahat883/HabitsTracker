import mongoose from "mongoose";

const habitSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    details: {
        type: String
    },
    frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        required: true
    },
    trackingData: [{
        date: Date,
        value: String // check/cross or number/text
    }]
}, { timestamps: true });

const Habit = mongoose.model("Habit", habitSchema);
export default Habit;
