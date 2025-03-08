import express from 'express'
import {
  getChatUsers,
  getChatMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  getMostRecentMessage,
} from '../controler/chatController.js'

const router = express.Router()

// Route to get all chat users involved in conversations
router.post('/users', getChatUsers)

// Route to get all messages between two users
router.post('/messages', getChatMessages)

// Route to send a new message
router.post('/send', sendMessage)

// Route to edit a message
router.put('/edit/:id', editMessage)

// Route to delete a message
router.delete('/delete/:id', deleteMessage)

// Route to get the most recent message with a specific user
router.post('/recent', getMostRecentMessage)

export default router
