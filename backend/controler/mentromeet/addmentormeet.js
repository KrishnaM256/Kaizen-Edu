import MentorMeet from "../../model/mentormeet.model.js";

// Add a mentor meet link
export const addMentorMeet = async (req, res) => {
  const { mentorId, studentId, name, url } = req.body;
  console.log(req.body);
  try {
    // Check if a meeting already exists between the mentor and student
    const existingMeet = await MentorMeet.findOne({ mentorId, studentId });
    if (existingMeet) {
      return res.status(400).json({ message: "Mentor meet link already exists for this mentor and student" });
    }

    // Create a new mentor meet link
    const newMentorMeet = new MentorMeet({ mentorId, studentId, name, url });
    await newMentorMeet.save();

    res.status(201).json({ message: "Mentor meet link added successfully", meet: newMentorMeet });
  } catch (error) {
    console.error("Error adding mentor meet link:", error);
    res.status(500).json({ message: "Failed to add mentor meet link" });
  }
};
