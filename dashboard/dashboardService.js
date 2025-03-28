const { subMonths, startOfMonth, format, endOfMonth } = require("date-fns");
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
    const balance = userFinance[0].currentBalance
      ? userFinance[0].currentBalance
      : 0;
    const savingsPercentage = (
      100.0 -
      (totalExpenses / totalEarnings) * 100
    ).toFixed(2);

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

async function getLast10Transactions(req, res) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const expenses = await Expense.find({ userId })
      .sort({ date: -1, _id: -1 })
      .limit(10)
      .select("amount category description date");

    const earnings = await Earning.find({ userId })
      .sort({ date: -1, _id: -1 })
      .limit(10)
      .select("amount source description date");

    const transactions = [
      ...expenses.map((e) => ({ ...e.toObject(), type: "expense" })),
      ...earnings.map((e) => ({ ...e.toObject(), type: "earning" })),
    ]
      .sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        return dateDiff !== 0
          ? dateDiff
          : b._id.toString().localeCompare(a._id.toString());
      })
      .slice(0, 10);

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching latest transactions:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getEarningSummaryBetween(req, res) {
  try {
    const { userId, startDate, endDate } = req.body;

    const earnings = await Earning.aggregate([
      {
        $match: {
          userId,
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      { $group: { _id: "$source", totalAmount: { $sum: "$amount" } } },
      { $sort: { totalAmount: -1 } },
    ]);

    let groupedEarnings = [];
    let othersTotal = 0;

    earnings.forEach((entry, index) => {
      if (index < 8) {
        groupedEarnings.push(entry);
      } else {
        othersTotal += entry.totalAmount;
      }
    });

    if (othersTotal > 0) {
      groupedEarnings.push({ _id: "Others", totalAmount: othersTotal });
    }

    res.json(groupedEarnings);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getExpenseSummaryBetween(req, res) {
  try {
    const { userId, startDate, endDate } = req.body;
    const expenses = await Expense.aggregate([
      {
        $match: {
          userId,
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      { $group: { _id: "$category", totalAmount: { $sum: "$amount" } } },
      { $sort: { totalAmount: -1 } },
    ]);
    const totalExpenses = expenses.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    let groupedExpenses = [];
    let othersTotal = 0;

    expenses.forEach((entry, index) => {
      const percentage = (entry.totalAmount / totalExpenses) * 100;
      if (index < 8) {
        groupedExpenses.push(entry);
      } else {
        othersTotal += entry.totalAmount;
      }
    });
    if (othersTotal > 0) {
      groupedExpenses.push({ _id: "Others", totalAmount: othersTotal });
    }

    res.json(groupedExpenses);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getIncomeExpenseSummary(req, res) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const months = [];

    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));

      months.push({
        month: format(monthStart, "MMM"),
        startDate: monthStart,
        endDate: monthEnd,
      });
    }

    const results = await Promise.all(
      months.map(async ({ month, startDate, endDate }) => {
        const [totalEarnings] = await Earning.aggregate([
          {
            $match: {
              userId: userId,
              date: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: { _id: null, total: { $sum: "$amount" } },
          },
        ]);

        const [totalExpenses] = await Expense.aggregate([
          {
            $match: {
              userId: userId,
              date: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: { _id: null, total: { $sum: "$amount" } },
          },
        ]);

        return {
          month,
          income: totalEarnings ? totalEarnings.total : 0,
          expense: totalExpenses ? totalExpenses.total : 0,
        };
      })
    );

    res.json(results);
  } catch (error) {
    console.error("Error fetching income-expense summary:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = {
  financeSummary,
  getLast10Transactions,
  getEarningSummaryBetween,
  getExpenseSummaryBetween,
  getIncomeExpenseSummary,
};
