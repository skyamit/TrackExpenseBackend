const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  _id : {type: String, required: true},
  googleId: String,
  name: String,
  email: String,
});

module.exports = mongoose.model("User", UserSchema);
