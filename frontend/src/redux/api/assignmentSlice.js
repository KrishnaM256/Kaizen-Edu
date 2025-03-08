import { apiSlice } from './apiSlice'
import { BASE_URL } from '../constants'

const ASSIGNMENT_URL = `${BASE_URL}/assignment`

const assignmentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Upload a new assignment
    uploadAssignment: builder.mutation({
      query: (formData) => ({
        url: `${ASSIGNMENT_URL}/upload`,
        method: 'POST',
        body: formData,
        credentials: 'include',
      }),
      invalidatesTags: ['Assignment'],
    }),

    // Get an assignment by ID
    getAssignmentById: builder.query({
      query: (assignmentId) => ({
        url: `${ASSIGNMENT_URL}/${assignmentId}`,
        credentials: 'include',
      }),
      providesTags: (result, error, assignmentId) => [
        { type: 'Assignment', id: assignmentId },
      ],
    }),

    // Get all assignments by class ID
    getAssignmentsByClass: builder.query({
      query: (classId) => ({
        url: `${ASSIGNMENT_URL}/class/${classId}`,
        credentials: 'include',
      }),
      providesTags: ['Assignment'],
    }),

    // Delete an assignment by ID
    deleteAssignment: builder.mutation({
      query: (assignmentId) => ({
        url: `${ASSIGNMENT_URL}/${assignmentId}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: ['Assignment'],
    }),

    // Update an assignment by ID
    updateAssignment: builder.mutation({
      query: ({ assignmentId, formData }) => ({
        url: `${ASSIGNMENT_URL}/${assignmentId}`,
        method: 'PUT',
        body: formData,
        credentials: 'include',
      }),
      invalidatesTags: (result, error, { assignmentId }) => [
        { type: 'Assignment', id: assignmentId },
      ],
    }),

    // Submit an answer for an assignment
    submitAnswer: builder.mutation({
      query: (formData) => ({
        url: `${ASSIGNMENT_URL}/submit-answer`,
        method: 'POST',
        body: formData,
        credentials: 'include',
      }),
      invalidatesTags: (result, error, { assignmentId }) => [
        { type: 'Assignment', id: assignmentId },
      ],
    }),

    // Get submissions for an assignment
    getSubmissions: builder.query({
      query: (assignmentId) => ({
        url: `${ASSIGNMENT_URL}/submissions/${assignmentId}`,
        credentials: 'include',
      }),
      providesTags: (result, error, assignmentId) => [
        { type: 'Submission', id: assignmentId },
      ],
    }),

    // Update the result for a submission
    updateSubmissionResult: builder.mutation({
      query: ({ assignmentId, studentId, results, total_score }) => ({
        url: `${ASSIGNMENT_URL}/${assignmentId}/result`,
        method: 'PUT',
        body: { studentId, results, total_score },
        credentials: 'include',
      }),
      invalidatesTags: (result, error, { assignmentId }) => [
        { type: 'Submission', id: assignmentId },
      ],
    }),

    // Get all assignments with submissions for a teacher (by class ID)
    getAssignmentsWithSubmissions: builder.query({
      query: (classId) => ({
        url: `${ASSIGNMENT_URL}/teacher/${classId}`,
        credentials: 'include',
      }),
      providesTags: ['Assignment'],
    }),

    getAssignmentsWithSubmissionsByAssignmentId: builder.query({
      query: (assignmentId) => ({
        url: `${ASSIGNMENT_URL}/teacher/assignment/${assignmentId}`,
        credentials: 'include',
      }),
    }),
 getStudentAssignmentResult: builder.query({
      query: ({ studentId, assignmentId }) => ({
        url: `${ASSIGNMENT_URL}/getStudentAssignmentResult`,
        method: 'POST',
        body: { studentId, assignmentId },
      }),
      providesTags: (result, error, { studentId, assignmentId }) => [
        { type: 'Submission', id: assignmentId },
        { type: 'Submission', id: studentId },
      ],
    }),
    // Get the result for a specific submission (by assignment ID and student ID)
    getSubmissionResult: builder.query({
      query: ({ assignmentId, studentId }) => ({
        url: `${ASSIGNMENT_URL}/result/${assignmentId}/${studentId}`,
        credentials: 'include',
      }),
      providesTags: (result, error, { assignmentId, studentId }) => [
        { type: 'Submission', id: assignmentId },
        { type: 'Submission', id: studentId },
      ],
    }),
  }),
})

export const {
  useUploadAssignmentMutation,
  useGetAssignmentByIdQuery,
  useGetAssignmentsByClassQuery,
  useDeleteAssignmentMutation,
  useUpdateAssignmentMutation,
  useSubmitAnswerMutation,
  useGetSubmissionsQuery,
  useUpdateSubmissionResultMutation,
  useGetAssignmentsWithSubmissionsQuery,
  useGetSubmissionResultQuery,
  useGetAssignmentsWithSubmissionsByAssignmentIdQuery,
  useGetStudentAssignmentResultQuery
} = assignmentApiSlice
