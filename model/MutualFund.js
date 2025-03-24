const mongoose = require("mongoose");

const mutualFundSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  name: String,
  schemeCode: { type: String, index: true },
  price: Number,
  quantity: Number,
  date: Date,
  expenseId: { type: String, index: true }
});

module.exports = mongoose.model("MututalFund", mutualFundSchema);
