const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true, index: true },
  description: { type: String },
  value: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  code: { type: String, default: null, index: true },
});

module.exports = mongoose.model("Asset", assetSchema);
