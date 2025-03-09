import Lecture from './../model/lecture.model.js'
import multer from 'multer'
import path from 'path'

// Multer setup for storing videos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/lectures/') // Video storage path
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) // Unique filename
  },
})
export const upload = multer({ storage: storage })

// Upload a lecture (YouTube link or direct file)
export const uploadLecture = async (req, res) => {
  try {
    const { classId, teacherId, title, description, youtubeLink } = req.body
    let videoPath = null

    if (req.file) {
      videoPath = `/uploads/lectures/${req.file.filename}`
    }

    const newLecture = new Lecture({
      classId,
      teacherId,
      title,
      description,
      youtubeLink,
      videoPath,
    })

    await newLecture.save()
    res.status(201).json({
      success: true,
      message: 'Lecture uploaded successfully',
      lecture: newLecture,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading lecture',
      error: error.message,
    })
  }
}

// Get lectures by classId
export const getLecturesByClass = async (req, res) => {
  try {
    const { classId } = req.params
    const lectures = await Lecture.find({ classId }).populate(
      'teacherId',
      'name email'
    )

    res.status(200).json({ success: true, lectures })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lectures',
      error: error.message,
    })
  }
}

// Get lecture by ID
export const getLectureById = async (req, res) => {
  try {
    const { lectureId } = req.params
    const lecture = await Lecture.findById(lectureId).populate(
      'teacherId',
      'name email'
    )

    if (!lecture) {
      return res
        .status(404)
        .json({ success: false, message: 'Lecture not found' })
    }

    res.status(200).json({ success: true, lecture })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lecture',
      error: error.message,
    })
  }
}

// Delete lecture
export const deleteLecture = async (req, res) => {
  try {
    const { lectureId } = req.params
    await Lecture.findByIdAndDelete(lectureId)

    res
      .status(200)
      .json({ success: true, message: 'Lecture deleted successfully' })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting lecture',
      error: error.message,
    })
  }
}

export const markAttendance = async (req, res) => {
  try {
    const { lectureId, userId } = req.body

    // Check if the user is already marked as attended
    const lecture = await Lecture.findById(lectureId)
    if (lecture.studentsAttended.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User already marked as attended',
      })
    }

    // Append the userId to the studentsAttended array
    const updatedLecture = await Lecture.findByIdAndUpdate(
      lectureId,
      { $push: { studentsAttended: userId } },
      { new: true }
    ).populate('studentsAttended', 'name email')

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      lecture: updatedLecture,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message,
    })
  }
}
export const getAttendanceByClassId = async (req, res) => {
  try {
    const { classId } = req.params

    // Fetch all lectures for the given classId and populate studentsAttended
    const lectures = await Lecture.find({ classId }).populate(
      'studentsAttended'
    )

    if (!lectures || lectures.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No lectures found for the given classId',
      })
    }

    // Group the results by lecture ID
    const attendanceByLecture = lectures.map((lecture) => ({
      lectureId: lecture._id,
      title: lecture.title,
      studentsAttended: lecture.studentsAttended,
    }))

    res.status(200).json({
      success: true,
      attendanceByLecture,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message,
    })
  }
}
