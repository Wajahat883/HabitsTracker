import mongoose from "mongoose";

const friendSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    friend: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false // Allow null for invite links
    },
    inviteEmail: {
        type: String,
        required: false // Store email for pending invites
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }
}, { timestamps: true });

const Friend = mongoose.model("Friend", friendSchema);
export default Friend;
