import React, { useState } from 'react'
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Snackbar,
  Alert,
  useTheme,
  styled,
  Paper,
  InputAdornment,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material'
import { motion } from 'framer-motion'
import UploadIcon from '@mui/icons-material/Upload'
import DateRangeIcon from '@mui/icons-material/DateRange'
import DownloadIcon from '@mui/icons-material/Download'
import axios from 'axios'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import {
  useDeleteTimetableByUserIdMutation,
  useGetTimetableByUserIdQuery,
  useSaveTimetableMutation,
  useUpdateScheduleItemsMutation,
} from '../../redux/api/timetableApiSlice'
import { useSelector } from 'react-redux'

// Custom styled components with a modern theme
const StyledButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  border: 0,
  borderRadius: 10,
  color: 'white',
  padding: '10px 20px',
  boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'scale(1.01)',
    boxShadow: '0 5px 7px 2px rgba(33, 150, 243, .4)',
  },
}))

const StyledCard = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(3),
  borderRadius: 10,
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  background: theme.palette.background.paper,
}))

const StyledTable = styled(Table)(({ theme }) => ({
  minWidth: 650,
  '& .MuiTableCell-root': {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}))

const TimetableGeneratorPage = () => {
  const { userInfo } = useSelector((state) => state.user)
  const theme = useTheme()
  const [file, setFile] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  })
  const [anchorEl, setAnchorEl] = useState(null) // For download menu
  const [saveTimetable] = useSaveTimetableMutation()
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile)
    } else {
      setNotification({
        open: true,
        message: 'Please upload a valid PDF file',
        severity: 'error',
      })
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!file || !startDate || !endDate) {
      setNotification({
        open: true,
        message: 'Please fill all fields and upload a PDF',
        severity: 'error',
      })
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('start_date', startDate)
    formData.append('end_date', endDate)
console.log("Helllo")
    try {
      const response = await axios.post(
        'http://localhost:5000/timetable',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      setSchedule(response.data.timetable)
      console.log({response:response})
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error generating timetable. Please try again.',
        severity: 'error',
      })
    }
    setLoading(false)
  }

  const handleSaveTimetable = async () => {
    if (schedule.length === 0) {
      setNotification({
        open: true,
        message: 'No timetable to save. Please generate a timetable first.',
        severity: 'error',
      })
      return
    }

    try {
      await saveTimetable({ userId: userInfo._id, schedule }) // Replace 'currentUserId' with actual user ID
      setNotification({
        open: true,
        message: 'Timetable saved successfully!',
        severity: 'success',
      })
    } catch (error) {
      setNotification({
        open: true,
        message: 'Failed to save timetable. Please try again.',
        severity: 'error',
      })
    }
  }

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(schedule)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Timetable')
    XLSX.writeFile(workbook, 'timetable.xlsx')
    handleCloseMenu()
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.autoTable({
      head: [['Date', 'Day', 'Hours', 'Topic']],
      body: schedule.map((item) => [
        item.date,
        item.day,
        item.hours,
        item.topic,
      ]),
    })
    doc.save('timetable.pdf')
    handleCloseMenu()
  }

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false })
  }

  return (
    <Box sx={{ p: 3, background: theme.palette.background.default }}>
      {/* Page Header */}
      <Typography
        variant="h3"
        gutterBottom
        sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
      >
        Syllabus Timetable Generator
      </Typography>

      {/* Form Section */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
      >
        {/* File Upload Button */}
        <Button
          variant="outlined"
          component="label"
          startIcon={<UploadIcon />}
          sx={{
            width: 'fit-content',
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
          }}
        >
          Upload Syllabus PDF
          <input
            type="file"
            hidden
            accept="application/pdf"
            onChange={handleFileChange}
          />
        </Button>

        {/* Date Inputs */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            sx={{ flex: 1, minWidth: '200px' }}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <DateRangeIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            sx={{ flex: 1, minWidth: '200px' }}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <DateRangeIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Submit Button */}
        <StyledButton type="submit" variant="contained" disabled={loading}>
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Generate Timetable'
          )}
        </StyledButton>
      </Box>

      {/* Timetable Display Section */}
      {schedule?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <StyledCard>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
              {/* Save Timetable Button */}
              <StyledButton onClick={handleSaveTimetable} sx={{ mr: 2 }}>
                Save Timetable
              </StyledButton>

              {/* Download Dropdown */}
              <Tooltip title="Download Options">
                <IconButton color="primary" onClick={handleOpenMenu}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
              >
                <MenuItem onClick={handleExportExcel}>
                  Download as Excel
                </MenuItem>
                <MenuItem onClick={handleExportPDF}>Download as PDF</MenuItem>
              </Menu>
            </Box>

            <Box sx={{ overflowX: 'auto' }}>
              <StyledTable>
                <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Day
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Hours
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Topic
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedule.map((lecture, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <TableCell>{lecture.date}</TableCell>
                      <TableCell>{lecture.day}</TableCell>
                      <TableCell>{lecture.hours}</TableCell>
                      <TableCell>{lecture.topic}</TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </StyledTable>
            </Box>
          </StyledCard>
        </motion.div>
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default TimetableGeneratorPage