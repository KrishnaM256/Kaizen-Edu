import express from 'express'
import multer from 'multer'
import {
  uploadLecture,
  getLecturesByClass,
  getLectureById,
  deleteLecture,
  getAttendanceByClassId,
  markAttendance,
} from '../controler/lecture.controler.js'

const router = express.Router()

// Multer middleware for file upload
const upload = multer({ dest: 'uploads/lectures/' })

// Routes
// Mark attendance for a lecture
router.post('/mark-attendance', markAttendance)
// Get attendance by classId (grouped by lecture ID)
router.get('/attendance/:classId', getAttendanceByClassId)
router.post('/upload', upload.single('video'), uploadLecture)
router.get('/class/:classId', getLecturesByClass)
router.get('/:lectureId', getLectureById)
router.delete('/:lectureId', deleteLecture)

export default router
