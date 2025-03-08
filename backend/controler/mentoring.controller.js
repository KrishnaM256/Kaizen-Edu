import MentorProfile from '../model/mentorProfile.model.js'
import StudentProfile from '../model/studentProfile.model.js'

// Create a Mentor Profile
export const createMentorProfile = async (req, res) => {
  try {
    const mentor = await MentorProfile.create(req.body)
    res.status(201).json(mentor)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Get Mentor Profile by ID
export const getMentorProfile = async (req, res) => {
  try {
    const mentor = await MentorProfile.findById(req.params.mentorId).populate(
      'user students'
    )
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' })

    res.status(200).json(mentor)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Assign Student to Mentor
export const assignStudentToMentor = async (req, res) => {
  try {
    const { mentorId, studentId } = req.body

    const mentor = await MentorProfile.findById(mentorId)
    const student = await StudentProfile.findById(studentId)

    if (!mentor || !student) {
      return res.status(404).json({ message: 'Mentor or Student not found' })
    }

    // Assign student to mentor
    if (!mentor.students.includes(student._id)) {
      mentor.students.push(student._id)
    }

    // Assign mentor to student
    student.mentor = mentor._id

    await mentor.save()
    await student.save()

    res.status(200).json({ message: 'Student assigned to mentor successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Remove Student from Mentor
export const removeStudentFromMentor = async (req, res) => {
  try {
    const { mentorId, studentId } = req.body

    const mentor = await MentorProfile.findById(mentorId)
    const student = await StudentProfile.findById(studentId)

    if (!mentor || !student) {
      return res.status(404).json({ message: 'Mentor or Student not found' })
    }

    // Remove student from mentor's list
    mentor.students = mentor.students.filter(
      (id) => id.toString() !== studentId
    )
    // Remove mentor from student profile
    student.mentor = null

    await mentor.save()
    await student.save()

    res
      .status(200)
      .json({ message: 'Student removed from mentor successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const getStudentsByMentor = async (req, res) => {
  try {
    console.log({ params: req.params.mentorId })
    const students = await StudentProfile.find({
      mentor: req.params.mentorId,
    }).populate('user')
    console.log(students)
    res.status(200).json(students)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
export const getAllMentors = async (req, res) => {
  try {
    const mentors = await MentorProfile.find({}).populate('user students')
    res.status(200).json(mentors)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Get Mentor Profile by User ID
export const getMentorByUserId = async (req, res) => {
  try {
    const { userId } = req.params
    console.log({ hey: userId })

    // Find the mentor and populate the 'user' and 'students' fields
    const mentor = await MentorProfile.findOne({ user: userId })
      .populate({
        path: 'user', // Populate the 'user' field in MentorProfile
        // No 'select' option means all fields will be included
      })
      .populate({
        path: 'students', // Populate the 'students' field in MentorProfile
        populate: {
          path: 'user', // Populate the 'user' field in each StudentProfile
          // No 'select' option means all fields will be included
        },
      })

    console.log(mentor)

    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' })
    }

    res.status(200).json(mentor)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
