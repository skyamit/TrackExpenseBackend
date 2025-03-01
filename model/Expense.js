const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  userId: String,
  amount: Number,
  category: String,
  description: String,
  date: Date,
  medium: String,
});

module.exports = mongoose.model("Expense", expenseSchema);
