const Earning = require("../model/Earning");
const Expense = require("../model/Expense");
const Liability = require("../model/Liability");
const Loan = require("../model/Loan");
const UserFinance = require("../model/UserFinance");

async function saveLiability({
  userId,
  name,
  type,
  description,
  remainingAmount,
  value,
  date,
}) {
  try {
    let liability = new Liability({
      userId,
      name,
      type,
      description,
      value,
      date,
      remainingAmount,
    });
    await liability.save();
    return liability._id;
  } catch (error) {
    console.log(error);
  }
  return null;
}

async function deleteLiability(req, res) {
  try {
    let { liabilityId } = req.body;
    let liability = await Liability.findById(liabilityId);
    if (liability) {
      await Liability.deleteOne({ _id: liability });
      await Earning.deleteMany({ liabilityId: liabilityId });
      await Expense.deleteOne({ liabilityId: liabilityId });
      res.json({ message: "Deleted liability successfully" });
    } else {
      res.status(500).json({ message: "Invalid liability" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function updateLiabilityByAmount({ liabilityId, paid }) {
  let liability = await Liability.findById(liabilityId);
  let nRemainingAmount = Number(liability.remainingAmount) - Number(paid);
  let expense = new Expense({
    userId: liability.userId,
    amount: Number(paid),
    category: liability.name,
    description: "Paid for" + liability.name,
    date: new Date().toISOString().split("T")[0],
    medium: "online",
    type: "liability",
    liabilityType: "liability",
    liabilityId: liabilityId,
  });
  await expense.save();
  if (nRemainingAmount == 0) {
    await Liability.deleteOne({ _id: liabilityId });
    return "Liability paid successfully";
  } else {
    liability.remainingAmount = nRemainingAmount;
    await liability.save();
    return "Liability updated successfully";
  }
}

async function updateLiability(req, res) {
  try {
    let { liabilityId, paid } = req.body;
    let message = await updateLiabilityByAmount({ liabilityId, paid });
    res.json({
      message: message,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getAllLiability(req, res) {
  try {
    const { userId, limit = 10, offset = 0, filter = {} } = req.body;
    const pageLimit = parseInt(limit, 10);
    const pageOffset = parseInt(offset, 10);
    const { year = 2025, month, query } = filter;

    let searchQuery = {
      userId: userId,
      date: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${parseInt(year) + 1}-01-01`),
      },
    };

    if (month) {
      searchQuery.date = {
        $gte: new Date(`${year}-${month}-01`),
        $lt: new Date(`${year}-${parseInt(month) + 1}-01`),
      };
    }
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    let liabilityList = await Liability.find(searchQuery)
      .skip(pageOffset)
      .limit(pageLimit)
      .sort({ date: -1, _id: -1 });

    let count = await Liability.countDocuments(searchQuery);

    res.json({
      liabilityList,
      count,
      limit: pageLimit,
      offset: pageOffset,
      totalPages: Math.ceil(count / pageLimit),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function liabilitySummary(req, res) {
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

    const loans = await Loan.aggregate([
      { $match: { userId: userId, date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          total: { $sum: "$remainingAmount" },
        },
      },
    ]);

    const liability = await Liability.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: "$remainingAmount" },
        },
      },
    ]);
    const totalLiability = liability.length ? liability[0].total : 0;
    const totalLoan = loans.length ? loans[0].total : 0;

    res.json({
      totalLoan,
      totalLiability
    });
  } catch (error) {
    console.error("Error fetching finance summary:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getLoanBetween(req, res) {
  try {
    const { userId } = req.body;

    const loan = await Loan.aggregate([
      {
        $match: {
          userId,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          remainingAmount: 1,
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          remainingAmount: { $first: "$remainingAmount" },
        },
      },
      { $sort: { remainingAmount: -1 } },
    ]);

    let groupedLoans = [];
    let othersTotal = 0;

    loan.forEach((entry, index) => {
      if (index < 5) {
        groupedLoans.push(entry);
      } else {
        othersTotal += entry.remainingAmount;
      }
    });

    if (othersTotal > 0) {
      groupedLoans.push({
        _id: "Others",
        name: "Others",
        remainingAmount: othersTotal,
      });
    }

    res.json(groupedLoans);
  } catch (error) {
    console.error("Error fetching stock data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  getAllLiability,
  saveLiability,
  deleteLiability,
  updateLiability,
  updateLiabilityByAmount,
  liabilitySummary,
  getLoanBetween,
};
