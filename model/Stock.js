const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  userId: String,
  price: Number,
  quantity: Number,
  description: String,
  date: Date,
  symbol: String,
});

module.exports = mongoose.model("Stock", stockSchema);
