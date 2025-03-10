const Earning = require("../model/Earning");
const Expense = require("../model/Expense");
const UserFinance = require("../model/UserFinance");

async function financeSummary(req, res) {
  try {
    let { startDate, endDate, userId } = req.body;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required." });
    }

    startDate = new Date(startDate);
    endDate = new Date(endDate);

    const maxDays = 60 * 24 * 60 * 60 * 1000;
    if (endDate - startDate > maxDays) {
      return res
        .status(400)
        .json({ message: "Date range cannot exceed 60 days." });
    }

    const earnings = await Earning.aggregate([
      { $match: { userId: userId, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const expenses = await Expense.aggregate([
      { $match: { userId: userId, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    let userFinance = await UserFinance.find({ userId: userId });

    const totalEarnings = earnings.length ? earnings[0].total : 0;
    const totalExpenses = expenses.length ? expenses[0].total : 0;
    const balance = userFinance[0].currentBalance ? userFinance[0].currentBalance : 0;
    const savingsPercentage = (100.00 - (totalExpenses / totalEarnings)*100).toFixed(2);

    res.json({
      balance,
      totalEarnings,
      totalExpenses,
      savingsPercentage: `${savingsPercentage}%`,
    });
  } catch (error) {
    console.error("Error fetching finance summary:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = { financeSummary };
