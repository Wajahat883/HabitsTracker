import mongoose from 'mongoose';
import HabitLog from './src/Models/HabitLog.js';
import Habit from './src/Models/Habit.js';

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/habit-tracker');

const habit = await Habit.findOne({ title: 'Dynamic Walking Test' });
console.log('Habit found:', habit ? habit.title : 'Not found');

if (habit) {
  const logs = await HabitLog.find({ habit: habit._id }).sort({ date: 1 });
  console.log(`\n📊 Tracking logs created: ${logs.length}`);
  logs.forEach(log => {
    console.log(`  ${log.date}: ${log.status} ${log.locked ? '(locked)' : '(editable)'}`);
  });
}

await mongoose.disconnect();