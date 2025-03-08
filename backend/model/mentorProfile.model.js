import mongoose from 'mongoose'

const mentorProfileSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skills: [String],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile' }],
    expertise: [String],
    bio: String,
    timeSlots: [
      {
        day: String,
        startTime: String,
        endTime: String,
      },
    ],
  },
  { timestamps: true }
)

const MentorProfile = mongoose.model('MentorProfile', mentorProfileSchema)
export default MentorProfile
