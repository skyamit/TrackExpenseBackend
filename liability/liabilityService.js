const Liability = require("../model/Liability");

async function saveLiability({
  userId,
  name,
  type,
  description,
  remainingAmount,
  value,
  date,
}) {
  try {
    let liability = new Liability({
      userId,
      name,
      type,
      description,
      value,
      date,
      remainingAmount,
    });
    await liability.save();
    return liability._id;
  } catch (error) {
    console.log(error);
  }
  return null;
}

async function updateLiability({ liabilityId, reducedAmount }) {
  try {
    let liability = await Liability.findById(liabilityId);
    let nRemainingAmount =
      Number(liability.remainingAmount) - Number(reducedAmount);
    if (nRemainingAmount == 0) {
      await Liability.deleteOne({ _id: liabilityId });
    } else {
      liability.remainingAmount = nRemainingAmount;
      await liability.save();
    }
  } catch (error) {
    console.log(error);
  }
}

async function getAllLiability(req, res) {
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

    let liabilityList = await Liability.find(searchQuery)
      .skip(pageOffset)
      .limit(pageLimit)
      .sort({ date: -1 });

    let count = await Liability.countDocuments(searchQuery);

    res.json({
      liabilityList,
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

module.exports = {
  getAllLiability,
  saveLiability,
  updateLiability,
};
