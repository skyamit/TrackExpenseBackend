const mongoose = require("mongoose");

const liabiiltySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true }, // E.g., "Home Loan", "Car Loan"
  type: { type: String, required: true },
  description: { type: String },
  value: { type: Number, required: true }, // Total liability amount
  remainingAmount: { type: Number, required: true }, // Remaining amount to be paid
  date: { type: Date, required: true, default: Date.now }, // Loan start date
});

module.exports = mongoose.model("Liability", liabiiltySchema);
