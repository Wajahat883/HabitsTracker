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
    },
    // Deterministic ordering-based composite key to prevent duplicate inverse pairs
    pairKey: {
        type: String,
        required: true // Format lowerUserId:higherUserId (or invite variant)
    }
}, { timestamps: true });

// Enforce uniqueness of friendship pairs (irrespective of direction)
friendSchema.index({ pairKey: 1 }, { unique: true });
friendSchema.index({ user: 1, friend: 1 });

// Pre-validate hook to set pairKey even if friend not yet set (invite by email)
friendSchema.pre('validate', function (next) {
    if (this.user && this.friend) {
        const a = this.user.toString();
        const b = this.friend.toString();
        this.pairKey = a < b ? `${a}:${b}` : `${b}:${a}`;
    } else if (this.user && this.inviteEmail) {
        // For invites without friend user yet, namespace with email to avoid collision
        this.pairKey = `${this.user.toString()}:invite:${this.inviteEmail.toLowerCase()}`;
    }
    next();
});

const Friend = mongoose.model("Friend", friendSchema);
export default Friend;
