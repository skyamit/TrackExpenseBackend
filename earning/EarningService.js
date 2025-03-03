const { saveAsset, updateAsset } = require("../asset/assetService");
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
  liabilityId
}) {
  try {
    let earning = new Earning({
      userId,
      amount,
      source,
      description,
      date,
      medium,
      type,
      assetId,
      liabilityId
    });
    await earning.save();
    if (earning.type == 'asset') {      
      let amt = amount;
      if (assetType == 'Stock' || assetType == 'Mutual Fund') {
        amt = quantity;
      }
      console.log(amt + " " + quantity + " ")

      updateAsset({assetId, value: amt});
    } else if (earning.type == 'liability') {
      // updateLiability();
    } 

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
    saveEarning({ userId, amount, type, source, description, date, medium });
    res.json({ message: "Inserted Record" });
  } catch (error) {
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
      .sort({ date: -1 });

    let count = await Earning.countDocuments(searchQuery);

    res.json({
      earningList,
      count,
      limit: pageLimit,
      offset: pageOffset,
      totalPages: Math.ceil(count / pageLimit),
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function updateEarning(req, res) {}

async function deleteEarningById(req, res) {
  try {
    const { earningId } = req.body;
    let earning = Earning.findById(earningId);
    if (earning && earning.type == "other") {
      let isDeleted = await Earning.deleteOne({ _id: earningId });
      res.json({ isDeleted });
    } else {
      res.status(500).json({ error: "Please sell/delete asset" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// earning type
async function createEarningType(req, res) {
  try {
    const { userId, earningType } = req.body;
    let earningTypeT = new EarningType({
      userId,
      earningType,
    });
    await earningTypeT.save();
    res.json({ message: "Inserted Record" });
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
    res.json({ isDeleted });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  saveEarning,
  updateEarning,
  createEarning,
  getAllEarning,
  deleteEarningById,
  createEarningType,
  deleteEarningTypeById,
  getAllEarningType,
};
