const mongoose = require("mongoose");

const earningSchema = new mongoose.Schema({
  userId: { type: String, index: true }, 
  amount: Number,
  source: String,
  description: String,
  date: Date,
  medium: String,
  type: String,
  assetId: { type: String, index: true }, 
  liabilityId: { type: String, index: true }, 
});

module.exports = mongoose.model("Earning", earningSchema);
