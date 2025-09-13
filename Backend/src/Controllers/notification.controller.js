import Notification from "../Models/Notification.js";
import User from "../Models/User.js";
import ApiError from "../utils/ApiErros.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Get user notifications
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user.userId })
      .populate('from', 'username email profilePicture')
      .sort({ createdAt: -1 })
      .limit(50);
    
    return res.json(new ApiResponse(200, notifications, 'Notifications fetched'));
  } catch (e) { next(e); }
};

// Mark notification as read
export const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: req.user.userId },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return next(new ApiError(404, 'Notification not found'));
    }
    
    return res.json(new ApiResponse(200, notification, 'Notification marked as read'));
  } catch (e) { next(e); }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.userId, read: false },
      { read: true }
    );
    
    return res.json(new ApiResponse(200, null, 'All notifications marked as read'));
  } catch (e) { next(e); }
};

// Get unread count
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ 
      user: req.user.userId, 
      read: false 
    });
    
    return res.json(new ApiResponse(200, { count }, 'Unread count fetched'));
  } catch (e) { next(e); }
};

// Create notification helper function
export const createNotification = async (userId, type, title, message, from = null, data = {}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      from,
      type,
      title,
      message,
      data
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Delete notification
export const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: req.user.userId
    });
    
    if (!notification) {
      return next(new ApiError(404, 'Notification not found'));
    }
    
    return res.json(new ApiResponse(200, null, 'Notification deleted'));
  } catch (e) { next(e); }
};
