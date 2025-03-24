const mongoose = require("mongoose");

const liabilitySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String },
  value: { type: Number, required: true },
  remainingAmount: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model("Liability", liabilitySchema);
