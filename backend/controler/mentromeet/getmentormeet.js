import MentorMeet from "../../model/mentormeet.model.js";

export const getMentorMeet = async (req, res) => {
    const { studentId } = req.params;
    try {
      const meetings = await MentorMeet.find({ studentId });
      if (!meetings.length) {
        return res.status(404).json({ message: "No meetings found for this student" });
      }
      res.status(200).json(meetings);
    } catch (error) {
      console.error("Error fetching mentor meet link:", error);
      res.status(500).json({ message: "Failed to fetch mentor meet link" });
    }
  };