import StudentProfile from '../model/studentProfile.model.js'
import MentorProfile from '../model/mentorProfile.model.js'

// Create Student Profile
export const createStudentProfile = async (req, res) => {
  try {
    console.log(req.body)
    const {
      user,
      academicStatus,
      extracurricular,
      internships,
      achievements,
      futurePlans,
      skills, // Added skills field
    } = req.body

    const profile = await StudentProfile.create({
      user,
      academicStatus,
      extracurricular,
      internships,
      achievements,
      futurePlans,
      skills, // Save skills
    })

    res.status(201).json(profile)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Get Student Profile by User ID
export const getStudentProfile = async (req, res) => {
  try {
    const { userId } = req.body // Changed from req.body to req.params

    // Find the student profile and populate the 'user' and 'mentor' fields
    const profile = await StudentProfile.findOne({ user: userId })
      .populate('user') // Populate student's user
      .populate({
        path: 'mentor',
        populate: { path: 'user' }, // Populate mentor's user
      })

    if (!profile) {
      return res.status(404).json({ message: 'Student profile not found' })
    }

    res.status(200).json(profile)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Update Student Profile
export const updateStudentProfile = async (req, res) => {
  try {
    console.log(req.body)
    const { studentId, updates } = req.body

    const profile = await StudentProfile.findByIdAndUpdate(
      updates._id, // Fixed this to use studentId
      updates,
      { new: true, runValidators: true } // Ensure schema validation
    )

    if (!profile) {
      return res.status(404).json({ message: 'Student profile not found' })
    }

    res.status(200).json(profile)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Delete Student Profile
export const deleteStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.body
    const profile = await StudentProfile.findByIdAndDelete(studentId)

    if (!profile) {
      return res.status(404).json({ message: 'Student profile not found' })
    }

    res.status(200).json({ message: 'Student profile deleted successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Assign Mentor to Student
export const assignMentorToStudent = async (req, res) => {
  try {
    const { studentId, mentorId } = req.body
    const mentor = await MentorProfile.findById(mentorId)
    const student = await StudentProfile.findById(studentId)

    if (!mentor || !student) {
      return res.status(404).json({ message: 'Mentor or Student not found' })
    }

    // Check if student is already assigned to the same mentor
    if (student.mentor?.toString() === mentorId) {
      return res
        .status(400)
        .json({ message: 'Student is already assigned to this mentor' })
    }

    student.mentor = mentor._id

    // Avoid duplicate student entries in mentor's students array
    if (!mentor.students.includes(student._id)) {
      mentor.students.push(student._id)
    }

    await student.save()
    await mentor.save()

    res.status(200).json({ message: 'Mentor assigned successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Get All Students
export const getAllStudents = async (req, res) => {
  try {
    const students = await StudentProfile.find()
      .populate('user') // Populate student's user
      .populate({
        path: 'mentor',
        populate: { path: 'user' }, // Populate mentor's user
      })

    if (!students.length) {
      return res.status(404).json({ message: 'No student profiles found' })
    }

    res.status(200).json(students)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
