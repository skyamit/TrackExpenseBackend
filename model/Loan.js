const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  name: String,
  type: String,
  description: String,
  remainingAmount: Number,
  value: Number,
  date: Date,
  earningId: { type: String, index: true }
});

module.exports = mongoose.model("Loan", loanSchema);
