const {sendRegistrationEmail} = require("../mail/Mailservice");
const User = require("../model/User");
const UserFinance = require("../model/UserFinance");

async function loginUser(req, res) {
  try {
    console.log(req);
    const { googleId, name, email, picture } = req.body;
    if (!googleId) {
      return res.status(400).json({ error: "Google ID is required" });
    }
    let user = await User.findById(googleId);
    if (user && user.get("email") != email) {
      res.json({ message: "Invalid Email Id" });
    }
    if (!user) {
      user = new User({ _id: googleId, name, email, picture });
      sendRegistrationEmail(email, name);
      await user.save();
      console.log("New user inserted");
    }
    res.json({ googleId, message: "Login successful", name, email, picture });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getUserFinance(req, res) {
    try {
        const { userId} = req.body;
        let userFinance = await UserFinance.find({userId: userId});
        console.log(userFinance);
        if (userId && userFinance.length == 0) {
          uf = new UserFinance({userId: userId, currentBalance: 0, totalStocksInvestment: 0, totalMutualFundInvestment: 0})
          uf.save();
          userFinance.push(uf)
        }
        res.json({userFinance});
    } catch (error) {
        res.status(500).json({error : "Internal Server Error"});
    }
}

async function updateUserFinance(req, res) {
  try {
    const { _id, userId, currentBalance, totalMutualFundInvestment, totalStocksInvestment } = req.body;
    let finance = await UserFinance.findById(_id);
    if (!finance) {
      return res.status(404).json({ error: "Finance record not found" });
    }
    if (finance.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized: Invalid user" });
    }
    if (currentBalance !== undefined) finance.currentBalance = currentBalance;
    if (totalMutualFundInvestment !== undefined) finance.totalMutualFundInvestment = totalMutualFundInvestment;
    if (totalStocksInvestment !== undefined) finance.totalStocksInvestment = totalStocksInvestment;
    await finance.save();
    res.json({ message: "Record updated successfully", finance });
  } catch (error) {
    console.error("Error updating finance:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}


module.exports = { loginUser, getUserFinance, updateUserFinance };
