import express from 'express'
import http from 'http'
import dotenv from 'dotenv'
dotenv.config()
import { Server } from 'socket.io'
import { getUserDetailsFromToken } from '../helper/getUserDetailsFromToken.js'
import User from '../model/user.model.js'
const Frontend_URL = process.env.Frontend_URL
const app = express()
console.log('Frontend URL:', process.env.Frontend_URL)

// Socket connection
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: Frontend_URL,
    credentials: true,
  },
})

/* online user  */
const onlineUser = new Set()

io.on('connection', async (socket) => {
  console.log('Connected user', socket.id)
  const token = socket.handshake.auth.token
  console.log('token:', token)

  // current user detailed
  const user = await getUserDetailsFromToken(token)
  console.log(user)

  // create a room
  socket.join(user?._id)
  onlineUser.add(user?._id?.toString())

  // send info for to frontend
  io.emit('onlineUser', Array.from(onlineUser))

  socket.on('message-page', async (userId) => {
    console.log('userId:', userId)
    const userDetailed = await User.findById(userId).select('-password')
    console.log('userDetailed', userDetailed)
    const payload = {
      _id: userDetailed?._id,
      name: userDetailed?.name,
      email: userDetailed?.email,
      profile_pic: userDetailed?.profile_pic,
      online: onlineUser.has(userId),
    }
    // console.log('payload:',payload);
    socket.emit('message-page', payload)
  })

  // Handle user disconnection
  socket.on('disconnect', () => {
    onlineUser.delete(user?._id)
    console.log('User disconnected', socket.id)
  })
})

export { app, server }
