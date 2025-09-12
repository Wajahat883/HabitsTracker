import Group from "../Models/Group.js";
import Habit from "../Models/Habit.js";
import ApiError from "../utils/ApiErros.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createGroup = async (req, res, next) => {
  try {
    const { name, memberIds } = req.body;
    const members = [req.user.userId, ...(memberIds || [])];
    const group = await Group.create({ name, creator: req.user.userId, members });
    return res.status(201).json(new ApiResponse(201, group, 'Group created'));
  } catch (e) { next(e); }
};

export const listGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({ members: req.user.userId, isActive: true }).populate('members', 'name email').populate('habits');
    return res.json(new ApiResponse(200, groups));
  } catch (e) { next(e); }
};

export const getGroup = async (req, res, next) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, members: req.user.userId }).populate('members', 'name email').populate('habits');
    if (!group) throw new ApiError(404, 'Group not found');
    return res.json(new ApiResponse(200, group));
  } catch (e) { next(e); }
};

export const addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const group = await Group.findOneAndUpdate(
      { _id: req.params.id, creator: req.user.userId },
      { $addToSet: { members: userId } },
      { new: true }
    );
    if (!group) throw new ApiError(404, 'Group not found or not creator');
    return res.json(new ApiResponse(200, group, 'Member added'));
  } catch (e) { next(e); }
};

export const createGroupHabit = async (req, res, next) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, members: req.user.userId });
    if (!group) throw new ApiError(404, 'Group not found');
    const habitData = { ...req.body, user: req.user.userId, group: group._id };
    const habit = await Habit.create(habitData);
    await Group.findByIdAndUpdate(group._id, { $push: { habits: habit._id } });
    return res.status(201).json(new ApiResponse(201, habit, 'Group habit created'));
  } catch (e) { next(e); }
};

export const listGroupHabits = async (req, res, next) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, members: req.user.userId });
    if (!group) throw new ApiError(404, 'Group not found');
    const habits = await Habit.find({ group: group._id, isArchived: false });
    return res.json(new ApiResponse(200, habits));
  } catch (e) { next(e); }
};
