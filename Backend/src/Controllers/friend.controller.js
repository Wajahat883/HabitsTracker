import Friend from "../Models/Friend.js";
import User from "../Models/User.js";
import ApiError from "../utils/ApiErros.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { createNotification } from "./notification.controller.js";

// Send an invite (in dev we just create a pending Friend doc)
export const inviteFriend = async (req, res, next) => {
  try {
    const { email, userId } = req.body;
    // allow invite by email or userId; prefer resolving email to user if exists
    let targetUser = null;
    if (userId) targetUser = await User.findById(userId);
    else if (email) targetUser = await User.findOne({ email });

    if (!targetUser) {
      // In dev return a shareable token/link instead of sending email
      const invite = await Friend.create({ 
        user: req.user.userId, 
        friend: null, 
        inviteEmail: email,
        status: 'pending' 
      });
      return res.status(201).json(new ApiResponse(201, { inviteId: invite._id, link: `/invite/${invite._id}` }, 'Invite created (dev)'));
    }

    // prevent inviting self
    if (targetUser._id.equals(req.user.userId)) return next(new ApiError(400, 'Cannot invite yourself'));

    // check existing relationship
    const existing = await Friend.findOne({ user: req.user.userId, friend: targetUser._id });
    if (existing) return res.json(new ApiResponse(200, existing, 'Invite already exists'));

    const friend = await Friend.create({ user: req.user.userId, friend: targetUser._id, status: 'pending' });
    
    // Create notification for target user
    const currentUser = await User.findById(req.user.userId);
    await createNotification(
      targetUser._id,
      'friend_request',
      'New Friend Request',
      `${currentUser.username || currentUser.email} wants to be your habit buddy!`,
      req.user.userId,
      { friendRequestId: friend._id }
    );
    
    return res.status(201).json(new ApiResponse(201, friend, 'Invite created'));
  } catch (e) { next(e); }
};

export const acceptInvite = async (req, res, next) => {
  try {
    const { inviteId } = req.body;
    const invite = await Friend.findById(inviteId);
    if (!invite) return next(new ApiError(404, 'Invite not found'));
    
    // If invite has email but no friend, check if current user matches email
    if (!invite.friend && invite.inviteEmail) {
      const currentUser = await User.findById(req.user.userId);
      if (currentUser.email !== invite.inviteEmail) {
        return next(new ApiError(403, 'This invite is not for your email'));
      }
      // Update invite with current user as friend
      invite.friend = req.user.userId;
    }
    
    // accept only if current user is the recipient
    if (!invite.friend || !invite.friend.equals(req.user.userId)) return next(new ApiError(403, 'Not allowed'));
    invite.status = 'accepted';
    await invite.save();
    // create reciprocal relationship
    const reciprocal = await Friend.findOneAndUpdate(
      { user: req.user.userId, friend: invite.user },
      { user: req.user.userId, friend: invite.user, status: 'accepted' },
      { upsert: true, new: true }
    );
    // also add to users' friends array
    await User.findByIdAndUpdate(req.user.userId, { $addToSet: { friends: invite.user } });
    await User.findByIdAndUpdate(invite.user, { $addToSet: { friends: req.user.userId } });
    
    // Create notification for the person who sent the invite
    const accepter = await User.findById(req.user.userId);
    await createNotification(
      invite.user,
      'friend_accepted',
      'Friend Request Accepted!',
      `${accepter.username || accepter.email} accepted your friend request. You're now habit buddies!`,
      req.user.userId
    );
    
    return res.json(new ApiResponse(200, { invite, reciprocal }, 'Invite accepted'));
  } catch (e) { next(e); }
};

export const listFriends = async (req, res, next) => {
  try {
    // list accepted friendships where user is either the requester or recipient
    const outgoing = await Friend.find({ user: req.user.userId, status: 'accepted' }).populate('friend', 'username email profilePicture');
    const incoming = await Friend.find({ friend: req.user.userId, status: 'accepted' }).populate('user', 'username email profilePicture');
    const friends = [];
    outgoing.forEach(o => friends.push({ _id: o.friend._id, name: o.friend.username, email: o.friend.email, profilePicture: o.friend.profilePicture }));
    incoming.forEach(i => friends.push({ _id: i.user._id, name: i.user.username, email: i.user.email, profilePicture: i.user.profilePicture }));
    return res.json(new ApiResponse(200, friends));
  } catch (e) { next(e); }
};

export const removeFriend = async (req, res, next) => {
  try {
    const friendId = req.params.id;
    // remove both directions
    await Friend.deleteMany({ $or: [ { user: req.user.userId, friend: friendId }, { user: friendId, friend: req.user.userId } ] });
    await User.findByIdAndUpdate(req.user.userId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: req.user.userId } });
    return res.json(new ApiResponse(200, null, 'Friend removed'));
  } catch (e) { next(e); }
};

export const getFriendHabits = async (req, res, next) => {
  try {
    const friendId = req.params.id;
    // check privacy: only return if public or friends and are friends
    const friendUser = await User.findById(friendId).select('privacy');
    if (!friendUser) return next(new ApiError(404, 'User not found'));
    const isFriend = await Friend.findOne({ user: req.user.userId, friend: friendId, status: 'accepted' }) || await Friend.findOne({ user: friendId, friend: req.user.userId, status: 'accepted' });
    if (friendUser.privacy === 'private' && !isFriend) return next(new ApiError(403, 'Not allowed'));
    const Habit = (await import('../Models/Habit.js')).default;
    const visibility = friendUser.privacy === 'public' ? {} : { $in: ['public', 'friends'] };
    const habits = await Habit.find({ user: friendId, isArchived: false });
    // filter by habit-level privacy if present (assume habit has visibility field)
    const filtered = habits.filter(h => !h.visibility || h.visibility === 'public' || (h.visibility === 'friends' && isFriend));
    return res.json(new ApiResponse(200, filtered));
  } catch (e) { next(e); }
};

export const getFriendRequests = async (req, res, next) => {
  try {
    // Get pending requests where current user is the recipient
    const requests = await Friend.find({ 
      friend: req.user.userId, 
      status: 'pending' 
    }).populate('user', 'username email profilePicture');
    
    const formattedRequests = requests.map(request => ({
      _id: request._id,
      from: {
        _id: request.user._id,
        name: request.user.username,
        email: request.user.email,
        profilePicture: request.user.profilePicture
      },
      status: request.status,
      createdAt: request.createdAt
    }));
    
    return res.json(new ApiResponse(200, formattedRequests));
  } catch (e) { next(e); }
};

export const acceptFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const request = await Friend.findById(requestId);
    
    if (!request) return next(new ApiError(404, 'Friend request not found'));
    if (!request.friend.equals(req.user.userId)) return next(new ApiError(403, 'Not authorized'));
    if (request.status !== 'pending') return next(new ApiError(400, 'Request already processed'));
    
    // Update request status
    request.status = 'accepted';
    await request.save();
    
    // Create reciprocal relationship
    await Friend.findOneAndUpdate(
      { user: req.user.userId, friend: request.user },
      { user: req.user.userId, friend: request.user, status: 'accepted' },
      { upsert: true, new: true }
    );
    
    return res.json(new ApiResponse(200, request, 'Friend request accepted'));
  } catch (e) { next(e); }
};

export const rejectFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const request = await Friend.findById(requestId);
    
    if (!request) return next(new ApiError(404, 'Friend request not found'));
    if (!request.friend.equals(req.user.userId)) return next(new ApiError(403, 'Not authorized'));
    if (request.status !== 'pending') return next(new ApiError(400, 'Request already processed'));
    
    // Delete the request
    await Friend.findByIdAndDelete(requestId);
    
    return res.json(new ApiResponse(200, null, 'Friend request rejected'));
  } catch (e) { next(e); }
};

// Public route to accept invite via link (no auth required)
export const acceptInviteByLink = async (req, res, next) => {
  try {
    const { inviteId } = req.params;
    const invite = await Friend.findById(inviteId).populate('user', 'username email');
    
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found or expired' });
    }
    
    if (invite.status !== 'pending') {
      return res.status(400).json({ error: 'Invite already processed' });
    }
    
    // Return invite details for frontend to show
    return res.json(new ApiResponse(200, {
      inviteId: invite._id,
      from: {
        name: invite.user.username,
        email: invite.user.email
      },
      inviteEmail: invite.inviteEmail,
      status: invite.status
    }, 'Invite details'));
  } catch (e) { next(e); }
};
