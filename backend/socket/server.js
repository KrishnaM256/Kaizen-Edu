import express from 'express'
import { Server } from 'socket.io'
import http from 'http'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.Frontend_URL,
    credentials: true,
  },
})

export const getReceiverSocketId = (receiverId) => {
  return users[receiverId]
}

const users = {}

io.on('connection', (socket) => {
  console.log('User connected: ', socket.id)
  const userId = socket.handshake.query.userId
  if (userId) {
    users[userId] = socket.id
  }
  // used to send the events to all connected users
  io.emit('getOnlineUsers', Object.keys(users))
  console.log('Users online: ', users)
  // used to listen client side events emitted by server side (server & client)
  socket.on('disconnect', () => {
    console.log('a user disconnected', socket.id)
    delete users[userId]
    io.emit('getOnlineUsers', Object.keys(users))
  })
})

export { app, server, io }
