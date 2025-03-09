import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import {
  useGetMentorByUserIdQuery,
  useGetStudentsByMentorQuery,
} from '../../redux/api/mentoringApiSlice'
import { useGetStudentByIdQuery } from '../../redux/api/studentProfileApiSlice'
import {
  useSendMessageMutation,
  useGetChatMessagesMutation,
} from '../../redux/api/chatApiSlice'

const ChattingPage = () => {
  const { userInfo } = useSelector((state) => state.user)
  const [senderId, setSenderId] = useState(null)
  const [receiverId, setReceiverId] = useState(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const messagesEndRef = useRef(null)

  const [sendMessage] = useSendMessageMutation()
  const [getChatMessages] = useGetChatMessagesMutation()

  useEffect(() => {
    if (userInfo?._id) {
      setSenderId(userInfo._id)
    }
  }, [userInfo])

  // Fetch mentees for mentor
  let mentees = []
  if (userInfo?.role === 'teacher') {
    const { data } = useGetMentorByUserIdQuery(userInfo._id)
    mentees = data?.students || []
  }

  // Fetch student data for mentee
  const { data: studentData } = useGetStudentByIdQuery(userInfo?._id, {
    skip: userInfo?.role !== 'student',
  })

  // Set receiverId for mentee (student)
  useEffect(() => {
    if (userInfo?.role === 'student' && studentData?.mentor?.user?._id) {
      setReceiverId(studentData.mentor.user._id)
      setSelectedUser(studentData.mentor.user) // Set selected user to mentor
    }
  }, [studentData, userInfo])

  // Fetch messages when senderId or receiverId changes
  useEffect(() => {
    if (senderId && receiverId) {
      fetchMessages()
    } else {
      setMessages([]) // Reset messages if senderId or receiverId is not set
    }
  }, [senderId, receiverId])

  // Fetch messages between sender and receiver
  const fetchMessages = async () => {
    try {
      const res = await getChatMessages({
        userId: senderId,
        otherUserId: receiverId,
      }).unwrap()
      if (Array.isArray(res)) {
        setMessages(res)
      } else {
        console.error('Expected an array of messages, but got:', res)
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      setMessages([])
    }
  }

  // Send a new message
  const handleSendMessage = async () => {
    if (!message.trim()) return

    try {
      await sendMessage({ message, senderId, receiverId }).unwrap()
      setMessage('')
      fetchMessages() // Refresh messages after sending
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // Handle user selection (for mentor)
  const handleUserSelect = (user) => {
    setSelectedUser(user)
    setReceiverId(user._id)
  }

  // Scroll to the bottom of the chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex h-[650px] bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/4 bg-white border-r border-gray-200 p-6">
        <h3 className="text-xl font-semibold mb-6">
          {userInfo?.role === 'teacher' ? 'Mentees' : 'Mentor'}
        </h3>
        <ul className="space-y-2">
          {userInfo?.role === 'teacher' ? (
            // Show list of mentees for mentor
            mentees.map((mentee) => (
              <li
                key={mentee._id}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedUser?._id === mentee._id
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleUserSelect(mentee.user)}
              >
                <span className="font-medium">{mentee.user.name}</span>
              </li>
            ))
          ) : (
            // Show mentor for mentee
            <li
              className={`p-4 rounded-lg cursor-pointer transition-colors ${
                selectedUser?._id === studentData?.mentor?.user?._id
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleUserSelect(studentData?.mentor?.user)}
            >
              <span className="font-medium">
                {studentData?.mentor?.user?.name}
              </span>
            </li>
          )}
        </ul>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-lg m-6 overflow-hidden">
        {/* Chat Header */}
        <div className="bg-blue-500 text-white p-4">
          <h2 className="text-xl font-semibold">
            {selectedUser ? selectedUser.name : 'Select a user to chat'}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {Array.isArray(messages) && messages.length > 0 ? (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex mb-4 ${
                  msg.sender === senderId ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-md p-4 rounded-lg ${
                    msg.sender === senderId
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 shadow-sm'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-6">
              No messages yet. Start the conversation!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 p-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChattingPage
