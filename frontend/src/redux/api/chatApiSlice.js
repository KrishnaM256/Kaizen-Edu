import { apiSlice } from './apiSlice'
import { BASE_URL } from '../constants'

const CHAT_URL = `${BASE_URL}/chat`

export const chatApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all chat users involved in conversations
    getChatUsers: builder.mutation({
      query: (data) => ({
        url: `${CHAT_URL}/users`,
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
    }),

    // Get all messages between two users
    getChatMessages: builder.mutation({
      query: (data) => ({
        url: `${CHAT_URL}/messages`,
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
    }),

    // Send a new message
    sendMessage: builder.mutation({
      query: (data) => ({
        url: `${CHAT_URL}/send`,
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
    }),

    // Edit a message
    editMessage: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${CHAT_URL}/edit/${id}`,
        method: 'PUT',
        body: data,
        credentials: 'include',
      }),
    }),

    // Delete a message
    deleteMessage: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${CHAT_URL}/delete/${id}`,
        method: 'DELETE',
        body: data,
        credentials: 'include',
      }),
    }),

    // Get the most recent message with a specific user
    getMostRecentMessage: builder.mutation({
      query: (data) => ({
        url: `${CHAT_URL}/recent`,
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
    }),
  }),
})

export const {
  useGetChatUsersMutation,
  useGetChatMessagesMutation,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useGetMostRecentMessageMutation,
} = chatApiSlice
