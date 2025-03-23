const MutualFund = require("../model/MutualFund");
const Stock = require("../model/Stock");
const UserFinance = require("../model/UserFinance");
const {
  getMultipleFundsNAVFromCode,
} = require("../mututalFunds/MutualFundNavService");
const { fetchStockPrices } = require("../stock/StockPriceService");

async function investmentSummary(req, res) {
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

    const stocks = await Stock.aggregate([
      { $match: { userId: userId, date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$price", "$quantity"] } },
        },
      },
    ]);

    const mutualFunds = await MutualFund.aggregate([
      { $match: { userId: userId, date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$price", "$quantity"] } },
        },
      },
    ]);

    let userFinance = await UserFinance.find({ userId: userId });

    const totalStocks = stocks.length ? stocks[0].total : 0;
    const totalMutualFunds = mutualFunds.length ? mutualFunds[0].total : 0;
    const balance = userFinance[0].currentBalance
      ? userFinance[0].currentBalance
      : 0;
    res.json({
      totalInvestment: totalStocks + totalMutualFunds,
      totalStocks,
      totalMutualFunds,
    });
  } catch (error) {
    console.error("Error fetching finance summary:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getStockBetween(req, res) {
  try {
    const { userId } = req.body;

    const stocks = await Stock.aggregate([
      {
        $match: {
          userId,
        },
      },
      {
        $project: {
          symbol: 1,
          description: 1,
          totalAmount: { $multiply: ["$price", "$quantity"] },
        },
      },
      {
        $group: {
          _id: "$symbol",
          description: { $first: "$description" },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    let groupedStocks = [];
    let othersTotal = 0;

    stocks.forEach((entry, index) => {
      if (index < 5) {
        groupedStocks.push(entry);
      } else {
        othersTotal += entry.totalAmount;
      }
    });

    if (othersTotal > 0) {
      groupedStocks.push({
        _id: "Others",
        description: "Others",
        totalAmount: othersTotal,
      });
    }

    res.json(groupedStocks);
  } catch (error) {
    console.error("Error fetching stock data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getMutualFundBetween(req, res) {
  try {
    const { userId } = req.body;

    const mutualFund = await MutualFund.aggregate([
      {
        $match: {
          userId,
        },
      },
      {
        $project: {
          schemeCode: 1,
          name: 1,
          totalAmount: { $multiply: ["$price", "$quantity"] },
        },
      },
      {
        $group: {
          _id: "$schemeCode",
          name: { $first: "$name" },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    let groupedMutualFunds = [];
    let othersTotal = 0;

    mutualFund.forEach((entry, index) => {
      if (index < 5) {
        groupedMutualFunds.push(entry);
      } else {
        othersTotal += entry.totalAmount;
      }
    });

    if (othersTotal > 0) {
      groupedMutualFunds.push({
        _id: "Others",
        name: "Others",
        totalAmount: othersTotal,
      });
    }

    res.json(groupedMutualFunds);
  } catch (error) {
    console.error("Error fetching stock data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getStockMutualFundSummaryTotal(req, res) {
  try {
    let { userId } = req.body;

    const mutualFundCodes = await MutualFund.distinct("schemeCode", {
      userId: userId,
      schemeCode: { $ne: null },
    });

    const stockCodes = await Stock.distinct("symbol", {
      userId: userId,
      symbol: { $ne: null },
    });

    const navMap = {};
    if (stockCodes.length > 0) {
      let stockData = await fetchStockPrices(stockCodes);
      stockData.forEach((stock) => {
        navMap[stock.code] = stock.nav;
      });
    }
    if (mutualFundCodes.length > 0) {
      let navData = await getMultipleFundsNAVFromCode(mutualFundCodes);
      navData.forEach((fund) => {
        navMap[fund.code] = fund.nav;
      });
    }

    const mutualFunds = await MutualFund.aggregate([
      {
        $match: {
          userId,
        },
      },
      {
        $group: {
          _id: "$schemeCode",
          quantity: { $sum: "$quantity" },
        },
      },
    ]);

    let totalMutualFund = 0;
    mutualFunds.forEach(({ _id, quantity }) => {
      if (!_id) totalMutualFund += quantity;
      else totalMutualFund += navMap[_id] * quantity;
    });

    const stocks = await Stock.aggregate([
        {
          $match: {
            userId,
          },
        },
        {
          $group: {
            _id: "$symbol",
            quantity: { $sum: "$quantity" },
          },
        },
      ]);
  
      let totalStock = 0;
      stocks.forEach(({ _id, quantity }) => {
        if (!_id) totalStock += quantity;
        else totalStock += navMap[_id] * quantity;
      });

    res.json({
      totalMutualFund,
      totalStock,
    });
  } catch (error) {
    console.error("Error fetching finance summary:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = {
  investmentSummary,
  getStockBetween,
  getMutualFundBetween,
  getStockMutualFundSummaryTotal,
};
