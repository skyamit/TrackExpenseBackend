const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
  userId: String,
  name: String, 
  type: String,// Mutual Fund, Stock, any other
  description : String, 
  value: Number,
  date : Date
});

module.exports = mongoose.model("Asset", assetSchema);
