const SavingsFund = require("../model/SavingsFund");

const savingsFundList = async (req, res) => {
  try {
    const {userId} = req.body;
    const savingsFunds = await SavingsFund.find({ userId, isDeleted: false }).sort({
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
      const { fundName, totalAmount, currentAmount, startDate, endDate, userId } = req.body;
  
      const newFund = new SavingsFund({
        userId,
        fundName,
        totalAmount,
        currentAmount,
        startDate,
        endDate,
      });
  
      await newFund.save();
  
      res.status(201).json({ success: true, message: "Fund created successfully", fund: newFund });
    } catch (error) {
      console.error("Error creating fund:", error);
      res.status(500).json({ success: false, message: "Failed to create fund." });
    }
  }

  async function updateSavingsFund(req, res) {
    try {
      const { fundName, totalAmount, currentAmount, startDate, endDate, userId, fundId } = req.body;
  
      const updatedFund = await SavingsFund.findOneAndUpdate(
        { _id: fundId, userId },
        { $set: { fundName, totalAmount, currentAmount, startDate, endDate } },
        { new: true }
      );
  
      if (!updatedFund) {
        return res.status(404).json({ success: false, message: "Fund not found" });
      }
  
      res.status(200).json({ success: true, message: "Fund updated successfully", fund: updatedFund });
    } catch (error) {
      console.error("Error updating fund:", error);
      res.status(500).json({ success: false, message: "Failed to update fund." });
    }
  }

  async function deleteSavingsFund(req, res) {
    try {
      const { fundId, userId } = req.body;
  
      const deletedFund = await Fund.findOneAndUpdate(
        { _id: fundId, userId },
        { $set: { isDeleted: true } },
        { new: true }
      );
  
      if (!deletedFund) {
        return res.status(404).json({ success: false, message: "Fund not found" });
      }
  
      res.status(200).json({ success: true, message: "Fund deleted successfully" });
    } catch (error) {
      console.error("Error deleting fund:", error);
      res.status(500).json({ success: false, message: "Failed to delete fund." });
    }
  }
  
module.exports = { savingsFundList, updateSavingsFund, createSavingsFund, deleteSavingsFund };
