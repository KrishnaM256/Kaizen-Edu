// controllers/meetingController.js
// Get a meeting link by classId
import Meeting from "../../model/meet.model.js";

export const getMeetingLink = async (req, res) => {
    const { classId } = req.params;
  
    try {
      const meeting = await Meeting.find({classId});
      if (!meeting) {
        return res.status(404).json({ message: "Meeting link not found" });
      }
      res.status(200).json(meeting);
    } catch (error) {
      console.error("Error fetching meeting link:", error);
      res.status(500).json({ message: "Failed to fetch meeting link" });
    }
  };