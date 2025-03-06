const { saveEarning } = require("../earning/EarningService");
const { saveExpense } = require("../expense/ExpenseService");
const Earning = require("../model/Earning");
const Expense = require("../model/Expense");
const Liability = require("../model/Liability");
const Loan = require("../model/Loan");

async function createLoan(req, res) {
  try {
    const { userId, name, type, description, value, date, remainingAmount } =
      req.body;
    let earningId = await saveEarning({
      userId,
      amount: value,
      source: name,
      description: "Took Debt",
      date: new Date().toISOString().split("T")[0],
      medium: "online",
      type: "liability",
      liabilityType: "Loan",
    });

    let loan = new Loan({
      userId,
      name,
      type,
      description,
      value,
      date,
      remainingAmount,
      earningId,
    });
    await loan.save();
    res.json({ message: "Loan successfully recorded" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getAllLoan(req, res) {
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
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { type: { $regex: query, $options: "i" } },
      ];
    }

    // let query = {userId : userId};
    let loanList = await Loan.find(searchQuery)
      .skip(pageOffset)
      .limit(pageLimit)
      .sort({ date: -1 });

    let count = await Loan.countDocuments(searchQuery);

    res.json({
      loanList,
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

async function updateLoan(req, res) {
  try {
    const { loanId, userId, amountPaid } = req.body;
    let loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }
    if (loan.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized: You don't own this loan" });
    }
    let earningObj = await Earning.findById(loan.earningId);
    let nRemainingAmount = Number(loan.remainingAmount) - Number(amountPaid);
    const amountSpent = Number(amountPaid);

    let expenseId = await saveExpense({
      userId,
      amount: amountSpent,
      category: loan.name,
      description: "Paid amount for Debt",
      date: new Date().toISOString().split("T")[0],
      medium: "online",
      type: "liability",
      liabilityType: "Loan",
      liabilityId: earningObj.liabilityId,
    });

    if (nRemainingAmount == 0) {
      await Loan.deleteOne({ _id: loanId });
      return res.json({
        message: "Loan paid successfully",
      });
    } else {
      loan.remainingAmount = nRemainingAmount;
      await loan.save();
      return res.json({
        message: "Loan partially paid",
        updateLoan: loan,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function deleteLoanById(req, res) {
  try {
    const { loanId, userId } = req.body;
    let loan = await Loan.findById(loanId);
    let earningObj = await Earning.findById(loan.earningId);
    let liabilityId = earningObj.liabilityId;
    let earningId = loan.earningId;
    await Expense.deleteMany({ liabilityId: liabilityId });
    await Liability.deleteOne({ _id: liabilityId });
    await Earning.deleteOne({ _id: earningId });
    await Loan.deleteOne({ _id: loanId });
    res.json({ message: "Deleted Loan successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  updateLoan,
  createLoan,
  getAllLoan,
  deleteLoanById,
};
