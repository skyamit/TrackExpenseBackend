const Expense = require("../model/Expense");
const ExpenseType = require("../model/ExpenseType");

async function createExpense(req, res) {
  try {
    const { userId, amount, category, description, date, medium } = req.body;
    let expense = new Expense({
      userId,
      amount,
      category,
      description,
      date,
      medium,
    });
    await expense.save();
    res.json({ message: "Inserted Record" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getAllExpense(req, res) {
  try {
    const { userId, limit=10, offset=0, filter={} } = req.body;
    const pageLimit = parseInt(limit, 10);
    const pageOffset = parseInt(offset, 10);
    const { year, month, query } = filter;

    let searchQuery = {
      userId: userId,
      date: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${parseInt(year) + 1}-01-01`)
      }
    };

    if (month) {
      searchQuery.date = {
        $gte: new Date(`${year}-${month}-01`),
        $lt: new Date(`${year}-${parseInt(month) + 1}-01`)
      };
    }
    if (query) {
      searchQuery.$or = [
        { description: { $regex: query, $options: "i" } }, 
        { category: { $regex: query, $options: "i" } } 
      ];
    }

    // let query = { userId: userId };
    let expenseList = await Expense.find(searchQuery)
    .skip(pageOffset)
    .limit(pageLimit)    
    .sort({ date: -1 });

    let count = await Expense.countDocuments(searchQuery);

    res.json({ expenseList, count, limit: pageLimit, 
      offset:pageOffset, totalPages: Math.ceil(count/pageLimit) });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function updateExpense(req, res) {}

async function deleteExpenseById(req, res) {
  try {
    const { expenseId } = req.body;
    let isDeleted = await Expense.deleteOne({ _id: expenseId });
    res.json({ isDeleted });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function createExpenseType(req, res) {
  try {
    const { userId, expenseType } = req.body;
    let expenseTypeT = new ExpenseType({
      userId,
      expenseType,
    });
    await expenseTypeT.save();
    res.json({ message: "Inserted Record" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getAllExpenseType(req, res) {
  try {
    const { userId } = req.body;
    let expenseTypeList = await ExpenseType.find({ userId: userId }).sort({ date: -1 });
    res.json({ expenseTypeList });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function deleteExpenseTypeById(req, res) {
  try {
    const { expenseTypeId } = req.body;
    let isDeleted = await ExpenseType.deleteOne({ _id: expenseTypeId });
    res.json({ isDeleted });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  updateExpense,
  createExpense,
  getAllExpense,
  deleteExpenseById,
  createExpenseType,
  getAllExpenseType, 
  deleteExpenseTypeById,
};
