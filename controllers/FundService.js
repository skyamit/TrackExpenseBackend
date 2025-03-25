const SavingsFund = require("../model/SavingsFund");

const savingsFundList = async (req, res) => {
  try {
    const { userId } = req.body;
    const savingsFunds = await SavingsFund.find({
      userId,
      isDeleted: false,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json(savingsFunds);
  } catch (error) {
    console.error("Error fetching fund list:", error);
    res.status(500).json({ error: "Failed to fetch funds." });
  }
};

async function createSavingsFund(req, res) {
  try {
    const {
      _id,
      name,
      totalAmount,
      currentAmount,
      startDate,
      endDate,
      userId,
    } = req.body;

    let fund;

    if (_id) {
      fund = await SavingsFund.findByIdAndUpdate(
        _id,
        { fundName: name, totalAmount, currentAmount, startDate, endDate },
        { new: true } 
      );

      if (!fund) {
        return res
          .status(404)
          .json({ success: false, message: "Fund not found" });
      }

      return res
        .status(200)
        .json({ success: true, message: "Fund updated successfully", fund });
    }

    fund = new SavingsFund({
      userId,
      fundName: name,
      totalAmount,
      currentAmount,
      startDate,
      endDate,
    });

    await fund.save();

    res
      .status(201)
      .json({ success: true, message: "Fund created successfully", fund });
  } catch (error) {
    console.error("Error creating/updating fund:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to process fund request." });
  }
}

async function deleteSavingsFund(req, res) {
  try {
    const { fundId, userId } = req.body;

    const deletedFund = await SavingsFund.findOneAndUpdate(
      { _id: fundId, userId },
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!deletedFund) {
      return res
        .status(404)
        .json({ success: false, message: "Fund not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Fund deleted successfully" });
  } catch (error) {
    console.error("Error deleting fund:", error);
    res.status(500).json({ success: false, message: "Failed to delete fund." });
  }
}

module.exports = {
  savingsFundList,
  createSavingsFund,
  deleteSavingsFund,
};
