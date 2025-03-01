const mongoose = require("mongoose");

const expenseType = new mongoose.Schema({
  userId: String,
  expenseType : String,
});

module.exports = mongoose.model("ExpenseType", expenseType);
