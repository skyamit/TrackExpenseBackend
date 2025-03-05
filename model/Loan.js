const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
  userId: String,
  name: String,
  type: String,
  description: String,
  remainingAmount: Number,
  value: Number,
  date: Date,
  earningId : String
});

module.exports = mongoose.model("Loan", loanSchema);