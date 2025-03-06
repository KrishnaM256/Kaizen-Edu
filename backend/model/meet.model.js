// models/Meeting.js
import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema({
  classId: {
    type: String,
    required: true,
    unique: true, // Ensure each class has only one meeting link
  },
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
});

const Meeting = mongoose.model("Meeting", meetingSchema);

export default Meeting;