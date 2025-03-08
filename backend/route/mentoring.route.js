import express from 'express'
import {
  createMentorProfile,
  getMentorProfile,
  assignStudentToMentor,
  removeStudentFromMentor,
  getStudentsByMentor,
  getAllMentors,
  getMentorByUserId,
} from '../controler/mentoring.controller.js'

const router = express.Router()

router.get('/getAllMentors', getAllMentors)
router.get('/user/:userId', getMentorByUserId)
router.post('/create', createMentorProfile)
router.get('/:mentorId', getMentorProfile)
router.post('/assign-student', assignStudentToMentor)
router.post('/remove-student', removeStudentFromMentor)
router.get('/:mentorId/students', getStudentsByMentor)

export default router
