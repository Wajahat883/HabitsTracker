import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false // For system notifications
    },
    type: {
        type: String,
        enum: ['friend_request', 'friend_accepted', 'habit_reminder', 'achievement', 'system'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed, // For storing additional data like friendRequestId
        default: {}
    },
    read: {
        type: Boolean,
        default: false
    },
    actionTaken: {
        type: Boolean,
        default: false // For friend requests that have been accepted/rejected
    }
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
