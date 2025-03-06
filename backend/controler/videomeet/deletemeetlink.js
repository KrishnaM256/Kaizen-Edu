import Meeting from "../../model/meet.model.js";


export const deleteMeetingLink = async (req, res) => {
    const { classId } = req.params;
    try {
      const deletedMeeting = await Meeting.findOneAndDelete({ classId });
      if (!deletedMeeting) {
        return res.status(404).json({ message: "Meeting link not found" });
      }
  
      res.status(200).json({ message: "Meeting link deleted successfully" });
    } catch (error) {
      console.error("Error deleting meeting link:", error);
      res.status(500).json({ message: "Failed to delete meeting link" });
    }
  };