import mongoose from 'mongoose'

const lectureSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  youtubeLink: {
    type: String,
  },
  videoPath: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  studentsAttended: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
})

const Lecture = mongoose.model('Lecture', lectureSchema)

export default Lecture
