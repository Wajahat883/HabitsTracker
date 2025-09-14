import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, minlength: 1, maxlength: 80 },
  color: { type: String },
  icon: { type: String },
  sortOrder: { type: Number, default: 0 },
  archived: { type: Boolean, default: false, index: true }
}, { timestamps: true });

folderSchema.index({ user: 1, name: 1 }, { unique: true });

const Folder = mongoose.model('Folder', folderSchema);
export default Folder;
