import { apiSlice } from './apiSlice'
import { BASE_URL } from '../constants'

const CLASS_URL = `${BASE_URL}/class`

const classApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createClass: builder.mutation({
      query: (data) => ({
        url: `${CLASS_URL}/create`,
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: ['Class'],
    }),
    joinClass: builder.mutation({
      query: (data) => ({
        url: `${CLASS_URL}/join`,
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: ['Class'],
    }),
    updateClass: builder.mutation({
      query: ({ classId, data }) => ({
        url: `${CLASS_URL}/update/${classId}`,
        method: 'PUT',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: ['Class'],
    }),
    deleteClass: builder.mutation({
      query: ({ classId, teacherId }) => ({
        url: `${CLASS_URL}/delete/${classId}`,
        method: 'DELETE',
        body: { teacherId }, // Pass teacherId in the body
        credentials: 'include',
      }),
      invalidatesTags: ['Class'],
    }),
    getClassDetails: builder.query({
      query: (classId) => ({
        url: `${CLASS_URL}/${classId}`,
        credentials: 'include',
      }),
    }),
    getAllClasses: builder.query({
      query: (userId) => ({
        url: `${CLASS_URL}/getAllClasses`,
        method: 'POST',
        body: { userId },
        credentials: 'include',
      }),
      providesTags: ['Class'], // Optional: For caching and invalidation
    }),
    getAllPublicClasses: builder.query({
      query: (data) => ({
        url: `${CLASS_URL}/getAllPublicClasses`,
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
      providesTags: ['Class'], // Optional: For caching and invalidation
    }),
    leaveClass: builder.mutation({
      query: ({ classId, studentId }) => ({
        url: `${CLASS_URL}/leave/${classId}`,
        method: 'PUT',
        body: { studentId },
        credentials: 'include',
      }),
      invalidatesTags: ['Class'],
    }),
    // New endpoint to get all students with their names, emails, and class names
    getAllStudentsWithClassInfo: builder.query({
      query: () => ({
        url: `${CLASS_URL}/students`,
        credentials: 'include',
      }),
      providesTags: ['Class'], // Optional: For caching and invalidation
    }),
    markCourseCompleted: builder.mutation({
      query: (classId) => ({
        url: `${CLASS_URL}/complete/${classId}`,
        method: 'PUT',
        credentials: 'include',
      }),
      invalidatesTags: ['Class'],
    }),
  }),
})

export const {
  useCreateClassMutation,
  useJoinClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useGetClassDetailsQuery,
  useLeaveClassMutation,
  useGetAllClassesQuery,
  useGetAllStudentsWithClassInfoQuery,
  useGetAllPublicClassesQuery,
  useMarkCourseCompletedMutation,
} = classApiSlice
