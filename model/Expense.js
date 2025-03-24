const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  amount: Number,
  category: String,
  description: String,
  date: Date,
  medium: String,
  type: String,
  assetId: { type: String, index: true },
  liabilityId: { type: String, index: true },
  recurrenceType: String,
});

module.exports = mongoose.model("Expense", expenseSchema);
