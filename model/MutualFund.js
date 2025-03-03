const mongoose = require("mongoose");

const mutualFundSchema = new mongoose.Schema({
  userId : String,
  name : String, 
  schemeCode : String,
  price : Number,
  quantity : Number, 
  date: Date, 
  expenseId: String
});

module.exports = mongoose.model("MututalFund", mutualFundSchema);
