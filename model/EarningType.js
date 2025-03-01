const mongoose = require("mongoose");

const earningType = new mongoose.Schema({
  userId: String,
  earningType : String,
});

module.exports = mongoose.model("EarningType", earningType);
