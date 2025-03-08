import mongoose from 'mongoose'

const studentProfileSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    academicStatus: {
      gpa: Number,
      completedCredits: Number,
      currentSemester: Number,
    },
    extracurricular: [String],
    internships: [
      {
        company: String,
        role: String,
        duration: String,
      },
    ],
    achievements: [String],
    skills: [String], // Added skills field
    futurePlans: String,
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MentorProfile',
    },
  },
  { timestamps: true }
)

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema)
export default StudentProfile
