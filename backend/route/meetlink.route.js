import express  from 'express'
import { addMeetingLink } from '../controler/videomeet/addmeetlink.js';
import { getMeetingLink } from '../controler/videomeet/getmeetlink.js';
import { deleteMeetingLink } from '../controler/videomeet/deletemeetlink.js';
const router=express.Router();

router.post('/addmeetlink',addMeetingLink);
router.get('/getmeetlink/:classId',getMeetingLink);
router.delete('/deletemeetlink/:classId',deleteMeetingLink);

export default router;
