const mongoose = require("mongoose");

const stockPriceSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, index: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  currentPrice: { type: Number, required: true },
  open: { type: Number },
  high: { type: Number },
  low: { type: Number },
  previousClose: { type: Number }
}, { timestamps: true });

const StockPrice = mongoose.model("StockPrice", stockPriceSchema);
module.exports = StockPrice;
