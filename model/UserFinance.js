const mongoose = require("mongoose");

const UserFinance = new mongoose.Schema({
  userId: String,
  currentBalance: Number,
  totalStocksInvestment: Number,
  totalMutualFundInvestment: Number
});

module.exports = mongoose.model("UserFinance", UserFinance);
