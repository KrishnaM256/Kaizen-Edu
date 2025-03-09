import MentorMeet from "../../model/mentormeet.model.js";

// Delete mentor meet link by mentorId
export const deleteMentorMeetByMentor = async (req, res) => {
    const { mentorId } = req.params;

    // Log the mentorId for debugging
    console.log("mentorId:", mentorId);

    try {
        // Use deleteMany to delete all documents with the given mentorId
        const deleteResult = await MentorMeet.deleteMany({ mentorId });

        // Check if any documents were deleted
        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ message: "Mentor meet link not found" });
        }

        res.status(200).json({ message: "Mentor meet link deleted successfully" });
    } catch (error) {
        console.error("Error deleting mentor meet link:", error);
        res.status(500).json({ message: "Failed to delete mentor meet link" });
    }
};