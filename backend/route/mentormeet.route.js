import express  from 'express'

import { addMentorMeet } from '../controler/mentromeet/addmentormeet.js'
import { getMentorMeet } from '../controler/mentromeet/getmentormeet.js'
import { deleteMentorMeetByMentor } from '../controler/mentromeet/deletementormeet.js'
const router =express.Router();
router.post('/addmentormeet',addMentorMeet);
router.get('/getmentormeet/:studentId',getMentorMeet);
router.delete('/deletementormeet/:mentorId',deleteMentorMeetByMentor);
export default router;
