import Class from '../model/class.model.js'
import User from '../model/user.model.js'
import { ObjectId } from 'mongodb' // Correctly import ObjectId
import Viva from '../model/viva.model.js'
import Assignment from '../model/assignment.model.js'
import Quiz from '../model/quiz.model.js'
// Create a new class (Teacher only)
export const createClass = async (req, res) => {
  try {
    const { name, description, subject, userId, isPublic } = req.body

    const teacher = await User.findById(userId)
    if (!teacher || teacher.role !== 'teacher') {
      return res
        .status(403)
        .json({ message: 'Only teachers can create classes' })
    }

    const newClass = await Class.create({
      name,
      description,
      subject,
      teacher: userId,
      isPublic,
    })

    res
      .status(201)
      .json({ message: 'Class created successfully', classData: newClass })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Server Error', error })
  }
}
// Join a class (Student only)
export const joinClass = async (req, res) => {
  try {
    const { classCode, studentId, classId } = req.body

    // Find the class by classId or classCode
    const classData = classId
      ? await Class.findById(classId)
      : await Class.findOne({ classCode })

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' })
    }

    // Check if the student is already in the class
    if (classData.students.includes(studentId)) {
      return res.status(400).json({ message: 'You are already in this class' })
    }

    // If the class is private, verify the class code
    if (!classData.isPublic && !classCode) {
      return res
        .status(400)
        .json({ message: 'Class code is required to join this class' })
    }

    // If the class is private and a class code is provided, verify it
    if (!classData.isPublic && classCode !== classData.classCode) {
      return res.status(400).json({ message: 'Invalid class code' })
    }

    // Add the student to the class
    classData.students.push(studentId)
    await classData.save()

    res.status(200).json({ message: 'Joined class successfully', classData })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Server Error', error })
  }
}

// Get all classes for a student or teacher
export const getAllClasses = async (req, res) => {
  try {
    const { userId } = req.body

    let query = {}
    if (userId) {
      query = {
        $or: [{ teacher: userId }, { students: { $in: [userId] } }],
      }
    }

    const classes = await Class.find(query)
      .populate('teacher', 'name email')
      .populate('students', 'name email')

    res.status(200).json({ classes })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Server Error', error })
  }
}

// Leave a class (Student only)
export const leaveClass = async (req, res) => {
  try {
    const { classId } = req.params
    const { studentId } = req.body

    const classData = await Class.findById(classId)
    if (!classData) return res.status(404).json({ message: 'Class not found' })

    // Remove the student from the class
    classData.students = classData.students.filter(
      (id) => id.toString() !== studentId
    )
    await classData.save()

    res.status(200).json({ message: 'Left the class successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Server Error', error })
  }
}
// 📌 3️⃣ Update Class (Only by Teacher)
export const updateClass = async (req, res) => {
  try {
    const { classId } = req.params
    const { name } = req.body
    const teacherId = req.user.id

    const classData = await Class.findById(classId)
    if (!classData) return res.status(404).json({ message: 'Class not found' })

    // Check if the user is the teacher of the class
    if (classData.teacher.toString() !== teacherId) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to update this class' })
    }

    classData.name = name || classData.name
    await classData.save()

    res.status(200).json({ message: 'Class updated successfully', classData })
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error })
  }
}

// 📌 4️⃣ Delete Class (Only by Teacher)
export const deleteClass = async (req, res) => {
  try {
    const { classId } = req.params
    const teacherId = req.body.teacherId
    // console.log(classId)
    const classData = await Class.findById(classId)
    if (!classData) return res.status(404).json({ message: 'Class not found' })

    // Only the class teacher can delete the class
    if (classData.teacher.toString() !== teacherId) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to delete this class' })
    }

    await classData.deleteOne()

    res.status(200).json({ message: 'Class deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error })
  }
}

// 📌 5️⃣ Get Class Details
export const getClassDetails = async (req, res) => {
  try {
    const { classId } = req.params

    const classData = await Class.findById(classId)
      .populate('teacher', 'name email')
      .populate('students', 'name email')

    if (!classData) return res.status(404).json({ message: 'Class not found' })

    res.status(200).json({ classData })
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error })
  }
}

export const getAllStudentsWithClassInfo = async (req, res) => {
  try {
    // Find all classes and populate the 'students' field with user details
    const classes = await Class.find({})
      .populate({
        path: 'students',
        select: 'name email', // Only select name and email fields from the User model
      })
      .select('name students') // Only select class name and students array

    // Format the response to include student details and class name
    const result = classes.flatMap((cls) =>
      cls.students.map((student) => ({
        studentName: student.name,
        studentEmail: student.email,
        className: cls.name,
      }))
    )

    res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error fetching students with class info:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students with class info',
    })
  }
}

// 📌 Get All Public Classes
export const getAllPublicClasses = async (req, res) => {
  try {
    const { userId, role } = req.body // Assuming userId and role are passed in the request body

    let query = { isPublic: true } // Base query for public classes

    // If the user is a teacher, filter classes created by the logged-in teacher
    if (role === 'teacher') {
      query.teacher = userId
    }

    // Find all public classes based on the query
    const publicClasses = await Class.find(query)
      .populate('teacher', 'name email') // Populate teacher details
      .select('name description subject teacher isPublic students') // Include students field

    res.status(200).json({ success: true, classes: publicClasses })
  } catch (error) {
    console.error('Error fetching public classes:', error)
    res.status(500).json({ success: false, message: 'Server Error', error })
  }
}

export const getclassbyuserid = async (req, res) => {
  try {
    const { userid } = req.params

    // Find all classes where the student is in the 'students' array
    const classes = await Class.find({ students: userid }).select('_id name')

    if (!classes || classes.length === 0) {
      return res
        .status(404)
        .json({ message: 'No classes found for this student' })
    }

    // Format the response to include class ID and class name
    const formattedClasses = classes.map((cls) => ({
      classid: cls._id,
      classname: cls.name,
    }))

    res.status(200).json({ classes: formattedClasses })
  } catch (error) {
    console.error('Error fetching classes by user ID:', error)
    res.status(500).json({ message: 'Server Error', error: error.message })
  }
}
export const markCourseCompleted = async (req, res) => {
  try {
    const { classId } = req.params

    // Find the class by ID
    const currentClass = await Class.findById(classId)

    if (!currentClass) {
      return res.status(404).json({ message: 'Class not found' })
    }

    // Toggle the classCompleted field
    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      { classCompleted: !currentClass.classCompleted }, // Toggle the value
      { new: true } // Return the updated document
    )

    res.status(200).json({
      message: 'Class completion status toggled successfully',
      class: updatedClass,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
