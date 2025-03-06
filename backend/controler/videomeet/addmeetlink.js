import Meeting from "../../model/meet.model.js";

// Add a meeting link
export const addMeetingLink = async (req, res) => {
  const { classId, name, url } = req.body;
  try {
    // Check if the meeting link already exists
    const existingMeeting = await Meeting.findOne({ classId });
    if (existingMeeting) {
      return res.status(400).json({ message: "Meeting link already exists for this class" });
    }

    // Create a new meeting link
    const newMeeting = new Meeting({ classId, name, url });
    await newMeeting.save();

    res.status(201).json({ message: "Meeting link added successfully", meeting: newMeeting });
  } catch (error) {
    console.error("Error adding meeting link:", error);
    res.status(500).json({ message: "Failed to add meeting link" });
  }
};