import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import {
  Grid,
  Typography,
  Avatar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Chip,
  Container,
} from '@mui/material'
import { useGetStudentByIdQuery } from '../../redux/api/studentProfileApiSlice'
import { useGetMentorByUserIdQuery } from '../../redux/api/mentoringApiSlice'
import { motion } from 'framer-motion'
import { styled } from '@mui/system'

const API = import.meta.env.VITE_BACKEND_URL

const StyledCard = styled(Card)(({ theme }) => ({
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[10],
  },
}))

const Profile = () => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null)
  const [userId, setUserId] = useState(null)
  const [error, setError] = useState(null)
  const { userInfo } = useSelector((state) => state.user)
  const [vivaResults, setVivaResults] = useState([])
  const [quizResults, setQuizResults] = useState([])
  const [assignmentResults, setAssignmentResults] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')

  const { data: studentData } = useGetStudentByIdQuery(userInfo?._id)
  const { data: mentorData } = useGetMentorByUserIdQuery(userInfo?._id)

  useEffect(() => {
    if (userInfo?.role) {
      setRole(userInfo.role)
      setUserId(userInfo._id)
    }
  }, [userInfo])

  
  const fetchVivaResults = async () => {
    try {
      const response = await axios.get(
        `${API}/vivaresult/getvivaresultbystudentid/${userId}`
      )
      setVivaResults(response.data)
    } catch (error) {
      console.error('Error fetching viva results:', error)
      setError('Failed to fetch viva results.')
    }
  }

  const fetchQuizResults = async () => {
    try {
      const response = await axios.get(
        `${API}/quizresult/quizresultbystudentid/${userId}`
      )
      setQuizResults(response.data)
    } catch (error) {
      console.error('Error fetching quiz results:', error)
      setError('Failed to fetch quiz results.')
    }
  }

  const fetchAssignmentResults = async () => {
    try {
      const response = await axios.get(`${API}/assignment/${userId}`)
      setAssignmentResults(response?.data)
    } catch (error) {
      console.error('Error fetching assignment results:', error)
      setError('Failed to fetch assignment results.')
    }
  }

  useEffect(() => {
    const fetchAllResults = async () => {
      setLoading(true)
      await fetchVivaResults()
      await fetchQuizResults()
      await fetchAssignmentResults()
      setLoading(false)
    }

    if (userId) {
      fetchAllResults()
    }
  }, [userId])

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        if (role === 'student') {
          const response = await axios.get(
            `${API}/class/getAllClasses/${userId}`
          )
          setClasses(response.data.classes)
        } else if (role === 'teacher') {
          const response = await axios.get(
            `${API}/class/getClassesByTeacherId/${userId}`
          )
          setClasses(response.data.classes)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching classes:', error)
        setError('Failed to fetch classes. Please try again.')
        setLoading(false)
      }
    }

    if (userId) {
      fetchClasses()
    }
  }, [userId, role])

  const filteredVivaResults = selectedClassId
    ? vivaResults.filter((result) => result.vivaId.classid === selectedClassId)
    : vivaResults

  const filteredQuizResults = selectedClassId
    ? quizResults.filter((result) => result.quizid.classid === selectedClassId)
    : quizResults

  const filteredAssignmentResults = selectedClassId
    ? assignmentResults.filter((result) => result.classid === selectedClassId)
    : assignmentResults

  const getStudentAssignmentResults = (assignment) => {
    return assignment.submissions.filter(
      (submission) => submission.studentId === userId
    )
  }

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Compact Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 4,
            p: 3,
            backgroundColor: '#f5f5f5',
            borderRadius: 2,
            boxShadow: 3,
          }}
        >
          <Avatar
            src={userInfo.profile_pic}
            alt={userInfo.name}
            sx={{ width: 80, height: 80, mr: 3, border: '3px solid #fff' }}
          />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
              {userInfo.name}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {userInfo.email}
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {role === 'student' ? (
        <>
          {/* Profile Details Section */}
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 'bold', mb: 4, color: '#333' }}
          >
            Profile Details
          </Typography>
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <StyledCard elevation={3}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 'bold', color: '#555' }}
                  >
                    Academic Status
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#777' }}>
                    GPA: {studentData?.academicStatus?.gpa}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#777' }}>
                    Completed Credits:{' '}
                    {studentData?.academicStatus?.completedCredits}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#777' }}>
                    Current Semester:{' '}
                    {studentData?.academicStatus?.currentSemester}
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <StyledCard elevation={3}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 'bold', color: '#555' }}
                  >
                    Extracurricular Activities
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {studentData?.extracurricular?.map((activity, index) => (
                      <Chip
                        key={index}
                        label={activity}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <StyledCard elevation={3}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 'bold', color: '#555' }}
                  >
                    Internships
                  </Typography>
                  {studentData?.internships?.map((internship, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="body1" sx={{ color: '#777' }}>
                        Company: {internship.company}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#777' }}>
                        Role: {internship.role}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#777' }}>
                        Duration: {internship.duration} months
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </StyledCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <StyledCard elevation={3}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 'bold', color: '#555' }}
                  >
                    Achievements
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {studentData?.achievements?.map((achievement, index) => (
                      <Chip
                        key={index}
                        label={achievement}
                        color="success"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <StyledCard elevation={3}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 'bold', color: '#555' }}
                  >
                    Skills
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {studentData?.skills?.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        color="secondary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <StyledCard elevation={3}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 'bold', color: '#555' }}
                  >
                    Future Plans
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#777' }}>
                    {studentData?.futurePlans}
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>

          {/* Results Section */}
          <FormControl fullWidth sx={{ mb: 4 }}>
            <InputLabel>Select Class</InputLabel>
            <Select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              label="Select Class"
            >
              <MenuItem value="">All Classes</MenuItem>
              {classes.map((cls) => (
                <MenuItem key={cls._id} value={cls.classid}>
                  {cls.classname}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 'bold', mb: 4, color: '#333' }}
          >
            Results
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <StyledCard elevation={3}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 'bold', color: '#555' }}
                  >
                    Viva Results
                  </Typography>
                  {filteredVivaResults.length > 0 ? (
                    <List>
                      {filteredVivaResults.map((result) => (
                        <React.Fragment key={result._id}>
                          <ListItem>
                            <ListItemText
                              primary={result.vivaId.vivaname}
                              sx={{ color: '#777' }}
                            />
                            <ListItemSecondaryAction>
                              <Typography
                                variant="body1"
                                sx={{ fontWeight: 'bold', color: '#333' }}
                              >
                                {result.overallMark}
                              </Typography>
                            </ListItemSecondaryAction>
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body1" sx={{ color: '#777' }}>
                      No viva results found.
                    </Typography>
                  )}
                </CardContent>
              </StyledCard>
            </Grid>

            <Grid item xs={12} md={4}>
              <StyledCard elevation={3}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 'bold', color: '#555' }}
                  >
                    Quiz Results
                  </Typography>
                  {filteredQuizResults.length > 0 ? (
                    <List>
                      {filteredQuizResults.map((result) => (
                        <React.Fragment key={result._id}>
                          <ListItem>
                            <ListItemText
                              primary={result.quizid.quizname}
                              sx={{ color: '#777' }}
                            />
                            <ListItemSecondaryAction>
                              <Typography
                                variant="body1"
                                sx={{ fontWeight: 'bold', color: '#333' }}
                              >
                                {result.overallMark}
                              </Typography>
                            </ListItemSecondaryAction>
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body1" sx={{ color: '#777' }}>
                      No quiz results found.
                    </Typography>
                  )}
                </CardContent>
              </StyledCard>
            </Grid>

            <Grid item xs={12} md={4}>
              <StyledCard elevation={3}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 'bold', color: '#555' }}
                  >
                    Assignment Results
                  </Typography>
                  {filteredAssignmentResults.length > 0 ? (
                    <List>
                      {filteredAssignmentResults.map((assignment) => {
                        const studentResults =
                          getStudentAssignmentResults(assignment)
                        return studentResults.map((result) => (
                          <React.Fragment key={result._id}>
                            <ListItem>
                              <ListItemText
                                primary={assignment.title}
                                sx={{ color: '#777' }}
                              />
                              <ListItemSecondaryAction>
                                <Typography
                                  variant="body1"
                                  sx={{ fontWeight: 'bold', color: '#333' }}
                                >
                                  {result.result.total_score}
                                </Typography>
                              </ListItemSecondaryAction>
                            </ListItem>
                            <Divider />
                          </React.Fragment>
                        ))
                      })}
                    </List>
                  ) : (
                    <Typography variant="body1" sx={{ color: '#777' }}>
                      No assignment results found.
                    </Typography>
                  )}
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        </>
      ) : (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <StyledCard elevation={3}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: 'bold', color: '#555' }}
                >
                  Expertise
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {mentorData?.expertise?.map((expertise, index) => (
                    <Chip
                      key={index}
                      label={expertise}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledCard elevation={3}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: 'bold', color: '#555' }}
                >
                  Skills
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {mentorData?.skills?.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      color="secondary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12}>
            <StyledCard elevation={3}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: 'bold', color: '#555' }}
                >
                  Bio
                </Typography>
                <Typography variant="body1" sx={{ color: '#777' }}>
                  {mentorData?.bio}
                </Typography>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      )}
    </Container>
  )
}

export default Profile
