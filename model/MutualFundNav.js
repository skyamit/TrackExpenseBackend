const mongoose = require("mongoose");

const MutualFundNavSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // Unique Scheme Code
  name: { type: String, required: true }, // Mutual Fund Name
  date: { type: String, required: true }, // NAV Date (YYYY-MM-DD)
  nav: { type: Number, required: true }, // Latest NAV Value
  lastUpdated: { type: Date, default: Date.now }, // Timestamp when last updated
});

const MutualFundNav = mongoose.model("MutualFundNav", MutualFundNavSchema);

module.exports = MutualFundNav;
