import mongoose from 'mongoose'

const scheduleSchema = mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MentorProfile',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Provide date'],
    },
    startTime: {
      type: String, // Store time as string (e.g., "14:00" for 2 PM)
      required: [true, 'Provide start time'],
    },
    endTime: {
      type: String,
      required: [true, 'Provide end time'],
    },
    isBooked: {
      type: Boolean,
      default: false, // Indicates if the slot is booked
    },
  },
  {
    timestamps: true,
  }
)

const Schedule = mongoose.model('Schedule', scheduleSchema)
export default Schedule
