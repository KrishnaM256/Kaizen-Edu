import MentorMeet from "../../model/mentormeet.model.js";
// Delete mentor meet link by mentorId
export const deleteMentorMeetByMentor = async (req, res) => {
    const { mentorId } = req.params;
    console.log(mentorId);
    try {
      const deletedMeeting = await MentorMeet.findOneAndDelete({ mentorId });
      if (!deletedMeeting) {
        return res.status(404).json({ message: "Mentor meet link not found" });
      }
      res.status(200).json({ message: "Mentor meet link deleted successfully" });
    } catch (error) {
      console.error("Error deleting mentor meet link:", error);
      res.status(500).json({ message: "Failed to delete mentor meet link" });
    }
  };
  