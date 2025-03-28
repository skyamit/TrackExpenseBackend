const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  googleId: { type: String, index: true },
  name: String,
  email: { type: String, index: true },
  phone: {type:String},
  dob: {type: String},
  country : {type: String},
  city : {type: String},
  currency : {type: String},
  notifications:{type: String},
  reportFrequency : {type: String},
  gender: {type: String},
  streakCount: { type: Number, default: 0 },
  lastLoggedDate: { type: Date },
  longestStreak: { type: Number, default: 0 },
  diamond: { type: Number, default: 0 },
  rewards: [{ type: String }]
});

module.exports = mongoose.model("User", UserSchema);
