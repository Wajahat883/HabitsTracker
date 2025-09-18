import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    },
    message: {
        type: String,
        maxLength: 200,
        default: ""
    }
}, { 
    timestamps: true 
});

// Ensure no duplicate requests between same users
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
friendRequestSchema.index({ receiver: 1, status: 1 }); // For fetching pending requests
friendRequestSchema.index({ sender: 1, status: 1 }); // For sent requests

// Static method to check if request exists
friendRequestSchema.statics.requestExists = async function(senderId, receiverId) {
    return await this.findOne({
        $or: [
            { sender: senderId, receiver: receiverId },
            { sender: receiverId, receiver: senderId }
        ]
    });
};

// Static method to get mutual friends count
friendRequestSchema.statics.getMutualFriendsCount = async function(userId1, userId2) {
    const Friend = mongoose.model('Friend');
    
    // Get friends of user1
    const user1Friends = await Friend.find({
        $or: [
            { user: userId1, status: 'accepted' },
            { friend: userId1, status: 'accepted' }
        ]
    }).distinct('friend user');
    
    // Get friends of user2  
    const user2Friends = await Friend.find({
        $or: [
            { user: userId2, status: 'accepted' },
            { friend: userId2, status: 'accepted' }
        ]
    }).distinct('friend user');
    
    // Remove self references and find intersection
    const user1FriendIds = user1Friends.filter(id => id.toString() !== userId1.toString());
    const user2FriendIds = user2Friends.filter(id => id.toString() !== userId2.toString());
    
    const mutualCount = user1FriendIds.filter(id => 
        user2FriendIds.some(friendId => friendId.toString() === id.toString())
    ).length;
    
    return mutualCount;
};

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
export default FriendRequest;