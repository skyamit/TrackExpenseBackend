const mongoose = require("mongoose");

const MutualFundNavSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  date: { type: String, required: true }, 
  nav: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

const MutualFundNav = mongoose.model("MutualFundNav", MutualFundNavSchema);

module.exports = MutualFundNav;
