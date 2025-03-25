const mongoose = require("mongoose");

const savingsFundSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true, ref: "User" },
    fundName: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: false },
    totalAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, required: true, min: 0, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SavingsFund = mongoose.model("SavingsFund", savingsFundSchema);

module.exports = SavingsFund;
