import express from 'express'
import { getClassesByTeacherId } from '../controler/profile/classesWithAssessments.js';
import { getStudentResultsByStudentId } from '../controler/profile/getStudentResultsByStudentId.js';

const router = express.Router()


router.get('/getAllClasses/:userId', getClassesByTeacherId) // Leave class (Student)
router.get('/getStudentResultsByStudentId/:studentid',getStudentResultsByStudentId)
export default  router;