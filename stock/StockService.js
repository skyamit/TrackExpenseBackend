const { saveEarning } = require("../earning/EarningService");
const { saveExpense } = require("../expense/ExpenseService");
const Asset = require("../model/Asset");
const Earning = require("../model/Earning");
const Expense = require("../model/Expense");
const Stock = require("../model/Stock");
const { fetchStockPrices } = require("./StockPriceService");

async function createStock(req, res) {
  try {
    const { userId, symbol, description, price, quantity, date } = req.body;
    const amountSpent = Number(price) * Number(quantity);
    let expenseId = await saveExpense({
      userId,
      amount: amountSpent,
      category: description,
      description: "Bought stock",
      date,
      medium: "online",
      type: "asset",
      assetType: "Stock",
      quantity,
      code: symbol,
    });

    let stock = new Stock({
      userId,
      symbol,
      description,
      price,
      quantity,
      date,
      expenseId,
    });
    await stock.save();
    res.json({ message: "Stock purchase recorded" });
  } catch (error) {
    console.error("Error in createStock:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getAllStock(req, res) {
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
        { symbol: { $regex: query, $options: "i" } },
      ];
    }

    // let query = {userId : userId};
    let stockList = await Stock.find(searchQuery)
      .skip(pageOffset)
      .limit(pageLimit)
      .sort({ date: -1 });

    const uniqueStockCode = [
      ...new Set(
        stockList
          .map((stock) => stock.symbol)
      ),
    ];
    const navMap = {};
    if (uniqueStockCode.length > 0) {
      let stockData = await fetchStockPrices(uniqueStockCode);
      Object.assign(navMap, stockData);
    }

    stockList = stockList.map((stock) => {
      if (navMap[stock.symbol]) {
        return {
          ...stock._doc,
          lastFetchedPrice: navMap[stock.symbol],
        };
      }
      return stock;
    });
    let count = await Stock.countDocuments(searchQuery);

    res.json({
      stockList,
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

async function updateStock(req, res) {
  try {
    const { stockId, userId, quantity, sellPrice } = req.body;
    let stock = await Stock.findById(stockId);
    if (!stock) return res.status(404).json({ error: "Stock not found" });

    if (stock.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized: You don't own this stock" });
    }

    let expenseObj = await Expense.findById(stock.expenseId);
    let nQuantity = Number(stock.quantity) - Number(quantity);
    const amountEarned = Number(sellPrice) * Number(quantity);

    let earningId = await saveEarning({
      userId,
      amount: amountEarned,
      source: stock.description,
      description: "Sold Stock",
      date: new Date().toISOString().split("T")[0],
      medium: "online",
      type: "asset",
      quantity,
      assetType: "Stock",
      assetId: expenseObj.assetId,
    });

    if (nQuantity === 0) {
      await Stock.deleteOne({ _id: stockId });
      return res.json({ message: "Stock sell recorded" });
    } else {
      stock.quantity = nQuantity;
      await stock.save();
      return res.json({
        message: "Stock partial sell recorded",
        updatedStock: stock,
      });
    }
  } catch (error) {
    console.error("Error in updateStock:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function deleteStockById(req, res) {
  try {
    const { stockId, userId } = req.body;
    let stock = await Stock.findById(stockId);
    let expenseObj = await Expense.findById(stock.expenseId);
    let assetId = expenseObj.assetId;
    let expenseId = stock.expenseId;
    await Earning.deleteMany({ assetId: assetId });
    await Asset.deleteOne({ _id: assetId });
    await Expense.deleteOne({ _id: expenseId });
    await Stock.deleteOne({ _id: stockId });
    res.json({ message: "Deleted stock successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = { updateStock, createStock, getAllStock, deleteStockById };
