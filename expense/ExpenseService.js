const { saveAsset } = require("../asset/assetService");
const { getNextPaymentDate } = require("../common/Utility");
const {
  saveLiability,
  updateLiability,
} = require("../liability/liabilityService");
const { startOfToday } = require("date-fns");
const Expense = require("../model/Expense");
const ExpenseType = require("../model/ExpenseType");

async function saveExpense({
  userId,
  amount,
  type,
  category,
  description,
  date,
  medium,
  assetType,
  quantity,
  liabilityType,
  liabilityId,
  recurrenceType
}) {
  try {
    let assetObj = null;
    if (type == "asset") {
      let amt = amount;
      if (assetType == "Stock" || assetType == "Mutual Fund") {
        amt = quantity;
      }
      assetObj = await saveAsset({
        userId,
        value: amt,
        name: category,
        description,
        date,
        type: assetType,
      });
    } else if (type == "liability") {
      let amt = amount;
      if (liabilityType == "Loan") {
        await updateLiability({ liabilityId, reducedAmount: amt });
      } else {
        liabilityId = await saveLiability({
          userId,
          value: amt,
          remainingAmount: amt,
          name: category,
          description,
          date,
          type: type,
        });
      }
    }
    let expense = new Expense({
      userId,
      amount,
      type,
      category,
      description,
      date,
      medium,
      assetId: assetObj?._id,
      liabilityId,
      recurrenceType
    });
    await expense.save();
    return expense._id;
  } catch (error) {
    console.log(error);
  }
  return null;
}

async function createExpense(req, res) {
  try {
    const {
      userId,
      amount,
      type,
      category,
      description,
      date,
      medium,
      recurrenceType = "none",
    } = req.body;
    await saveExpense({
      userId,
      amount,
      type,
      category,
      description,
      date,
      medium,
      assetType: type,
      recurrenceType,
    });
    res.json({ message: "Expense recorded successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getAllExpense(req, res) {
  try {
    const { userId, limit = 10, offset = 0, filter = {} } = req.body;
    const pageLimit = parseInt(limit, 10);
    const pageOffset = parseInt(offset, 10);
    const { year, month, query } = filter;

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
        { description: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ];
    }

    // let query = { userId: userId };
    let expenseList = await Expense.find(searchQuery)
      .skip(pageOffset)
      .limit(pageLimit)
      .sort({ date: -1 });

    let count = await Expense.countDocuments(searchQuery);

    res.json({
      expenseList,
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

async function updateExpense(req, res) {}

async function deleteExpenseById(req, res) {
  try {
    const { expenseId } = req.body;
    let expense = await Expense.findById(expenseId);
    if (expense && expense.type == 'other') {
      let isDeleted = await Expense.deleteOne({ _id: expenseId });
      res.json({ message: "Deleted expense successfully" });
    } else {
      res
        .status(500)
        .json({ error: "Please sell/delete asset or liability directly" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function createExpenseType(req, res) {
  try {
    const { userId, expenseType } = req.body;
    const formattedType = expenseType.charAt(0).toUpperCase() + expenseType.slice(1).toLowerCase();
    const existingType = await ExpenseType.findOne({ userId, formattedType });
    if (existingType) {
      return res.status(400).json({ error: "Expense type already exists" });
    }
    let expenseTypeT = new ExpenseType({
      userId,
      expnseType: formattedType,
    });

    await expenseTypeT.save();
    res.json({ message: "Created expense type successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}


async function getAllExpenseType(req, res) {
  try {
    const { userId } = req.body;
    let expenseTypeList = await ExpenseType.find({ userId: userId }).sort({
      date: -1,
    });
    res.json({ expenseTypeList });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function deleteExpenseTypeById(req, res) {
  try {
    const { expenseTypeId } = req.body;
    let isDeleted = await ExpenseType.deleteOne({ _id: expenseTypeId });
    res.json({ message: "Deleted expense type successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// get recurring expense for last 30 days
async function getLast30DaysExpense(req, res) {
    try {
      const {userId} = req.body;
      const today = startOfToday();
  
      const recurringExpenses = await Expense.aggregate([
        { $match: { userId, recurrenceType: { $in: ["daily", "weekly", "monthly", "yearly"]}}},
        { $sort: { date: -1 } },
        {
          $group: {
            _id: { category: "$category", recurrenceType: "$recurrenceType" },
            latestExpense: { $first: "$$ROOT" }, 
          },
        },
      ]);
      const expensesWithNextPayment = recurringExpenses
        .map(({ latestExpense }) => {
          const nextPaymentDate = getNextPaymentDate(latestExpense.recurrenceType, latestExpense.date);
          return nextPaymentDate >= today
            ? { ...latestExpense, nextPaymentDate }
            : null;
        })
        .filter((expense) => expense !== null) 
        .sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate)); 
  
      res.status(200).json(expensesWithNextPayment);
    } catch (error) {
      console.error("Error fetching recurring expenses:", error);
      res.status(500).json({ message: "Server error while fetching expenses" });
    }
}

module.exports = {
  saveExpense,
  updateExpense,
  createExpense,
  getAllExpense,
  deleteExpenseById,
  createExpenseType,
  getAllExpenseType,
  deleteExpenseTypeById,
  getLast30DaysExpense
};
