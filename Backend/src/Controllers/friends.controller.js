import User from "../Models/User.js";
import Friend from "../Models/Friend.js";
import FriendRequest from "../Models/FriendRequest.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErros.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Discover users for friend suggestions
export const discoverUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = "" } = req.query;
    const userId = req.user._id;
    
    // Get existing friends and sent/received requests to exclude
    const existingFriends = await Friend.find({
        $or: [
            { user: userId, status: 'accepted' },
            { friend: userId, status: 'accepted' }
        ]
    }).distinct('friend user');
    
    const existingRequests = await FriendRequest.find({
        $or: [
            { sender: userId },
            { receiver: userId }
        ]
    }).distinct('sender receiver');
    
    // Combine all IDs to exclude (friends + requests + self)
    const excludeIds = [...existingFriends, ...existingRequests, userId]
        .filter(id => id) // Remove null values
        .map(id => id.toString());
    
    // Build search query
    const searchQuery = {
        _id: { $nin: excludeIds },
        ...(search && {
            $or: [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        })
    };
    
    const users = await User.find(searchQuery)
        .select('username email profilePicture createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });
    
    // Add mutual friends count for each user
    const usersWithMutualCount = await Promise.all(
        users.map(async (user) => {
            const mutualCount = await FriendRequest.getMutualFriendsCount(userId, user._id);
            return {
                ...user.toObject(),
                mutualFriendsCount: mutualCount
            };
        })
    );
    
    const total = await User.countDocuments(searchQuery);
    
    return res.status(200).json(
        new ApiResponse(200, {
            users: usersWithMutualCount,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        }, "Users fetched successfully")
    );
});

// Send friend request
export const sendFriendRequest = asyncHandler(async (req, res) => {
    const { receiverId, message = "" } = req.body;
    const senderId = req.user._id;
    
    if (senderId.toString() === receiverId) {
        throw new ApiError(400, "Cannot send friend request to yourself");
    }
    
    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
        throw new ApiError(404, "User not found");
    }
    
    // Check if already friends
    const existingFriendship = await Friend.findOne({
        $or: [
            { user: senderId, friend: receiverId, status: 'accepted' },
            { user: receiverId, friend: senderId, status: 'accepted' }
        ]
    });
    
    if (existingFriendship) {
        throw new ApiError(400, "Already friends with this user");
    }
    
    // Check if request already exists
    const existingRequest = await FriendRequest.requestExists(senderId, receiverId);
    if (existingRequest) {
        throw new ApiError(400, "Friend request already exists");
    }
    
    // Create friend request
    const friendRequest = await FriendRequest.create({
        sender: senderId,
        receiver: receiverId,
        message: message.trim()
    });
    
    await friendRequest.populate('sender', 'username email profilePicture');
    
    // Emit real-time notification
    const io = req.app.get('io');
    const broadcastToUser = req.app.get('broadcastToUser');
    if (io && broadcastToUser) {
        broadcastToUser(receiverId, 'friendRequest:received', {
            request: friendRequest,
            sender: friendRequest.sender
        });
    }
    
    return res.status(201).json(
        new ApiResponse(201, friendRequest, "Friend request sent successfully")
    );
});

// Get received friend requests
export const getReceivedRequests = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { status = 'pending' } = req.query;
    
    const requests = await FriendRequest.find({
        receiver: userId,
        status: status
    })
    .populate('sender', 'username email profilePicture createdAt')
    .sort({ createdAt: -1 });
    
    return res.status(200).json(
        new ApiResponse(200, requests, "Friend requests fetched successfully")
    );
});

// Get sent friend requests
export const getSentRequests = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { status = 'pending' } = req.query;
    
    const requests = await FriendRequest.find({
        sender: userId,
        status: status
    })
    .populate('receiver', 'username email profilePicture createdAt')
    .sort({ createdAt: -1 });
    
    return res.status(200).json(
        new ApiResponse(200, requests, "Sent requests fetched successfully")
    );
});

// Accept/Reject friend request
export const respondToFriendRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const userId = req.user._id;
    
    if (!['accept', 'reject'].includes(action)) {
        throw new ApiError(400, "Action must be 'accept' or 'reject'");
    }
    
    const friendRequest = await FriendRequest.findOne({
        _id: requestId,
        receiver: userId,
        status: 'pending'
    }).populate('sender', 'username email profilePicture');
    
    if (!friendRequest) {
        throw new ApiError(404, "Friend request not found");
    }
    
    // Update request status
    friendRequest.status = action === 'accept' ? 'accepted' : 'rejected';
    await friendRequest.save();
    
    // If accepted, create friendship
    if (action === 'accept') {
        const friendship = await Friend.create({
            user: friendRequest.sender._id,
            friend: userId,
            status: 'accepted'
        });
        
        // Emit real-time notifications
        const io = req.app.get('io');
        const broadcastToUser = req.app.get('broadcastToUser');
        if (io && broadcastToUser) {
            // Notify sender that request was accepted
            broadcastToUser(friendRequest.sender._id, 'friendRequest:accepted', {
                friend: {
                    _id: userId,
                    username: req.user.username,
                    email: req.user.email,
                    profilePicture: req.user.profilePicture
                }
            });
            
            // Notify receiver about new friend
            broadcastToUser(userId, 'friend:new', {
                friend: friendRequest.sender
            });
        }
    }
    
    return res.status(200).json(
        new ApiResponse(200, friendRequest, `Friend request ${action}ed successfully`)
    );
});

// Get friends list (followers/following)
export const getFriends = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { type = 'all' } = req.query; // 'followers', 'following', 'all'
    
    let query = {};
    
    if (type === 'followers') {
        query = { friend: userId, status: 'accepted' };
    } else if (type === 'following') {
        query = { user: userId, status: 'accepted' };
    } else {
        query = {
            $or: [
                { user: userId, status: 'accepted' },
                { friend: userId, status: 'accepted' }
            ]
        };
    }
    
    const friends = await Friend.find(query)
        .populate('user', 'username email profilePicture createdAt')
        .populate('friend', 'username email profilePicture createdAt')
        .sort({ createdAt: -1 });
    
    // Format response to show the friend (not self)
    const formattedFriends = friends.map(friendship => {
        const friend = friendship.user._id.toString() === userId.toString() 
            ? friendship.friend 
            : friendship.user;
        
        return {
            friendshipId: friendship._id,
            friend: friend,
            since: friendship.createdAt,
            type: friendship.user._id.toString() === userId.toString() ? 'following' : 'follower'
        };
    });
    
    const stats = {
        followers: formattedFriends.filter(f => f.type === 'follower').length,
        following: formattedFriends.filter(f => f.type === 'following').length,
        total: formattedFriends.length
    };
    
    return res.status(200).json(
        new ApiResponse(200, {
            friends: type === 'all' ? formattedFriends : formattedFriends.filter(f => 
                type === 'followers' ? f.type === 'follower' : f.type === 'following'
            ),
            stats
        }, "Friends fetched successfully")
    );
});

// Remove friend/Unfollow
export const removeFriend = asyncHandler(async (req, res) => {
    const { friendId } = req.params;
    const userId = req.user._id;
    
    const friendship = await Friend.findOneAndDelete({
        $or: [
            { user: userId, friend: friendId, status: 'accepted' },
            { user: friendId, friend: userId, status: 'accepted' }
        ]
    });
    
    if (!friendship) {
        throw new ApiError(404, "Friendship not found");
    }
    
    // Emit real-time notification
    const io = req.app.get('io');
    const broadcastToUser = req.app.get('broadcastToUser');
    if (io && broadcastToUser) {
        broadcastToUser(friendId, 'friend:removed', {
            removedBy: userId
        });
    }
    
    return res.status(200).json(
        new ApiResponse(200, null, "Friend removed successfully")
    );
});

// Get friend request notifications count
export const getNotificationCount = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const pendingRequestsCount = await FriendRequest.countDocuments({
        receiver: userId,
        status: 'pending'
    });
    
    return res.status(200).json(
        new ApiResponse(200, { count: pendingRequestsCount }, "Notification count fetched")
    );
});