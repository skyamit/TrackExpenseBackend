const Asset = require("../model/Asset");

async function saveAsset({ userId, value, name, description, date, type }) {
  try {
    let asset = new Asset({
      userId,
      type,
      value,
      name,
      description,
      date,
    });
    await asset.save();
    return asset._id;
  } catch (error) {
    console.log(error);
  }
  return null;
}

async function updateAsset({ assetId, value }) {
  try {
    let asset = await Asset.findById(assetId);
    let nValue = Number(asset.value) - Number(value);
    if (nValue == 0) {
      await Asset.deleteOne({ _id: assetId });
    } else {
      asset.value = nValue;
      await asset.save();
    }
  } catch (error) {
    console.log(error);
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
      .sort({ date: -1 });

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

module.exports = { getAllAsset, saveAsset, updateAsset };
