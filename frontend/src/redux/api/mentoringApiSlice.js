import { apiSlice } from './apiSlice'
import { BASE_URL } from '../constants'

const MENTOR_URL = `${BASE_URL}/mentor`

const mentoringApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Create a mentor profile
    createMentor: builder.mutation({
      query: (mentorData) => ({
        url: `${MENTOR_URL}/create`,
        method: 'POST',
        body: mentorData,
        credentials: 'include',
      }),
      invalidatesTags: ['Mentor'],
    }),

    // Get a mentor profile by ID
    getMentorProfile: builder.query({
      query: (mentorId) => ({
        url: `${MENTOR_URL}/${mentorId}`,
        credentials: 'include',
      }),
      providesTags: (result, error, arg) => [{ type: 'Mentor', id: arg }],
    }),

    // Assign a student to a mentor
    assignStudentToMentor: builder.mutation({
      query: ({ mentorId, studentId }) => ({
        url: `${MENTOR_URL}/assign-student`,
        method: 'POST',
        body: { mentorId, studentId },
        credentials: 'include',
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Mentor', id: arg.mentorId },
        { type: 'Student', id: arg.studentId },
      ],
    }),

    // Remove a student from a mentor
    removeStudentFromMentor: builder.mutation({
      query: ({ mentorId, studentId }) => ({
        url: `${MENTOR_URL}/remove-student`,
        method: 'POST',
        body: { mentorId, studentId },
        credentials: 'include',
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Mentor', id: arg.mentorId },
        { type: 'Student', id: arg.studentId },
      ],
    }),

    // Get all students assigned to a mentor
    getStudentsByMentor: builder.query({
      query: (mentorId) => ({
        url: `${MENTOR_URL}/${mentorId}/students`,
        credentials: 'include',
      }),
    }),
    getAllMentors: builder.query({
      query: () => ({
        url: `${MENTOR_URL}/getAllMentors`,
        credentials: 'include',
      }),
      providesTags: ['Mentor'],
    }),
    getMentorByUserId: builder.query({
      query: (userId) => ({
        url: `${MENTOR_URL}/user/${userId}`,
        credentials: 'include',
      }),
    }),
  }),
})

export const {
  useCreateMentorMutation,
  useGetMentorProfileQuery,
  useAssignStudentToMentorMutation,
  useRemoveStudentFromMentorMutation,
  useGetStudentsByMentorQuery,
  useGetAllMentorsQuery,
  useGetMentorByUserIdQuery,
} = mentoringApiSlice
