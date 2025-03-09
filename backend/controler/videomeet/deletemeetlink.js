import Meeting from "../../model/meet.model.js";


export const deleteMeetingLink = async (req, res) => {

      const { mentorId } = req.params; // Extract mentorId from request parameters
      try {
          // Find and delete the meeting link by mentorId
          const deletedMeeting = await MentorMeet.findOneAndDelete({ mentorId });
  
          // If no meeting link is found, return a 404 error
          if (!deletedMeeting) {
              return res.status(404).json({ message: "Mentor meet link not found" });
          }
  
          // If the meeting link is deleted successfully, return a success message
          res.status(200).json({ message: "Mentor meet link deleted successfully" });
      } catch (error) {
          // Handle any errors that occur during the process
          console.error("Error deleting mentor meet link:", error);
          res.status(500).json({ message: "Failed to delete mentor meet link" });
      }
  };