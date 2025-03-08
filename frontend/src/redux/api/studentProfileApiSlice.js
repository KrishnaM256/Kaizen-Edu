import { apiSlice } from './apiSlice'
import { BASE_URL } from '../constants'

const STUDENT_URL = `${BASE_URL}/student`

const studentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Create a new student
    createStudent: builder.mutation({
      query: (studentData) => ({
        url: `${STUDENT_URL}/create`, // Matches POST /create
        method: 'POST',
        body: studentData,
        credentials: 'include',
      }),
      invalidatesTags: ['Student'],
    }),

    // Get student details by user ID
    getStudentById: builder.query({
      query: (userId) => ({
        url: `${STUDENT_URL}/profile`, // Matches POST /profile
        method: 'POST',
        body: { userId }, // Send userId in the body
        credentials: 'include',
      }),
      providesTags: (result, error, arg) => [{ type: 'Student', id: arg }],
    }),

    // Update student details
    updateStudent: builder.mutation({
      query: ({ studentId, updates }) => ({
        url: `${STUDENT_URL}/update`, // Matches PUT /update
        method: 'PUT',
        body: { studentId, updates }, // Send studentId and updates in the body
        credentials: 'include',
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Student', id: arg.studentId },
      ],
    }),

    // Delete a student
    deleteStudent: builder.mutation({
      query: (studentId) => ({
        url: `${STUDENT_URL}/delete`, // Matches DELETE /delete
        method: 'DELETE',
        body: { studentId }, // Send studentId in the body
        credentials: 'include',
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Student', id: arg }],
    }),

    // Assign mentor to student
    assignMentorToStudent: builder.mutation({
      query: ({ studentId, mentorId }) => ({
        url: `${STUDENT_URL}/assign-mentor`, // Matches POST /assign-mentor
        method: 'POST',
        body: { studentId, mentorId }, // Send studentId and mentorId in the body
        credentials: 'include',
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Student', id: arg.studentId },
      ],
    }),

    // Get all students in a class
    getStudentsByClass: builder.query({
      query: (classId) => ({
        url: `${STUDENT_URL}/class/${classId}`, // Matches GET /class/:classId
        credentials: 'include',
      }),
      providesTags: (result, error, arg) => [{ type: 'Student', id: arg }],
    }),
    getAllStudents: builder.query({
      query: () => ({
        url: `${STUDENT_URL}/getAllStudents`,
        method: 'GET', // Changed to GET
        credentials: 'include',
      }),
      providesTags: ['Student'],
    }),
  }),
})

export const {
  useCreateStudentMutation,
  useGetStudentByIdQuery,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useAssignMentorToStudentMutation,
  useGetStudentsByClassQuery,
  useGetAllStudentsQuery,
} = studentApiSlice
