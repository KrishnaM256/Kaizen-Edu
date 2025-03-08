import Chat from '../model/chatModel.js'
import asyncHandler from '../middlewares/asyncHandler.js'
import mongoose from 'mongoose'
import { getReceiverSocketId, io } from '../socket/server.js'

// 1. Get all chat users involved in conversations (mentor or mentee)
export const getChatUsers = asyncHandler(async (req, res) => {
  const { userId, role } = req.body // Take userId and role from the request body

  let chats
  if (role === 'mentor') {
    // Mentor can see all mentees
    chats = await Chat.find({ sender: userId }).populate('receiver')
  } else if (role === 'mentee') {
    // Mentee can only see their mentor
    chats = await Chat.find({ receiver: userId }).populate('sender')
  }

  const uniqueUsers = new Map()

  chats.forEach((chat) => {
    if (role === 'mentor') {
      uniqueUsers.set(chat.receiver._id.toString(), chat.receiver)
    } else if (role === 'mentee') {
      uniqueUsers.set(chat.sender._id.toString(), chat.sender)
    }
  })

  const chatUsers = Array.from(uniqueUsers.values())

  res.status(200).json(chatUsers)
})

// 2. Get all messages between two users
export const getChatMessages = asyncHandler(async (req, res) => {
  const { userId, otherUserId } = req.body // Take userId and otherUserId from the request body

  const messages = await Chat.find({
    $or: [
      { sender: userId, receiver: otherUserId },
      { sender: otherUserId, receiver: userId },
    ],
  }).sort({ createdAt: 1 })

  if (messages.length === 0) {
    return res.status(200).json({ message: 'No messages found.' })
  }
  res.status(200).json(messages)
})

// 3. Send a new message
export const sendMessage = asyncHandler(async (req, res) => {
  const { message, senderId, receiverId } = req.body // Take senderId and receiverId from the request body

  if (!message) {
    throw new Error('Please enter message.')
  }

  const chat = new Chat({
    ...req.body,
    sender: senderId,
    receiver: receiverId,
  })

  const receiverSocketId = getReceiverSocketId(receiverId)
  if (receiverSocketId) {
    io.to(receiverSocketId).emit('newMessage', message)
    io.emit('newMessage', message)
  }

  try {
    await chat.save()
    res.status(201).json({ message: 'Message sent successfully!' })
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
})

// 4. Edit a message
export const editMessage = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { message, senderId } = req.body // Take senderId from the request body

  if (!message) {
    throw new Error('Please provide a new message.')
  }

  const chatMessage = await Chat.findById(id)

  if (!chatMessage) {
    return res.status(404).json({ message: 'Message not found' })
  }

  if (chatMessage.sender.toString() !== senderId) {
    return res
      .status(403)
      .json({ message: 'You are not authorized to edit this message' })
  }

  chatMessage.message = message
  chatMessage.edited = true
  await chatMessage.save()

  res.status(200).json({ message: 'Message updated successfully!' })
})

// 5. Delete a message
export const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { senderId } = req.body // Take senderId from the request body

  const chatMessage = await Chat.findById(id)

  if (!chatMessage) {
    return res.status(404).json({ message: 'Message not found' })
  }

  if (chatMessage.sender.toString() !== senderId) {
    return res
      .status(403)
      .json({ message: 'You are not authorized to delete this message' })
  }

  chatMessage.deleted = true
  await chatMessage.save()

  const receiverSocketId = getReceiverSocketId(chatMessage.receiver)
  if (receiverSocketId) {
    io.to(receiverSocketId).emit('deleteMessage', chatMessage.message)
    io.emit('newMessage', chatMessage.message)
  }

  res.status(200).json({ message: 'Message deleted successfully!' })
})

// 6. Get the most recent message with a specific user
export const getMostRecentMessage = asyncHandler(async (req, res) => {
  const { userId, otherUserId } = req.body // Take userId and otherUserId from the request body

  const mostRecentMessage = await Chat.findOne({
    $or: [
      { sender: userId, receiver: otherUserId },
      { sender: otherUserId, receiver: userId },
    ],
  })
    .sort({ createdAt: -1 })
    .populate('sender')
    .populate('receiver')

  if (!mostRecentMessage) {
    return res
      .status(404)
      .json({ message: 'No messages found with this user.' })
  }

  res.status(200).json({
    message: mostRecentMessage.message,
    time: mostRecentMessage.createdAt,
    deleted: mostRecentMessage.deleted,
  })
})
