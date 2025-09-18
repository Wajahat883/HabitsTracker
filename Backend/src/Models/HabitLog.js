import mongoose from "mongoose";

const habitLogSchema = new mongoose.Schema({
  habit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Habit",
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true
  }, // store as YYYY-MM-DD UTC string
  // When a day rolls over we lock previous-day entries to prevent further edits
  locked: {
    type: Boolean,
    default: false,
    index: true
  },
  status: {
    type: String,
    enum: [
      "completed",
      "missed",
      "skipped",
      "partial"
    ],
    required: true
  },
  note: {
    type: String,
    maxlength: 300
  }
}, { timestamps: true });

habitLogSchema.index({
  habit: 1,
  date: 1
},
  {
    unique: true
  });
habitLogSchema.index({
  user: 1,
  date: 1
});
// For quickly fetching a user's recent activity timeline
habitLogSchema.index({
  user: 1,
  createdAt: -1
});

const HabitLog = mongoose.model("HabitLog", habitLogSchema);
export default HabitLog;
