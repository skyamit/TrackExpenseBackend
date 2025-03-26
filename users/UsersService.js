const { sendRegistrationEmail } = require("../mail/Mailservice");
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
      await sendRegistrationEmail(email, name);
      await user.save();
      console.log("New user inserted");
    }
    let finance = await UserFinance.find({ userId: user._id });
    if (finance.length == 0) {
      finance = new UserFinance({
        userId: user._id,
        currentBalance: 0,
        totalStocksInvestment: 0,
        totalMutualFundInvestment: 0,
      });
      finance.save();
    }
    res.json({ googleId, details: user, message: "Login successful" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function updateUser(req, res) {
  try {
    const { userId, userData } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userData.name && typeof userData.name !== "string") {
      return res.status(400).json({ error: "Invalid name format" });
    }

    if (userData.phone && !/^\d{10}$/.test(userData.phone)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    if (userData.dob && isNaN(Date.parse(userData.dob))) {
      return res.status(400).json({ error: "Invalid date of birth" });
    }

    user.name = userData.name || user.name;
    user.phone = userData.phone || user.phone;
    user.dob = userData.dob || user.dob;
    user.gender = userData.gender || user.gender;
    user.country = userData.country || user.country;
    user.city = userData.city || user.city;
    user.currency = userData.currency || user.currency;
    user.notifications =
      userData.notifications !== undefined
        ? userData.notifications
        : user.notifications;
    user.reportFrequency = userData.reportFrequency || user.reportFrequency;

    await user.save();
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getUserFinance(req, res) {
  try {
    const { userId } = req.body;
    let userFinance = await UserFinance.find({ userId: userId });
    if (userId && userFinance.length == 0) {
      res.status(500).json({ error: "Add earning to see balance" });
    } else res.json({ userFinance });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function updateUserFinance(req, res) {
  try {
    const {
      _id,
      userId,
      currentBalance,
      totalMutualFundInvestment,
      totalStocksInvestment,
    } = req.body.userFinance;
    console.log(userId);
    let finance = await UserFinance.findById(_id);
    console.log(finance);
    if (currentBalance !== undefined) finance.currentBalance = currentBalance;
    if (totalMutualFundInvestment !== undefined)
      finance.totalMutualFundInvestment = totalMutualFundInvestment;
    if (totalStocksInvestment !== undefined)
      finance.totalStocksInvestment = totalStocksInvestment;
    await finance.save();
    res.json({ message: "Record updated successfully", finance });
  } catch (error) {
    console.error("Error updating finance:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function streakUpdate(req, res) {
  const { userId } = req.body;
  const user = await User.findById(userId);
  const today = new Date().setHours(0, 0, 0, 0);
  const lastLogged = user.lastLoggedDate
    ? new Date(user.lastLoggedDate).setHours(0, 0, 0, 0)
    : null;
  if (lastLogged !== today) {
    if (lastLogged === today - 86400000) {
      user.streakCount += 1;
    } else {
      user.streakCount = 1;
    }
    user.longestStreak = Math.max(user.longestStreak, user.streakCount);
    user.lastLoggedDate = today;
    await user.save();
  }

  res.json({
    streakCount: user.streakCount,
    longestStreak: user.longestStreak,
    rewards: user.rewards,
    diamond: user.diamond,
  });
}

async function streakClaim(req, res) {
  try {
    const { userId, reward, title } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.rewards.includes(title)) {
      user.diamond = Number(user.diamond) + Number(reward); // Ensure both are numbers
      user.rewards.push(title);

      await user.save();
      return res.json({ message: "Reward claimed successfully" });
    } else {
      return res.status(400).json({ error: "Reward already claimed" });
    }
  } catch (error) {
    console.error("Error claiming reward:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  streakClaim,
  loginUser,
  getUserFinance,
  updateUserFinance,
  streakUpdate,
  updateUser
};
