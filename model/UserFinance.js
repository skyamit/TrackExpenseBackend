const mongoose = require("mongoose");

const UserFinanceSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  currentBalance: Number,
  totalStocksInvestment: Number,
  totalMutualFundInvestment: Number
});

module.exports = mongoose.model("UserFinance", UserFinanceSchema);
