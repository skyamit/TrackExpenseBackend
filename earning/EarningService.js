const { updateAsset } = require("../asset/assetService");
const { saveLiability } = require("../liability/liabilityService");
const Earning = require("../model/Earning");
const EarningType = require("../model/EarningType");

async function saveEarning({
  userId,
  amount,
  source,
  description,
  date,
  medium,
  type,
  assetType,
  quantity,
  assetId,
  liabilityType,
}) {
  try {
    let liabilityId = null;
    if (type == "asset") {
      let amt = amount;
      if (assetType == "Stock" || assetType == "Mutual Fund") {
        console.log(assetType);
        amt = quantity;
        console.log(amt);
        await updateAsset({ assetId, value: amt });
      }
    } else if (type == "liability") {
      let amt = amount;
      if (liabilityType == "Loan") {
        liabilityId = await saveLiability({
          userId,
          value: amt,
          remainingAmount: amt,
          name: source,
          description,
          date,
          type: liabilityType,
        });
      }
    }
    let earning = new Earning({
      userId,
      amount,
      source,
      description,
      date,
      medium,
      type,
      assetId,
      liabilityId,
    });
    await earning.save();
    return earning._id;
  } catch (error) {
    console.log(error);
  }
  return null;
}

async function createEarning(req, res) {
  try {
    const { userId, amount, type, source, description, date, medium } =
      req.body;
    await saveEarning({
      userId,
      amount,
      type,
      source,
      description,
      date,
      medium,
    });
    res.json({ message: "Earning recorded successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getAllEarning(req, res) {
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
        { source: { $regex: query, $options: "i" } },
      ];
    }

    // let query = {userId : userId};
    let earningList = await Earning.find(searchQuery)
      .skip(pageOffset)
      .limit(pageLimit)
      .sort({ date: -1, _id: -1 });

    let count = await Earning.countDocuments(searchQuery);

    res.json({
      earningList,
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

async function updateEarning(req, res) {}

async function deleteEarningById(req, res) {
  try {
    const { earningId } = req.body;
    let earning = await Earning.findById(earningId);
    // console.log(earning._id)
    if (earning && earning.type == "other") {
      let isDeleted = await Earning.deleteOne({ _id: earningId });
      res.json({ message: "Deleted earning successfully" });
    } else {
      res.status(500).json({ error: "Please sell/delete asset directly" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// earning type
async function createEarningType(req, res) {
  try {
    const { userId, earningType } = req.body;
    const formattedType =
      earningType.charAt(0).toUpperCase() + earningType.slice(1).toLowerCase();
    const existingType = await EarningType.findOne({ userId, formattedType });
    if (existingType) {
      return res.status(400).json({ error: "Earning type already exists" });
    }
    console.log(formattedType);
    let earningTypeT = new EarningType({
      userId,
      earningType: formattedType,
    });

    await earningTypeT.save();
    res.json({ message: "Created earning type successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getAllEarningType(req, res) {
  try {
    const { userId } = req.body;
    let earningTypeList = await EarningType.find({ userId: userId }).sort({
      date: -1,
    });
    res.json({ earningTypeList });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function deleteEarningTypeById(req, res) {
  try {
    const { earningTypeId } = req.body;
    let isDeleted = await EarningType.deleteOne({ _id: earningTypeId });
    res.json({ message: "Deleted earning type successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getEarningGraphDataLast12Months(req, res) {
  try {
    const { userId } = req.body;
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11, 1);
    const earnings = await Earning.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          totalEarning: { $sum: "$amount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    let data = earnings.map((e) => ({
      month: `${e._id.year}-${String(e._id.month).padStart(2, "0")}`,
      totalEarning: e.totalEarning,
    }));
    res.json({
      data,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getEarningGraphDataLast30Days(req, res) {
  try {
    const { userId } = req.body;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const last30Days = new Date();
    last30Days.setDate(today.getDate() - 30);
    last30Days.setHours(0, 0, 0, 0);

    const earnings = await Earning.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: last30Days, $lte: today },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
          },
          totalEarning: { $sum: "$amount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    let data = earnings.map((e) => ({
      date: `${e._id.year}-${String(e._id.month).padStart(2, "0")}-${String(
        e._id.day
      ).padStart(2, "0")}`,
      totalEarning: e.totalEarning,
    }));
    res.json({
      data,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  getEarningGraphDataLast30Days,
  getEarningGraphDataLast12Months,
  saveEarning,
  updateEarning,
  createEarning,
  getAllEarning,
  deleteEarningById,
  createEarningType,
  deleteEarningTypeById,
  getAllEarningType,
};
