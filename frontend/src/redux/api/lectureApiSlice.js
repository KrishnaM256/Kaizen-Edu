import { apiSlice } from './apiSlice'
import { BASE_URL } from '../constants'

const LECTURE_URL = `${BASE_URL}/lecture`

const lectureApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    uploadLecture: builder.mutation({
      query: (formData) => ({
        url: `${LECTURE_URL}/upload`,
        method: 'POST',
        body: formData,
        credentials: 'include',
      }),
      invalidatesTags: ['Lecture'],
    }),

    getLectureById: builder.query({
      query: (lectureId) => ({
        url: `${LECTURE_URL}/${lectureId}`,
        credentials: 'include',
      }),
    }),

    getLecturesByClass: builder.query({
      query: (classId) => ({
        url: `${LECTURE_URL}/class/${classId}`,
        credentials: 'include',
      }),
    }),

    deleteLecture: builder.mutation({
      query: (lectureId) => ({
        url: `${LECTURE_URL}/${lectureId}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: ['Lecture'],
    }),
    // Mark attendance for a lecture
    markAttendance: builder.mutation({
      query: ({ lectureId, userId }) => ({
        url: `${LECTURE_URL}/mark-attendance`,
        method: 'POST',
        body: { lectureId, userId },
        credentials: 'include',
      }),
      invalidatesTags: ['Lecture'],
    }),

    // Get attendance by class ID (grouped by lecture ID)
    getAttendanceByClassId: builder.query({
      query: (classId) => ({
        url: `${LECTURE_URL}/attendance/${classId}`,
        credentials: 'include',
      }),
      providesTags: ['Lecture'],
    }),
  }),
})

export const {
  useUploadLectureMutation,
  useGetLectureByIdQuery,
  useGetLecturesByClassQuery,
  useDeleteLectureMutation,
  useGetAttendanceByClassIdQuery,
  useMarkAttendanceMutation,
} = lectureApiSlice
