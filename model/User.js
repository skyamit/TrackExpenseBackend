const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  _id : {type: String, required: true},
  googleId: String,
  name: String,
  email: String,
  streakCount: { type: Number, default: 0 },
  lastLoggedDate: { type: Date },
  longestStreak: { type: Number, default: 0 },
  diamond: {type:Number, default:0},
  rewards: [{ type: String }]
});

module.exports = mongoose.model("User", UserSchema);
