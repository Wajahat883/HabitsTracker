import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 3, maxlength: 60 },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  habits: [{ type: mongoose.Schema.Types.ObjectId, ref: "Habit" }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

groupSchema.index({ creator: 1 });
groupSchema.index({ members: 1 });

const Group = mongoose.model("Group", groupSchema);
export default Group;
