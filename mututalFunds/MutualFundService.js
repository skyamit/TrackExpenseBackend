const MutualFund = require("../model/MutualFund");

async function createMutualFund(req, res) {
  try {
    const { userId, name, schemeCode, price, quantity, date } = req.body;
    let mutualFund = new MutualFund({
      userId,
      name,
      schemeCode,
      price,
      quantity,
      date,
    });
    await mutualFund.save();
    res.json({ message: "Inserted Record" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getAllMutualFund(req, res) {
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
        { name: { $regex: query, $options: "i" } }, 
        { schemeCode: { $regex: query, $options: "i" } } 
      ];
    }


    // let query = {userId : userId};
    let mutualFundList = await MutualFund.find(searchQuery)
    .skip(pageOffset)
    .limit(pageLimit)
    .sort({ date: -1 });

    let count = await MutualFund.countDocuments(searchQuery );

    res.json({ mutualFundList, count, limit: pageLimit, 
      offset:pageOffset, totalPages: Math.ceil(count/pageLimit)});
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
    if (Number(quantity) === Number(mutualFund.quantity)) {
      await MutualFund.deleteOne({ _id: mutualFundId });
      return res.json({
        message: "Mutual Fund sold completely and deleted from records",
      });
    } else {
      let nQuantity = Number(mutualFund.quantity) - Number(quantity);
      mutualFund.quantity = nQuantity;
      await mutualFund.save();
      return res.json({
        message: "Mutual Fund partially sold",
        updateMutualFund: mutualFund,
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function deleteMutualFundById(req, res) {
  try {
    const { mutualFundId } = req.body;
    let isDeleted = await MutualFund.deleteOne({ _id: mutualFundId });
    res.json({ isDeleted });
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
