const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, default: "info" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", MessageSchema);
