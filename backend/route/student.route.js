import express from 'express'
import {
  createStudentProfile,
  getStudentProfile,
  updateStudentProfile,
  deleteStudentProfile,
  assignMentorToStudent,
  getAllStudents,
} from '../controler/student.controller.js'

const router = express.Router()

router.post('/create', createStudentProfile)
router.get('/getAllStudents', getAllStudents)
router.post('/profile', getStudentProfile)
router.put('/update', updateStudentProfile)
router.delete('/delete', deleteStudentProfile)
router.post('/assign-mentor', assignMentorToStudent)

export default router
