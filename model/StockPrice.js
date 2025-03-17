const mongoose = require("mongoose");

const stockPriceSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  time: { type: String, required: true }, // Format: HH:MM:SS
  currentPrice: { type: Number, required: true },
  open: { type: Number },
  high: { type: Number },
  low: { type: Number },
  previousClose: { type: Number },
}, { timestamps: true });

const StockPrice = mongoose.model("StockPrice", stockPriceSchema);
module.exports = StockPrice;
