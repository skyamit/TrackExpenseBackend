const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  price: Number,
  quantity: Number,
  description: String,
  date: Date,
  symbol: { type: String, index: true },
  expenseId: { type: String, index: true }
});

module.exports = mongoose.model("Stock", stockSchema);
