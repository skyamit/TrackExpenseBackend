const Message = require("../model/Message");

async function getMessage(req, res) {
  try {
    const latestAnnouncement = await Message.findOne({ type: "announcement" })
      .sort({ createdAt: -1 })
      .select("message type");

    if (!latestAnnouncement) {
      const randomThought = await Message.aggregate([
        { $match: { type: "thoughts" } }, 
        { $sample: { size: 1 } },
      ]).then((result) => (result.length ? result[0] : null));

      if (!randomThought) {
        return res.status(404).json({ message: "No messages found" });
      }

      return res.json(randomThought);
    }
    res.json(latestAnnouncement);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = { getMessage };
