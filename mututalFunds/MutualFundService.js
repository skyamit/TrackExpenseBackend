const { saveEarning } = require("../earning/EarningService");
const { saveExpense } = require("../expense/ExpenseService");
const Asset = require("../model/Asset");
const Earning = require("../model/Earning");
const Expense = require("../model/Expense");
const MutualFund = require("../model/MutualFund");
const { getMultipleFundsNAVFromCode } = require("./MutualFundNavService");

async function createMutualFund(req, res) {
  try {
    const { userId, name, schemeCode, price, quantity, date } = req.body;
    const amountSpent = Number(price) * Number(quantity);
    let expenseId = await saveExpense({
      userId,
      amount: amountSpent,
      category: name,
      description: "Bought Mutual Funds",
      date,
      medium: "online",
      type: "asset",
      assetType: "Mutual Fund",
      quantity: quantity,
      code : schemeCode
    });

    let mutualFund = new MutualFund({
      userId,
      name,
      schemeCode,
      price,
      quantity,
      date,
      expenseId,
    });
    await mutualFund.save();
    res.json({ message: "Mutual Fund purchase recorded" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getAllMutualFund(req, res) {
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
        { schemeCode: { $regex: query, $options: "i" } },
      ];
    }

    // let query = {userId : userId};
    let mutualFundList = await MutualFund.find(searchQuery)
      .skip(pageOffset)
      .limit(pageLimit)
      .sort({ date: -1 });

      const uniqueFundCode = [
        ...new Set(
          mutualFundList
            .map((fund) => fund.schemeCode)
        ),
      ];
      const navMap = {};
      if (uniqueFundCode.length > 0) {
        let navData = await getMultipleFundsNAVFromCode(uniqueFundCode);
        // console.log(navData)
        navData.forEach((fund) => {
          navMap[fund.code] = fund;
        });
      }
      mutualFundList = mutualFundList.map((fund) => {
        if (navMap[fund.schemeCode]) {
          return {
            ...fund._doc,
            lastFetchedPrice: navMap[fund.schemeCode].nav,
            lastUpdated: navMap[fund.schemeCode].lastUpdated
          };
        }
        return fund;
      });
    let count = await MutualFund.countDocuments(searchQuery);

    res.json({
      mutualFundList,
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

async function updateMutualFund(req, res) {
  try {
    const { mutualFundId, userId, quantity, sellPrice } = req.body;
    let mutualFund = await MutualFund.findById(mutualFundId);
    if (!mutualFund) {
      return res.status(404).json({ error: "Mutual Fund not found" });
    }
    if (mutualFund.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized: You don't own this mutual fund" });
    }
    let expenseObj = await Expense.findById(mutualFund.expenseId);
    let nQuantity = Number(mutualFund.quantity) - Number(quantity);
    const amountEarned = Number(sellPrice) * Number(quantity);

    let earning = await saveEarning({
      userId,
      amount: amountEarned,
      source: mutualFund.name,
      description: "Sold Mutual Fund",
      date: new Date().toISOString().split("T")[0],
      medium: "online",
      type: "asset",
      quantity: quantity,
      assetType: "Mutual Fund",
      assetId: expenseObj.assetId,
    });

    if (nQuantity == 0) {
      await MutualFund.deleteOne({ _id: mutualFundId });
      return res.json({
        message: "Mutual Fund sell recorded",
      });
    } else {
      mutualFund.quantity = nQuantity;
      await mutualFund.save();
      return res.json({
        message: "Mutual Fund partial sell recorded",
        updateMutualFund: mutualFund,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function deleteMutualFundById(req, res) {
  try {
    const { mutualFundId, userId } = req.body;
    let mutualFund = await MutualFund.findById(mutualFundId);
    let expenseObj = await Expense.findById(mutualFund.expenseId);
    let assetId = expenseObj.assetId;
    let expenseId = mutualFund.expenseId;
    await Earning.deleteMany({ assetId: assetId });
    await Asset.deleteOne({ _id: assetId });
    await Expense.deleteOne({ _id: expenseId });
    await MutualFund.deleteOne({ _id: mutualFundId });
    res.json({ message: "Deleted Mutual Fund successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  updateMutualFund,
  createMutualFund,
  getAllMutualFund,
  deleteMutualFundById,
};
