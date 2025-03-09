import mongoose from "mongoose";

const mentorMeetSchema = new mongoose.Schema({
  mentorId: {
    type: String,
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const MentorMeet = mongoose.model("MentorMeet", mentorMeetSchema);

export default MentorMeet;
