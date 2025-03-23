const Asset = require("../model/Asset");
const Earning = require("../model/Earning");
const Expense = require("../model/Expense");
const Liability = require("../model/Liability");
const {
  getMultipleFundsNAVFromCode,
} = require("../mututalFunds/MutualFundNavService");
const { fetchStockPrices } = require("../stock/StockPriceService");

async function saveAsset({
  userId,
  value,
  name,
  description,
  date,
  type,
  code,
}) {
  try {
    let asset = new Asset({
      userId,
      type,
      value,
      name,
      description,
      date,
      code,
    });
    await asset.save();
    return asset._id;
  } catch (error) {
    console.log(error);
  }
  return null;
}

async function updateAsset({ assetId, value }) {
  let asset = await Asset.findById(assetId);
  if (asset) {
    if (asset.value === value) {
      await asset.deleteOne({ _id: assetId });
    } else {
      asset.value -= value;
      await asset.save();
    }
  }
}

async function deleteAsset(req, res) {
  try {
    let { assetId } = req.body;
    let asset = await Asset.findById(assetId);
    if (asset) {
      await Asset.deleteOne({ _id: assetId });
      await Earning.deleteMany({ assetId: assetId });
      await Expense.deleteMany({ assetId: assetId });
      res.json({ message: "Deleted asset successfully" });
    } else {
      res.status(500).json({ message: "Invalid asset" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function sellAsset(req, res) {
  try {
    let { assetId, soldFor } = req.body;
    let asset = await Asset.findById(assetId);
    if (asset) {
      await Asset.deleteOne({ _id: assetId });
      let earning = new Earning({
        userId: asset.userId,
        amount: soldFor,
        source: asset.name,
        description: "Sold " + asset.name,
        date: new Date().toISOString().split("T")[0],
        medium: "online",
        type: "asset",
        assetType: "asset",
        assetId: assetId,
      });
      await earning.save();
      res.json({ message: "Sold asset successfully" });
    } else {
      res.status(500).json({ message: "Invalid asset" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getAllAsset(req, res) {
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

    let assetList = await Asset.find(searchQuery)
      .skip(pageOffset)
      .limit(pageLimit)
      .sort({ date: -1, _id: -1 });

    const uniqueFundCode = [
      ...new Set(
        assetList
          .filter((asset) => asset.type === "Mutual Fund" && asset.code)
          .map((asset) => asset.code)
      ),
    ];
    const uniqueStockCode = [
      ...new Set(
        assetList
          .filter((asset) => asset.type === "Stock" && asset.code)
          .map((asset) => asset.code)
      ),
    ];

    const navMap = {};
    if (uniqueStockCode.length > 0) {
      let stockData = await fetchStockPrices(uniqueStockCode);
      stockData.forEach((stock) => {
        navMap[stock.code] = stock.nav;
      });
    }
    if (uniqueFundCode.length > 0) {
      let navData = await getMultipleFundsNAVFromCode(uniqueFundCode);
      navData.forEach((fund) => {
        navMap[fund.code] = fund.nav;
      });
    }
    assetList = assetList.map((asset) => {
      if (asset.code && navMap[asset.code]) {
        return {
          ...asset._doc,
          value: asset.value * navMap[asset.code],
        };
      }
      return asset;
    });
    let count = await Asset.countDocuments(searchQuery);

    res.json({
      assetList,
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

async function fetchAllAssetWithValue(req, res) {
  try {
    const { userId } = req.body;

    let searchQuery = {
      userId: userId,
    };

    let assetList = await Asset.find(searchQuery).sort({ date: -1, _id: -1 });
    const uniqueFundCode = [
      ...new Set(
        assetList
          .filter((asset) => asset.type === "Mutual Fund" && asset.code)
          .map((asset) => asset.code)
      ),
    ];
    const uniqueStockCode = [
      ...new Set(
        assetList
          .filter((asset) => asset.type === "Stock" && asset.code)
          .map((asset) => asset.code)
      ),
    ];

    const navMap = {};
    if (uniqueStockCode.length > 0) {
      let stockData = await fetchStockPrices(uniqueStockCode);
      stockData.forEach((stock) => {
        navMap[stock.code] = stock.nav;
      });
    }
    if (uniqueFundCode.length > 0) {
      let navData = await getMultipleFundsNAVFromCode(uniqueFundCode);
      // console.log(navData)
      navData.forEach((fund) => {
        navMap[fund.code] = fund.nav;
      });
    }
    console.log(navMap);
    assetList = assetList.map((asset) => {
      if (asset.code && navMap[asset.code]) {
        return {
          ...asset._doc,
          value: asset.value * navMap[asset.code],
        };
      }
      return asset;
    });
    res.json({ assetList });
  } catch (error) {
    console.error("Error fetchAllAssetWithValue:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function assetLiabilitySummaryTotal(req, res) {
  try {
    let { userId } = req.body;

    const mutualFundCodes = await Asset.distinct("code", {
      userId: userId,
      type: "Mutual Fund",
      code: { $ne: null },
    });

    const stockCodes = await Asset.distinct("code", {
      userId: userId,
      type: "Stock",
      code: { $ne: null },
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

    const totalOtherAssets = await Asset.aggregate([
      {
        $match: {
          userId,
          type: "other",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$value" },
        },
      },
    ]);
    const totalOther =
      totalOtherAssets.length > 0 ? totalOtherAssets[0].total : 0;

    const navValues = await Asset.aggregate([
      {
        $match: {
          userId,
          type: { $ne: "other" },
        },
      },
      {
        $group: {
          _id: "$code",
          quantity: { $sum: "$value" },
        },
      },
    ]);

    let totalMappedAssets = 0;
    navValues.forEach(({ _id, quantity }) => {
      if (!_id) totalMappedAssets += quantity;
      else totalMappedAssets += navMap[_id] * quantity;
    });

    const totalAssets = totalOther + totalMappedAssets;

    const liabilities = await Liability.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: "$remainingAmount" },
        },
      },
    ]);

    const totalLiability = liabilities.length ? liabilities[0].total : 0;

    res.json({
      totalAssets,
      totalLiability,
    });
  } catch (error) {
    console.error("Error fetching finance summary:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function assetLiabilitySummary(req, res) {
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

    const mutualFundCodes = await Asset.distinct("code", {
      userId: userId,
      type: "Mutual Fund",
      code: { $ne: null },
    });

    const stockCodes = await Asset.distinct("code", {
      userId: userId,
      type: "Stock",
      code: { $ne: null },
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

    const totalOtherAssetsInRange = await Asset.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate },
          type: "other",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$value" },
        },
      },
    ]);
    const totalOtherInRange =
      totalOtherAssetsInRange.length > 0 ? totalOtherAssetsInRange[0].total : 0;

    const navValuesInRange = await Asset.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate },
          type: { $ne: "other" },
        },
      },
      {
        $group: {
          _id: "$code",
          quantity: { $sum: "$value" },
        },
      },
    ]);

    let totalMappedAssetsInRange = 0;
    navValuesInRange.forEach(({ _id, quantity }) => {
      if (!_id) totalMappedAssetsInRange += quantity;
      else totalMappedAssetsInRange += navMap[_id] * quantity;
    });

    const totalAssetsInRange = totalOtherInRange + totalMappedAssetsInRange;

    const liabilitiesInRange = await Liability.aggregate([
      { $match: { userId: userId, date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          total: { $sum: "$remainingAmount" },
        },
      },
    ]);

    const totalLiabilityInRange = liabilitiesInRange.length
      ? liabilitiesInRange[0].total
      : 0;

    res.json({
      totalAssetsBtw: totalAssetsInRange,
      totalLiabilityBtw: totalLiabilityInRange,
    });
  } catch (error) {
    console.error("Error fetching finance summary:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = {
  getAllAsset,
  deleteAsset,
  sellAsset,
  fetchAllAssetWithValue,
  saveAsset,
  updateAsset,
  assetLiabilitySummary,
  assetLiabilitySummaryTotal,
};
