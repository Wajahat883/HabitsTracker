import Folder from '../Models/Folder.js';
import ApiError from '../utils/ApiErros.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const createFolder = async (req, res, next) => {
  try {
    const { name, color, icon } = req.body;
    if (!name || !name.trim()) throw new ApiError(400, 'Name required');
    const folder = await Folder.create({ user: req.user.userId, name: name.trim(), color, icon });
    return res.status(201).json(new ApiResponse(201, folder, 'Folder created'));
  } catch (e) { next(e); }
};

export const listFolders = async (req, res, next) => {
  try {
    const folders = await Folder.find({ user: req.user.userId, archived: false }).sort({ sortOrder: 1, createdAt: 1 });
    return res.json(new ApiResponse(200, folders));
  } catch (e) { next(e); }
};

export const updateFolder = async (req, res, next) => {
  try {
    const { name, color, icon, sortOrder } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    const folder = await Folder.findOneAndUpdate({ _id: req.params.id, user: req.user.userId }, updates, { new: true });
    if (!folder) throw new ApiError(404, 'Folder not found');
    return res.json(new ApiResponse(200, folder, 'Folder updated'));
  } catch (e) { next(e); }
};

export const archiveFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOneAndUpdate({ _id: req.params.id, user: req.user.userId }, { archived: true }, { new: true });
    if (!folder) throw new ApiError(404, 'Folder not found');
    return res.json(new ApiResponse(200, { success: true }, 'Folder archived'));
  } catch (e) { next(e); }
};

export const restoreFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOneAndUpdate({ _id: req.params.id, user: req.user.userId }, { archived: false }, { new: true });
    if (!folder) throw new ApiError(404, 'Folder not found');
    return res.json(new ApiResponse(200, folder, 'Folder restored'));
  } catch (e) { next(e); }
};

export const deleteFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
    if (!folder) throw new ApiError(404, 'Folder not found');
    return res.json(new ApiResponse(200, { success: true }, 'Folder deleted'));
  } catch (e) { next(e); }
};
