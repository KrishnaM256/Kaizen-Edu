import React, { useState } from 'react'
import './ClassPage.css'
import {
  useGetClassDetailsQuery,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useLeaveClassMutation,
} from '../../redux/api/classApiSlice'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Modal,
  Button,
  TextField,
  Card,
  CardContent,
  CardActions,
  Snackbar,
  Alert,
} from '@mui/material'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import {
  useDeleteLectureMutation,
  useGetLecturesByClassQuery,
  useUploadLectureMutation,
} from '../../redux/api/lectureApiSlice'
import { useSelector } from 'react-redux'
import AssignmentPage from './AssignmentPage'
import CommunityPage from './communityPage'

import CreateViva from '../../pagesPP/Viva/CreateViva'
import ShowAllViva from '../../pagesPP/Viva/AllVivaById'
import TakePicture from '../../pagesPP/Viva/TakePicture'
import HomeQuiz from '../../pagesPP/Quiz/QuizManagement'
import VideoMetting from '../../pagesPP/VideoCall/VideoMetting'
import SelfStudy from './SelfStudy'
function CustomTabPanel(props) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  }
}

const ClassPage = ({ classId }) => {
  const { data: classData, isLoading, error } = useGetClassDetailsQuery(classId)
  const navigate = useNavigate()
  const [value, setValue] = useState(0)
  const [openModal, setOpenModal] = useState(false)
  const { userInfo } = useSelector((state) => state.user)
  const [lectureData, setLectureData] = useState({
    title: '',
    description: '',
    youtubeLink: '',
    video: null,
  })
  console.log(userInfo.role)
  const [uploadLecture] = useUploadLectureMutation()
  const { data: lectures, refetch } = useGetLecturesByClassQuery(classId)
  const [deleteLecture] = useDeleteLectureMutation()
  const [updateClass] = useUpdateClassMutation()
  const [deleteClass] = useDeleteClassMutation()
  const [leaveClass] = useLeaveClassMutation()
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const handleUploadLecture = () => {
    setOpenModal(true)
  }

  const handleInputChange = (e) => {
    setLectureData({ ...lectureData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    setLectureData({ ...lectureData, video: e.target.files[0] })
  }

  const handleSubmit = async () => {
    const formData = new FormData()
    formData.append('title', lectureData.title)
    formData.append('description', lectureData.description)
    formData.append('youtubeLink', lectureData.youtubeLink)
    formData.append('video', lectureData.video)
    formData.append('classId', classId)
    formData.append('teacherId', userInfo._id)
    try {
      await uploadLecture(formData).unwrap()
      setSnackbarMessage('Lecture uploaded successfully')
      setSnackbarSeverity('success')
      setSnackbarOpen(true)
      setOpenModal(false)
      refetch() // Refetch lectures after upload
    } catch (error) {
      setSnackbarMessage('Error uploading lecture')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
    setLectureData({ title: '', description: '', youtubeLink: '', video: null })
  }

  const handleDeleteLecture = async (lectureId) => {
    try {
      await deleteLecture(lectureId).unwrap()
      setSnackbarMessage('Lecture deleted successfully')
      setSnackbarSeverity('success')
      setSnackbarOpen(true)
      refetch() // Refetch lectures after deletion
    } catch (error) {
      setSnackbarMessage('Error deleting lecture')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }

  const handleDeleteClass = async () => {
    try {
      const teacherId = userInfo._id // Get the teacherId from the logged-in user
      await deleteClass({ classId, teacherId }).unwrap() // Pass both classId and teacherId
      setSnackbarMessage('Class deleted successfully')
      setSnackbarSeverity('success')
      setSnackbarOpen(true)
      navigate('/main') // Navigate to home after deletion
    } catch (error) {
      setSnackbarMessage('Error deleting class')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }

  const handleLeaveClass = async () => {
    try {
      await leaveClass({ classId, studentId: userInfo._id }).unwrap()
      setSnackbarMessage('Left class successfully')
      setSnackbarSeverity('success')
      setSnackbarOpen(true)
      navigate('/main')
    } catch (error) {
      setSnackbarMessage('Error leaving class')
      setSnackbarSeverity('error')
      setSnackbarOpen(true) // Show error message
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
  }

  if (isLoading) return <div className="loading">Loading class details...</div>
  if (error) return <div className="error">Error loading class details</div>

  return (
    <>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
          >
            <Tab label="Lectures" {...a11yProps(0)} />
            <Tab label="Assignments" {...a11yProps(1)} />
            <Tab label="Quizzes" {...a11yProps(2)} />
            <Tab label="Viva Assignment" {...a11yProps(3)} />
            <Tab label="Community" {...a11yProps(4)} />
            <Tab label="Live meeting " {...a11yProps(5)} />
            {userInfo?.role == 'student' && (
              <Tab label="Self Study" {...a11yProps(6)} />
            )}
          </Tabs>
        </Box>

        <CustomTabPanel value={value} index={0}>
          <div className="class-container">
            <section className="class-header">
              <h1 className="class-title">{classData?.classData?.name}</h1>
              <p className="class-code">
                Class Code: {classData?.classData?.classCode}
              </p>
              <p className="class-teacher">
                Teacher: {classData?.classData?.teacher?.name}
              </p>
            </section>
            {userInfo?.role === 'teacher' && (
              <div className="action-buttons">
                <Button
                  variant="contained"
                  startIcon={<UploadFileIcon />}
                  onClick={handleUploadLecture}
                >
                  Upload Lecture
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() =>
                    confirm('Are you sure you want to delete class?') &&
                    handleDeleteClass()
                  }
                >
                  Delete Class
                </Button>
              </div>
            )}
            {userInfo?.role === 'student' && (
              <div className="action-buttons">
                <Button
                  variant="contained"
                  color="error"
                  onClick={() =>
                    confirm('Are you sure you want to leave this class?') &&
                    handleLeaveClass()
                  }
                >
                  Leave Class
                </Button>
              </div>
            )}
          </div>

          <div className="allLectures">
            {lectures?.lectures?.map((lecture) => (
              <Card key={lecture._id} className="lecture-card">
                <CardContent>
                  <Typography variant="h6">
                    {lecture.title.length > 50
                      ? `${lecture.title.substring(0, 50)}...`
                      : lecture.title}
                  </Typography>
                  {lecture.youtubeLink && (
                    <div className="youtube-container">
                      <iframe
                        width="100%"
                        height="260"
                        src={lecture.youtubeLink
                          .replace('watch?v=', 'embed/')
                          .replace('youtu.be/', 'www.youtube.com/embed/')}
                        title={lecture.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                  <Typography variant="body2" color="textSecondary">
                    {lecture.description.length > 200
                      ? `${lecture.description.substring(0, 100)}...`
                      : lecture.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => navigate(`/lecture/${lecture._id}`)}
                  >
                    Attend Lecture
                  </Button>
                  {userInfo.role === 'teacher' && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteLecture(lecture._id)}
                    >
                      Delete Lecture
                    </Button>
                  )}
                </CardActions>
              </Card>
            ))}
          </div>
        </CustomTabPanel>

        <CustomTabPanel value={value} index={1}>
          <Typography>
            <AssignmentPage classId={classId} />
          </Typography>
        </CustomTabPanel>

        <CustomTabPanel value={value} index={2}>
          <HomeQuiz classId={classId} />
        </CustomTabPanel>

        {/* Viva Assignment Tab */}
        <CustomTabPanel value={value} index={3}>
          <ShowAllViva classId={classId} />
        </CustomTabPanel>

        {/* community Tab */}
        <CustomTabPanel value={value} index={4}>
          <Typography>
            <CommunityPage classId={classId} />
          </Typography>
        </CustomTabPanel>
        {userInfo?.role == 'student' && (
          <CustomTabPanel value={value} index={6}>
            <Typography>
              <SelfStudy />
            </Typography>
          </CustomTabPanel>
        )}
        <CustomTabPanel value={value} index={5}>
          <Typography>
            <VideoMetting classId={classId} role={userInfo.role}/>
          </Typography>
        </CustomTabPanel>
        
      </Box>

      {/* Upload Lecture Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box className="modal-box">
          <Typography variant="h6">Upload Lecture</Typography>
          <TextField
            name="title"
            label="Title"
            fullWidth
            margin="dense"
            value={lectureData.title}
            onChange={handleInputChange}
          />
          <TextField
            name="description"
            label="Description"
            fullWidth
            margin="dense"
            multiline
            rows={3}
            value={lectureData.description}
            onChange={handleInputChange}
          />
          <TextField
            name="youtubeLink"
            label="YouTube Video Link"
            fullWidth
            margin="dense"
            value={lectureData.youtubeLink}
            onChange={handleInputChange}
          />
          <input
            type="file"
            accept="video/*"
            style={{ marginTop: '10px' }}
            onChange={handleFileChange}
          />
          <div className="modal-actions">
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              Upload
            </Button>
          </div>
        </Box>
      </Modal>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default ClassPage
