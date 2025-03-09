import React from 'react'
import { useGetAllClassesQuery } from '../../redux/api/classApiSlice'
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  LinearProgress,
  TextField,
  InputAdornment,
  Skeleton,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SearchIcon from '@mui/icons-material/Search'
import PersonIcon from '@mui/icons-material/Person'
import { useGetAttendanceByClassIdQuery } from '../../redux/api/lectureApiSlice'
import { useSelector } from 'react-redux'

const Attendance = () => {
  const { userInfo } = useSelector((state) => state.user) // Get user info from Redux store
  const { data: allClasses, isLoading: classesLoading } =
    useGetAllClassesQuery() // Fetch all classes
  const [searchQuery, setSearchQuery] = React.useState('') // State for search query

  // Filter classes based on search query and teacher ID
  const filteredClasses = allClasses?.classes
    ?.filter((classItem) =>
      classItem.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    ?.filter(
      (classItem) =>
        userInfo.role == 'admin' || classItem.teacher._id === userInfo._id
    ) // Only show classes taught by the logged-in teacher

  // If data is still loading, show a loading message
  if (classesLoading) {
    return (
      <Box sx={{ padding: 2 }}>
        <Skeleton variant="text" width={200} height={40} />
        {[...Array(3)].map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            height={100}
            sx={{ my: 2 }}
          />
        ))}
      </Box>
    )
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Attendance Report
      </Typography>

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Search classes..."
        variant="outlined"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {/* Display filtered classes */}
      {filteredClasses?.length > 0 ? (
        filteredClasses.map((classItem) => (
          <ClassAttendance key={classItem._id} classItem={classItem} />
        ))
      ) : (
        <Typography variant="body1" sx={{ textAlign: 'center', mt: 3 }}>
          No classes found.
        </Typography>
      )}
    </Box>
  )
}

// Component to display attendance for a single class
const ClassAttendance = ({ classItem }) => {
  const { data: attendanceData, isLoading: attendanceLoading } =
    useGetAttendanceByClassIdQuery(classItem._id) // Fetch attendance data for the class

  if (attendanceLoading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width={200} height={30} />
        <Skeleton variant="rectangular" height={100} />
      </Box>
    )
  }

  return (
    <Accordion sx={{ mb: 2, boxShadow: 3 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#3f51b5' }}>
            <PersonIcon />
          </Avatar>
          <Typography variant="h6">
            {classItem.name} (Class Code: {classItem.classCode})
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {attendanceData?.attendanceByLecture?.length > 0 ? (
          attendanceData.attendanceByLecture.map((lecture) => (
            <Box key={lecture.lectureId} sx={{ marginBottom: 3 }}>
              <Typography variant="subtitle1" gutterBottom fontSize={'20px'}>
                📚 Lecture: {lecture.title}
              </Typography>

              {/* Attendance Progress Bar */}
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
              >
                <Typography variant="body2">
                  Attendance: {lecture.studentsAttended?.length} students
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={
                    (lecture.studentsAttended?.length /
                      classItem.students?.length) *
                    100
                  }
                  sx={{ height: 10, borderRadius: 5, flexGrow: 1 }}
                />
              </Box>

              {/* Students Table */}
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lecture.studentsAttended?.map((student) => (
                    <TableRow key={student._id} hover>
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                        >
                          <Avatar
                            src={student.avatar}
                            sx={{ bgcolor: '#4caf50' }}
                          >
                            {student.name.charAt(0)}
                          </Avatar>
                          <Typography>{student.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ))
        ) : (
          <Typography variant="body1" sx={{ textAlign: 'center' }}>
            No attendance records found for this class.
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  )
}

export default Attendance
