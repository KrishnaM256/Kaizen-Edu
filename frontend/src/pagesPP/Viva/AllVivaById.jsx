import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  Typography,
  Modal,
  Select,
  MenuItem,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'
import CreateViva from './CreateViva'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

const API = import.meta.env.VITE_BACKEND_URL

const AllVivaById = ({ classId }) => {
  const [vivas, setVivas] = useState([])
  const [openRows, setOpenRows] = useState({})
  const [students, setStudents] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [editMode, setEditMode] = useState(null)
  const [editedData, setEditedData] = useState({})
  const [role, setRole] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const { userInfo } = useSelector((state) => state.user)
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    if (userInfo?.role) {
      setRole(userInfo.role)
    }
  }, [userInfo?.role])

  useEffect(() => {
    const fetchAllVivas = async () => {
      try {
        const response = await axios.get(`${API}/viva/getallViva/${classId}`)
        setVivas(response.data)
      } catch (error) {
        console.error('Error fetching vivas:', error)
      }
    }
    fetchAllVivas()
  }, [classId])

  const fetchRegisteredStudents = async (vivaId) => {
    try {
      const response = await axios.get(
        `${API}/vivaresult/getvivaresult/${vivaId}`
      )
      setStudents((prev) => ({ ...prev, [vivaId]: response?.data }))
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleRowClick = (index, vivaId) => {
    setOpenRows((prev) => ({ ...prev, [index]: !prev[index] }))
    if (!students[vivaId]) fetchRegisteredStudents(vivaId)
  }

  const handleStatusChange = async (vivaId, newStatus) => {
    try {
      await axios.put(`${API}/viva/updateViva/${vivaId}`, { status: newStatus })
      setVivas((prev) =>
        prev.map((viva) =>
          viva._id === vivaId ? { ...viva, status: newStatus } : viva
        )
      )
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleEdit = (viva) => {
    setEditMode(viva._id)
    setEditedData({ ...viva })
  }

  const handleSave = async (vivaId) => {
    try {
      await axios.put(`${API}/viva/updateViva/${vivaId}`, editedData)
      setVivas((prev) =>
        prev.map((viva) => (viva._id === vivaId ? { ...editedData } : viva))
      )
      setEditMode(null)
    } catch (error) {
      console.error('Error updating viva:', error)
    }
  }

  const handleCancel = () => {
    setEditMode(null)
  }

  const handleStartViva = (vivaId) => {
    navigate(`/takepicture/${vivaId}`)
  }

  const StudentDetailsModal = ({ student, open, onClose }) => {
    if (!student) return null

    const downloadPDF = () => {
      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('Student Details', 10, 10)
      doc.setFontSize(12)
      doc.text(`Name: ${student.studentName}`, 10, 20)
      doc.text(`Viva ID: ${student.vivaId}`, 10, 30)
      doc.text(
        `Date of Viva: ${new Date(student.dateOfViva).toLocaleString()}`,
        10,
        40
      )
      doc.text(`Total Questions: ${student.totalQuestions}`, 10, 50)
      doc.text(
        `Questions Attempted: ${student.questionAnswerSet.length}`,
        10,
        60
      )
      doc.text(`Overall Mark: ${student.overallMark}`, 10, 70)

      doc.setFontSize(16)
      doc.text('Proctored Feedback', 10, 90)
      doc.setFontSize(12)
      doc.text(
        `Book Detected Count: ${student?.proctoredFeedback?.bookDetectedCount}`,
        10,
        100
      )
      doc.text(
        `Laptop Detected Count: ${student?.proctoredFeedback?.laptopDetectedCount}`,
        10,
        110
      )
      doc.text(
        `Multiple Users Detected Count: ${student?.proctoredFeedback?.multipleUsersDetectedCount}`,
        10,
        120
      )
      doc.text(
        `Phone Detected Count: ${student?.proctoredFeedback?.phoneDetectedCount}`,
        10,
        130
      )
      doc.text(
        `Tab Switching Detected Count: ${student?.proctoredFeedback?.tabSwitchingDetectedCount}`,
        10,
        140
      )

      doc.setFontSize(16)
      doc.text('Question Details', 10, 160)

      const tableData = student.questionAnswerSet.map((question) => [
        question.questionText,
        question.modelAnswer,
        question.studentAnswer,
        `Relevance: ${question.evaluation?.Relevance || 0}/10\nCompleteness: ${question.evaluation?.Completeness || 0}/10\nAccuracy: ${question.evaluation?.Accuracy || 0}/10\nDepth of Knowledge: ${question.evaluation?.DepthOfKnowledge || 0}/10`,
      ])

      doc.autoTable({
        startY: 170,
        head: [['Question', 'Model Answer', 'Student Answer', 'Evaluation']],
        body: tableData,
      })

      doc.save(`student_report_${student.studentName}.pdf`)
    }

    const formatEvaluation = (evaluation) => {
      if (!evaluation) return null

      const sections = evaluation
        .split('*')
        .filter((section) => section.trim() !== '')

      return sections.map((section, index) => {
        const lines = section.split('\n').filter((line) => line.trim() !== '')
        const title = lines[0].trim()
        const content = lines.slice(1).join('\n').trim()

        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography variant="b0dy2" sx={{}}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {content}
            </Typography>
          </Box>
        )
      })
    }

    return (
      <Modal open={open} onClose={onClose}>
        <Box sx={modalStyle}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            Student Details
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Name:</strong> {student.studentName}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Viva ID:</strong> {student.vivaId}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Date of Viva:</strong>{' '}
            {new Date(student.dateOfViva).toLocaleString()}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Total Questions:</strong> {student.totalQuestions}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Questions Attempted:</strong>{' '}
            {student.questionAnswerSet.length}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Overall Mark:</strong> {student.overallMark}
          </Typography>

          <Typography
            variant="h6"
            gutterBottom
            sx={{ mt: 3, fontWeight: 'bold' }}
          >
            Proctored Feedback
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Book Detected Count:</strong>{' '}
              {student?.proctoredFeedback?.bookDetectedCount}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Laptop Detected Count:</strong>{' '}
              {student?.proctoredFeedback?.laptopDetectedCount}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Multiple Users Detected Count:</strong>{' '}
              {student?.proctoredFeedback?.multipleUsersDetectedCount}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Phone Detected Count:</strong>{' '}
              {student?.proctoredFeedback?.phoneDetectedCount}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Tab Switching Detected Count:</strong>{' '}
              {student?.proctoredFeedback?.tabSwitchingDetectedCount}
            </Typography>
          </Box>

          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Question Details
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Question</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Model Answer</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Student Answer</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Evaluation</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {student.questionAnswerSet.map((question, index) => (
                  <TableRow key={question._id}>
                    <TableCell>{question.questionText}</TableCell>
                    <TableCell>{question.modelAnswer}</TableCell>
                    <TableCell>{question.studentAnswer}</TableCell>
                    <TableCell>
                      {formatEvaluation(question.evaluation)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={downloadPDF}>
              Download PDF
            </Button>
            <Button variant="contained" color="secondary" onClick={onClose}>
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
        <CardHeader
          title="All Vivas"
          titleTypographyProps={{ variant: 'h4', fontWeight: 'bold' }}
          action={
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
              {role === 'teacher' && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsModalOpen(true)}
                  sx={{
                    bgcolor: 'primary.main',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  Create Viva
                </Button>
              )}
            </Box>
          }
        />
        <CardContent>
          <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  {role !== 'student' && <TableCell />}
                  <TableCell sx={{ color: 'white' }}>Viva Name</TableCell>
                  <TableCell sx={{ color: 'white' }}>Questions</TableCell>
                  <TableCell sx={{ color: 'white' }}>
                    Thinking Time (min)
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}>Due Date</TableCell>
                  <TableCell sx={{ color: 'white' }}>Status</TableCell>
                  {role === 'student' ? (
                    <TableCell sx={{ color: 'white' }}>Start Viva</TableCell>
                  ) : (
                    <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {vivas
                  .filter(
                    (viva) =>
                      statusFilter === 'all' || viva.status === statusFilter
                  )
                  .map((viva, index) => (
                    <React.Fragment key={viva._id}>
                      <TableRow sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                        {role !== 'student' && (
                          <TableCell>
                            <IconButton
                              onClick={() => handleRowClick(index, viva._id)}
                            >
                              {openRows[index] ? (
                                <KeyboardArrowUpIcon />
                              ) : (
                                <KeyboardArrowDownIcon />
                              )}
                            </IconButton>
                          </TableCell>
                        )}

                        <TableCell>
                          {editMode === viva._id ? (
                            <TextField
                              size="small"
                              value={editedData.vivaname}
                              onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  vivaname: e.target.value,
                                })
                              }
                            />
                          ) : (
                            viva.vivaname
                          )}
                        </TableCell>

                        <TableCell>{viva.questionAnswerSet.length}</TableCell>

                        <TableCell>
                          {editMode === viva._id ? (
                            <TextField
                              size="small"
                              type="number"
                              value={editedData.timeofthinking}
                              onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  timeofthinking: e.target.value,
                                })
                              }
                            />
                          ) : (
                            viva.timeofthinking
                          )}
                        </TableCell>

                        <TableCell>
                          {editMode === viva._id ? (
                            <TextField
                              size="small"
                              type="date"
                              value={editedData.updatedAt.split('T')[0]}
                              onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  updatedAt: e.target.value,
                                })
                              }
                            />
                          ) : (
                            new Date(viva.updatedAt).toLocaleDateString()
                          )}
                        </TableCell>

                        <TableCell>
                          <RadioGroup row>
                            <FormControlLabel
                              control={
                                <Radio
                                  checked={viva.status !== 'true'}
                                  onChange={() =>
                                    handleStatusChange(viva._id, 'Active')
                                  }
                                  disabled={role === 'student'}
                                />
                              }
                              label="Active"
                            />
                            <FormControlLabel
                              control={
                                <Radio
                                  checked={viva.status === 'true'}
                                  onChange={() =>
                                    handleStatusChange(viva._id, 'Inactive')
                                  }
                                  disabled={role === 'student'}
                                />
                              }
                              label="Inactive"
                            />
                          </RadioGroup>
                        </TableCell>
                        {role === 'student' ? (
                          <TableCell>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleStartViva(viva._id)}
                              sx={{
                                bgcolor: 'success.main',
                                '&:hover': { bgcolor: 'success.dark' },
                              }}
                            >
                              Start Viva
                            </Button>
                          </TableCell>
                        ) : (
                          <TableCell>
                            {editMode === viva._id ? (
                              <>
                                <Tooltip title="Save">
                                  <IconButton
                                    onClick={() => handleSave(viva._id)}
                                  >
                                    <SaveIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Cancel">
                                  <IconButton onClick={handleCancel}>
                                    <CloseIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              <Tooltip title="Edit">
                                <IconButton onClick={() => handleEdit(viva)}>
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                      {role !== 'student' && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            sx={{ paddingBottom: 0, paddingTop: 0 }}
                          >
                            <Collapse
                              in={openRows[index]}
                              timeout="auto"
                              unmountOnExit
                            >
                              <Box sx={{ margin: 1 }}>
                                <Typography
                                  variant="h6"
                                  gutterBottom
                                  component="div"
                                >
                                  Registered Students:{' '}
                                  {students[viva._id]
                                    ? students[viva._id].data.length
                                    : 0}
                                </Typography>

                                {students[viva._id] ? (
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Total Question</TableCell>
                                        <TableCell>
                                          Total Question Attempted
                                        </TableCell>
                                        <TableCell>Date/Time</TableCell>
                                        <TableCell>Score</TableCell>
                                        <TableCell>Details</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {Array.isArray(
                                        students[viva._id]?.data
                                      ) ? (
                                        students[viva._id].data.map(
                                          (student) => (
                                            <TableRow key={student._id}>
                                              <TableCell>
                                                {student.studentName}
                                              </TableCell>
                                              <TableCell>
                                                {student.totalQuestions}
                                              </TableCell>
                                              <TableCell>
                                                {
                                                  student.questionAnswerSet
                                                    .length
                                                }
                                              </TableCell>
                                              <TableCell>
                                                {new Date(
                                                  student.dateOfViva
                                                ).toLocaleString()}
                                              </TableCell>
                                              <TableCell>
                                                {student.overallMark}
                                              </TableCell>
                                              <TableCell>
                                                <Button
                                                  variant="contained"
                                                  color="primary"
                                                  onClick={() => {
                                                    setSelectedStudent(student)
                                                    setIsStudentModalOpen(true)
                                                  }}
                                                >
                                                  Details
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          )
                                        )
                                      ) : (
                                        <Typography>
                                          No students registered yet.
                                        </Typography>
                                      )}
                                    </TableBody>
                                  </Table>
                                ) : (
                                  <Typography>
                                    No students registered yet.
                                  </Typography>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box sx={modalStyle}>
          <CreateViva onClose={() => setIsModalOpen(false)} classId={classId} />
        </Box>
      </Modal>

      <StudentDetailsModal
        student={selectedStudent}
        open={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
      />
    </Box>
  )
}

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: '1000px',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: '90vh',
  overflowY: 'auto',
}

export default AllVivaById
