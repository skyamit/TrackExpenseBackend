const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true }, // Mutual Fund, Stock, any other
  description: { type: String },
  value: { type: Number, required: true }, // quantity if stock, else amount
  date: { type: Date, required: true, default: Date.now }, // Purchase date
  code: { type: String, default: null}
});

module.exports = mongoose.model("Asset", assetSchema);
