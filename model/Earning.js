const mongoose = require("mongoose");

const earningSchema = new mongoose.Schema({
  userId: String,
  amount: Number,
  source: String,
  description: String,
  date: Date,
  medium: String,
  type: String, 
  assetId : String, 
  liabilityId : String
});

module.exports = mongoose.model("Earning", earningSchema);
