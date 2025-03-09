import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  Button,
  Dialog,
  TextField,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid,
  CircularProgress,
  Divider,
  Box,
  IconButton,
} from '@mui/material'
import {
  VideoCall,
  Close,
  Shuffle,
  Person,
  MeetingRoom,
} from '@mui/icons-material';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserGraduate,
  FaChalkboardTeacher,
} from 'react-icons/fa'
import {
  useCreateStudentMutation,
  useDeleteStudentMutation,
  useGetAllStudentsQuery,
  useGetStudentByIdQuery,
  useUpdateStudentMutation,
} from './../../redux/api/studentProfileApiSlice'
import {
  useCreateMentorMutation,
  useGetAllMentorsQuery,
  useAssignStudentToMentorMutation,
  useGetStudentsByMentorQuery,
  useGetMentorByUserIdQuery,
} from '../../redux/api/mentoringApiSlice'
import VideoMettingMentor from './VideoMettingMentor.jsx'
const skillsList = [
  'Python',
  'Data Science',
  'Machine Learning',
  'Web Development',
  'Automation',
  'Scripting',
  'Java',
  'Android Development',
  'Enterprise Applications',
  'C++',
  'Game Development',
  'System Programming',
  'Embedded Systems',
  'JavaScript',
  'Frontend Development',
  'Full Stack Development',
  'C',
  'Operating Systems',
  'C#',
  'Windows Applications',
  'Enterprise Software',
  'R',
  'Statistical Analysis',
  'Bioinformatics',
  'Swift',
  'iOS Development',
  'Mobile App Development',
  'Kotlin',
  'Go',
  'Backend Development',
  'Cloud Computing',
  'Microservices',
  'Ruby',
  'PHP',
  'TypeScript',
  'SQL',
  'Database Management',
  'Data Analysis',
  'Bash',
  'DevOps',
  'Deep Learning',
  'Artificial Intelligence',
  'Predictive Analytics',
  'Data Visualization',
  'Statistics',
  'Natural Language Processing',
  'Computer Vision',
  'Big Data',
  'Data Engineering',
  'HTML',
  'CSS',
  'React',
  'Angular',
  'Vue.js',
  'Node.js',
  'Django',
  'Flask',
  'Spring Boot',
  'REST APIs',
  'GraphQL',
  'React Native',
  'Flutter',
  'AWS',
  'Azure',
  'Google Cloud',
  'Docker',
  'Kubernetes',
  'CI/CD',
  'Terraform',
  'Ansible',
  'Object-Oriented Programming',
  'Design Patterns',
  'System Design',
  'Agile Methodology',
  'Scrum',
  'Version Control (Git)',
  'Testing',
  'Debugging',
  'IoT',
  'Robotics',
  'Circuit Design',
  'PCB Design',
  'Signal Processing',
  'Power Systems',
  'Control Systems',
  'CAD',
  'Thermodynamics',
  'Fluid Mechanics',
  'Structural Analysis',
  'Mechatronics',
  'Manufacturing',
  'Materials Science',
  'Project Management',
  'Leadership',
  'Communication',
  'Public Speaking',
  'Teamwork',
  'Time Management',
  'Problem Solving',
  'Critical Thinking',
  'Negotiation',
  'Emotional Intelligence',
  'Blockchain',
  'Cybersecurity',
  'UI/UX Design',
  'Game Development',
  '3D Modeling',
  'AR/VR',
  'Quantum Computing',
  'Bioinformatics',
  'Ethical Hacking',
]

const MentorMenteePage = ({ classId }) => {
  const { userInfo } = useSelector((state) => state.user)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateMentorModalOpen, setIsCreateMentorModalOpen] = useState(false)
  const [isAssignMentorModalOpen, setIsAssignMentorModalOpen] = useState(false)
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  const [studentData, setStudentData] = useState({
    user: userInfo?._id,
    academicStatus: { gpa: 0, completedCredits: 0, currentSemester: 0 },
    extracurricular: [],
    internships: [{ company: '', role: '', duration: '' }],
    achievements: [],
    skills: [],
    futurePlans: '',
  })
  const [mentorData, setMentorData] = useState({
    user: userInfo?._id,
    expertise: [],
    bio: '',
    timeSlots: [{ day: '', startTime: '', endTime: '' }],
    skills: [],
  })
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [selectedMentorId, setSelectedMentorId] = useState(null)
  const [suggestionList, setSuggestionList] = useState([])

  const [createStudentProfile, { isLoading: isCreatingStudent }] =
    useCreateStudentMutation()
  const [updateStudentProfile, { isLoading: isUpdatingStudent }] =
    useUpdateStudentMutation()
  const [deleteStudentProfile, { isLoading: isDeletingStudent }] =
    useDeleteStudentMutation()
  const [createMentorProfile, { isLoading: isCreatingMentor }] =
    useCreateMentorMutation()
  const [assignStudentToMentor, { isLoading: isAssigningMentor }] =
    useAssignStudentToMentorMutation()

  const {
    data: students,
    refetch: refetchStudents,
    isLoading: isLoadingStudents,
  } = useGetAllStudentsQuery()
  const {
    data: mentors,
    refetch: refetchMentors,
    isLoading: isLoadingMentors,
  } = useGetAllMentorsQuery()
  const { data: student, isLoading: isLoadingStudent } =
    useGetStudentByIdQuery(selectedStudentId)
  const { data: currstudent, isLoading: isLoadingStudent2 } =
    useGetStudentByIdQuery(userInfo?._id)
  const { data: mentor, isLoading: isLoadingMentor } =
    useGetMentorByUserIdQuery(userInfo?._id)
  const {
    data: studentsMentoring,
    refetch: refetchStds,
    isLoading: isLoadingMentoredStudents,
  } = useGetStudentsByMentorQuery(mentor?._id)

  useEffect(() => {
    if (userInfo?.role === 'teacher') {
      refetchStds()
    }
  }, [userInfo, refetchStds])

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ]

  const handleCreateStudent = async () => {
    if (!studentData?.user || !studentData?.academicStatus?.gpa) {
      alert('Please fill all required fields')
      return
    }
    try {
      await createStudentProfile({
        ...studentData,
        classId: userInfo.classId,
      }).unwrap()
      alert('Student Profile Created Successfully!')
      setIsCreateModalOpen(false)
      setStudentData({
        user: userInfo?._id,
        academicStatus: { gpa: 0, completedCredits: 0, currentSemester: 0 },
        extracurricular: [],
        internships: [{ company: '', role: '', duration: '' }],
        achievements: [],
        skills: [],
        futurePlans: '',
      })
      refetchStudents()
    } catch (error) {
      alert(error.data?.message || 'Failed to create student profile')
    }
  }

  const handleSuggestList = async (student) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentees: [{ name: student.user?.name, skills: student.skills }],
          mentors: mentors?.map((mentor) => ({
            name: mentor.user?.name,
            domains: mentor.skills,
          })),
        }),
      })
      const data = await response.json()
      setSuggestionList(data.matched_mentors)
    } catch (error) {
      console.log(error)
    }
  }

  const handleCreateMentor = async () => {
    if (!mentorData.user || !mentorData.expertise.length) {
      alert('Please fill all required fields')
      return
    }
    try {
      await createMentorProfile(mentorData).unwrap()
      alert('Mentorship Account Created Successfully!')
      setIsCreateMentorModalOpen(false)
      setMentorData({
        user: userInfo?._id,
        expertise: [],
        bio: '',
        timeSlots: [{ day: '', startTime: '', endTime: '' }],
        skills: [],
      })
      refetchMentors()
    } catch (error) {
      alert(error.data?.message || 'Failed to create mentorship account')
    }
  }

  const handleUpdateStudent = async () => {
    if (!studentData?.user || !studentData?.academicStatus?.gpa) {
      alert('Please fill all required fields')
      return
    }
    try {
      await updateStudentProfile({
        id: selectedStudentId,
        updates: studentData,
      }).unwrap()
      alert('Student Profile Updated Successfully!')
      setIsEditModalOpen(false)
      setStudentData({
        user: userInfo._id,
        academicStatus: { gpa: 0, completedCredits: 0, currentSemester: 0 },
        extracurricular: [],
        internships: [{ company: '', role: '', duration: '' }],
        achievements: [],
        skills: [],
        futurePlans: '',
      })
      refetchStudents()
    } catch (error) {
      alert(error.data?.message || 'Failed to update student profile')
    }
  }

  const handleDeleteStudent = async (id) => {
    try {
      await deleteStudentProfile(id).unwrap()
      alert('Student Profile Deleted Successfully!')
      refetchStudents()
    } catch (error) {
      alert(error.data?.message || 'Failed to delete student profile')
    }
  }

  const handleAssignMentor = async (studentId, mentorId) => {
    if (!mentorId) {
      alert('Please select a mentor')
      return
    }
    try {
      await assignStudentToMentor({ mentorId, studentId }).unwrap()
      alert('Mentor Assigned Successfully!')
      setIsAssignMentorModalOpen(false)
      refetchStudents()
    } catch (error) {
      alert(error.data?.message || 'Failed to assign mentor')
    }
  }

  const handleAddInternshipField = () => {
    setStudentData({
      ...studentData,
      internships: [
        ...studentData?.internships,
        { company: '', role: '', duration: '' },
      ],
    })
  }

  const handleRemoveInternshipField = (index) => {
    const updatedInternships = studentData?.internships.filter(
      (_, i) => i !== index
    )
    setStudentData({
      ...studentData,
      internships: updatedInternships,
    })
  }
console.log(studentData.user);
  const handleInternshipChange = (index, field, value) => {
    const updatedInternships = [...studentData?.internships]
    updatedInternships[index][field] = value
    setStudentData({
      ...studentData,
      internships: updatedInternships,
    })
  }

  const handleAddTimeSlotField = () => {
    setMentorData({
      ...mentorData,
      timeSlots: [
        ...mentorData.timeSlots,
        { day: '', startTime: '', endTime: '' },
      ],
    })
  }

  const handleRemoveTimeSlotField = (index) => {
    const updatedTimeSlots = mentorData.timeSlots.filter((_, i) => i !== index)
    setMentorData({
      ...mentorData,
      timeSlots: updatedTimeSlots,
    })
  }

  const handleTimeSlotChange = (index, field, value) => {
    const updatedTimeSlots = [...mentorData.timeSlots]
    updatedTimeSlots[index][field] = value
    setMentorData({
      ...mentorData,
      timeSlots: updatedTimeSlots,
    })
  }

  const handleSkillsChange = (event, isStudent = true) => {
    const selectedSkills = event.target.value
    if (isStudent) {
      setStudentData({ ...studentData, skills: selectedSkills })
    } else {
      setMentorData({ ...mentorData, skills: selectedSkills })
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Buttons for Creating Profiles */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {userInfo.role === 'student' && !currstudent && (
              <Button
                variant="contained"
                startIcon={<FaUserGraduate />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create Student Profile
              </Button>
            )}
            {userInfo.role === 'student' && currstudent && (
              <Button
                variant="contained"
                startIcon={<FaEdit />}
                onClick={() => {
                  setSelectedStudentId(student?._id)
                  setStudentData(currstudent)
                  setIsEditModalOpen(true)
                }}
                sx={{ mt: 2 }}
              >
                Edit Profile
              </Button>
            )}
            {userInfo.role === 'teacher' && (
              <Button
                variant="contained"
                startIcon={<FaChalkboardTeacher />}
                onClick={() => setIsCreateMentorModalOpen(true)}
              >
                Create Mentorship Account
              </Button>
            )}
          </Box>
        </Grid>

        {/* Student Profile Section */}
        {userInfo.role === 'student' && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Your Profile
                </Typography>
                {isLoadingStudent ? (
                  <CircularProgress />
                ) : (
                  <>
                    <Typography variant="body1">
                      GPA: {currstudent?.academicStatus?.gpa}
                    </Typography>
                    <Typography variant="body1">
                      Completed Credits:{' '}
                      {currstudent?.academicStatus?.completedCredits}
                    </Typography>
                    <Typography variant="body1">
                      Current Semester:{' '}
                      {currstudent?.academicStatus?.currentSemester}
                    </Typography>
                    <Typography variant="body1">
                      Extracurricular:{' '}
                      {currstudent?.extracurricular?.join(', ')}
                    </Typography>
                    <Typography variant="body1">
                      Internships:
                      {currstudent?.internships.map((internship, index) => (
                        <div key={index}>
                          <Typography variant="body2">
                            {internship.company} - {internship.role} -{' '}
                            {internship.duration}
                          </Typography>
                        </div>
                      ))}
                    </Typography>
                    <Typography variant="body1">
                      Achievements: {currstudent?.achievements.join(', ')}
                    </Typography>
                    <Typography variant="body1">
                      Skills: {currstudent?.skills?.join(', ')}
                    </Typography>
                    <Typography variant="body1">
                      Future Plans: {currstudent?.futurePlans}
                    </Typography>
                    {/* Mentor Information */}
                    {currstudent?.mentor ? (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          Your Mentor
                        </Typography>
                        <Typography variant="body1">
                          Name: {currstudent.mentor.user?.name}
                        </Typography>
                        <Typography variant="body1">
                          Expertise: {currstudent.mentor.expertise.join(', ')}
                        </Typography>
                        <Typography variant="body1">
                          Bio: {currstudent.mentor.bio}
                        </Typography>
                        <Typography variant="body1">
                          Skills: {currstudent.mentor.skills?.join(', ')}
                        </Typography>
                        <Typography variant="body1">
                          Availability:
                          {currstudent.mentor.timeSlots.map((slot, index) => (
                            <div key={index}>
                              <Typography variant="body2">
                                {slot.day}: {slot.startTime} - {slot.endTime}
                              </Typography>
                            </div>
                          ))}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body1" color="textSecondary">
                        No mentor assigned yet.
                      </Typography>
                    )}

                    {/* Edit Profile Button */}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Admin Section - All Students */}
        {userInfo.role === 'admin' && (
          <Grid item xs={12}>
            <Typography variant="h4" gutterBottom>
              All Students
            </Typography>
            {isLoadingStudents ? (
              <CircularProgress />
            ) : (
              <Grid container spacing={3}>
                {students?.map((student) => (
                  <Grid item xs={12} sm={6} md={4} key={student._id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">
                          {student.user?.name}
                        </Typography>
                        <Typography variant="body2">
                          GPA: {student?.academicStatus?.gpa}
                        </Typography>
                        <Typography variant="body2">
                          Mentor: {student.mentor?.user?.name || 'Not Assigned'}
                        </Typography>
                        <Typography variant="body2">
                          Skills: {student?.skills?.join(', ')}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <Button
                            variant="contained"
                            startIcon={<FaEdit />}
                            onClick={() => {
                              setSelectedStudentId(student._id)
                              setStudentData(student)
                              setIsEditModalOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<FaTrash />}
                            onClick={() => handleDeleteStudent(student._id)}
                          >
                            Delete
                          </Button>
                          <Button
                            variant="contained"
                            onClick={() => {
                              setSelectedStudentId(student._id)
                              handleSuggestList(student)
                              setIsAssignMentorModalOpen(true)
                            }}
                          >
                            Assign Mentor
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        )}

        {/* Mentor Section - Students Mentored */}
        {userInfo.role === 'teacher' && (
          <Grid item xs={12}>
            <Typography variant="h4" gutterBottom>
              Students You Are Mentoring
            </Typography>
            {isLoadingMentoredStudents ? (
              <CircularProgress />
            ) : studentsMentoring?.length > 0 ? (
              <Grid container spacing={3}>
                {studentsMentoring.map((student) => (
                  <Grid item xs={12} sm={6} md={4} key={student._id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">
                          {student.user?.name}
                        </Typography>
                        <Typography variant="body2">
                          GPA: {student?.academicStatus?.gpa}
                        </Typography>
                        <Typography variant="body2">
                          Current Semester:{' '}
                          {student?.academicStatus?.currentSemester}
                        </Typography>
                        <Typography variant="body2">
                          Skills: {student?.skills?.join(', ')}
                        </Typography>
                        <IconButton
  onClick={() => {
    setSelectedStudentId(student._id); // Set the selected student ID
    setIsCallModalOpen(true); // Open the modal
  }}
>
  <VideoCall />
</IconButton>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body1">No students assigned yet.</Typography>
            )}
          </Grid>
        )}
      </Grid>

      {/* Modals (Create/Edit Student, Create Mentor, Assign Mentor) */}
      {/* Create Student Profile Dialog */}
      <Dialog
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create Student Profile</DialogTitle>
        <DialogContent>
          <TextField
            label="GPA"
            fullWidth
            margin="dense"
            type="number"
            value={studentData?.academicStatus?.gpa}
            onChange={(e) =>
              setStudentData({
                ...studentData,
                academicStatus: {
                  ...studentData?.academicStatus,
                  gpa: e.target.value,
                },
              })
            }
          />
          <TextField
            label="Completed Credits"
            fullWidth
            margin="dense"
            type="number"
            value={studentData?.academicStatus?.completedCredits}
            onChange={(e) =>
              setStudentData({
                ...studentData,
                academicStatus: {
                  ...studentData?.academicStatus,
                  completedCredits: e.target.value,
                },
              })
            }
          />
          <TextField
            label="Current Semester"
            fullWidth
            margin="dense"
            type="number"
            value={studentData?.academicStatus?.currentSemester}
            onChange={(e) =>
              setStudentData({
                ...studentData,
                academicStatus: {
                  ...studentData?.academicStatus,
                  currentSemester: e.target.value,
                },
              })
            }
          />
          <TextField
            label="Extracurricular Activities (comma-separated)"
            fullWidth
            margin="dense"
            value={studentData?.extracurricular?.join(', ')}
            onChange={(e) =>
              setStudentData({
                ...studentData,
                extracurricular: e.target.value.split(', '),
              })
            }
          />
          {/* Dynamic Internship Fields */}
          {studentData?.internships.map((internship, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <TextField
                label="Company"
                fullWidth
                margin="dense"
                value={internship.company}
                onChange={(e) =>
                  handleInternshipChange(index, 'company', e.target.value)
                }
              />
              <TextField
                label="Role"
                fullWidth
                margin="dense"
                value={internship.role}
                onChange={(e) =>
                  handleInternshipChange(index, 'role', e.target.value)
                }
              />
              <TextField
                label="Duration"
                fullWidth
                margin="dense"
                value={internship.duration}
                onChange={(e) =>
                  handleInternshipChange(index, 'duration', e.target.value)
                }
              />
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleRemoveInternshipField(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddInternshipField}
          >
            Add Internship
          </Button>
          <TextField
            label="Achievements (comma-separated)"
            fullWidth
            margin="dense"
            value={studentData?.achievements.join(', ')}
            onChange={(e) =>
              setStudentData({
                ...studentData,
                achievements: e.target.value.split(', '),
              })
            }
          />
          {/* Skills Dropdown */}
          <FormControl fullWidth margin="dense">
            <InputLabel>Skills</InputLabel>
            <Select
              multiple
              value={studentData?.skills}
              onChange={(e) => handleSkillsChange(e, true)}
              renderValue={(selected) => selected.join(', ')}
            >
              {skillsList.map((skill) => (
                <MenuItem key={skill} value={skill}>
                  {skill}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Future Plans"
            fullWidth
            margin="dense"
            value={studentData?.futurePlans}
            onChange={(e) =>
              setStudentData({ ...studentData, futurePlans: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateStudent}
            variant="contained"
            color="primary"
            disabled={isCreatingStudent}
          >
            {isCreatingStudent ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Student Profile Dialog */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Student Profile</DialogTitle>
        <DialogContent>
          <TextField
            label="GPA"
            fullWidth
            margin="dense"
            type="number"
            value={studentData?.academicStatus?.gpa}
            onChange={(e) =>
              setStudentData({
                ...studentData,
                academicStatus: {
                  ...studentData?.academicStatus,
                  gpa: e.target.value,
                },
              })
            }
          />
          <TextField
            label="Completed Credits"
            fullWidth
            margin="dense"
            type="number"
            value={studentData?.academicStatus?.completedCredits}
            onChange={(e) =>
              setStudentData({
                ...studentData,
                academicStatus: {
                  ...studentData?.academicStatus,
                  completedCredits: e.target.value,
                },
              })
            }
          />
          <TextField
            label="Current Semester"
            fullWidth
            margin="dense"
            type="number"
            value={studentData?.academicStatus?.currentSemester}
            onChange={(e) =>
              setStudentData({
                ...studentData,
                academicStatus: {
                  ...studentData?.academicStatus,
                  currentSemester: e.target.value,
                },
              })
            }
          />
          <TextField
            label="Extracurricular Activities (comma-separated)"
            fullWidth
            margin="dense"
            value={studentData?.extracurricular?.join(', ')}
            onChange={(e) =>
              setStudentData({
                ...studentData,
                extracurricular: e.target.value.split(', '),
              })
            }
          />
          {/* Dynamic Internship Fields */}
          {studentData?.internships.map((internship, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <TextField
                label="Company"
                fullWidth
                margin="dense"
                value={internship.company}
                onChange={(e) =>
                  handleInternshipChange(index, 'company', e.target.value)
                }
              />
              <TextField
                label="Role"
                fullWidth
                margin="dense"
                value={internship.role}
                onChange={(e) =>
                  handleInternshipChange(index, 'role', e.target.value)
                }
              />
              <TextField
                label="Duration"
                fullWidth
                margin="dense"
                value={internship.duration}
                onChange={(e) =>
                  handleInternshipChange(index, 'duration', e.target.value)
                }
              />
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleRemoveInternshipField(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddInternshipField}
          >
            Add Internship
          </Button>
          <TextField
            label="Achievements (comma-separated)"
            fullWidth
            margin="dense"
            value={studentData?.achievements.join(', ')}
            onChange={(e) =>
              setStudentData({
                ...studentData,
                achievements: e.target.value.split(', '),
              })
            }
          />
          {/* Skills Dropdown */}
          <FormControl fullWidth margin="dense">
            <InputLabel>Skills</InputLabel>
            <Select
              multiple
              value={studentData?.skills}
              onChange={(e) => handleSkillsChange(e, true)}
              renderValue={(selected) => selected.join(', ')}
            >
              {skillsList.map((skill) => (
                <MenuItem key={skill} value={skill}>
                  {skill}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Future Plans"
            fullWidth
            margin="dense"
            value={studentData?.futurePlans}
            onChange={(e) =>
              setStudentData({ ...studentData, futurePlans: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateStudent}
            variant="contained"
            color="primary"
            disabled={isUpdatingStudent}
          >
            {isUpdatingStudent ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Mentorship Account Dialog */}
      <Dialog
        open={isCreateMentorModalOpen}
        onClose={() => setIsCreateMentorModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create Mentorship Account</DialogTitle>
        <DialogContent>
          <TextField
            label="Expertise (comma-separated)"
            fullWidth
            margin="dense"
            value={mentorData.expertise.join(', ')}
            onChange={(e) =>
              setMentorData({
                ...mentorData,
                expertise: e.target.value.split(', '),
              })
            }
          />
          {/* Skills Dropdown */}
          <FormControl fullWidth margin="dense">
            <InputLabel>Skills</InputLabel>
            <Select
              multiple
              value={mentorData.skills}
              onChange={(e) => handleSkillsChange(e, false)}
              renderValue={(selected) => selected.join(', ')}
            >
              {skillsList.map((skill) => (
                <MenuItem key={skill} value={skill}>
                  {skill}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Bio"
            fullWidth
            margin="dense"
            multiline
            rows={4}
            value={mentorData.bio}
            onChange={(e) =>
              setMentorData({ ...mentorData, bio: e.target.value })
            }
          />
          {/* Dynamic Time Slots Fields */}
          {mentorData.timeSlots.map((timeSlot, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Day</InputLabel>
                <Select
                  value={timeSlot.day}
                  onChange={(e) =>
                    handleTimeSlotChange(index, 'day', e.target.value)
                  }
                >
                  {daysOfWeek.map((day) => (
                    <MenuItem key={day} value={day}>
                      {day}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Start Time"
                fullWidth
                margin="dense"
                type="time"
                value={timeSlot.startTime}
                onChange={(e) =>
                  handleTimeSlotChange(index, 'startTime', e.target.value)
                }
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                label="End Time"
                fullWidth
                margin="dense"
                type="time"
                value={timeSlot.endTime}
                onChange={(e) =>
                  handleTimeSlotChange(index, 'endTime', e.target.value)
                }
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleRemoveTimeSlotField(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddTimeSlotField}
          >
            Add Time Slot
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateMentorModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateMentor}
            variant="contained"
            color="primary"
            disabled={isCreatingMentor}
          >
            {isCreatingMentor ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Mentor Modal */}
      <Dialog
        open={isAssignMentorModalOpen}
        onClose={() => setIsAssignMentorModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Assign Mentor</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Suggested Mentors
          </Typography>
          <List>
            {suggestionList.map((mentor) => (
              <ListItem
                button
                key={mentor.name}
                onClick={() => {
                  setSelectedMentorId(mentor._id)
                  handleAssignMentor(selectedStudentId, mentor._id)
                }}
              >
                <ListItemText
                  primary={mentor.name}
                  secondary={`Matching Score: ${mentor.score}`}
                />
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            All Mentors
          </Typography>
          <List>
            {mentors?.map((mentor) => (
              <ListItem
                button
                key={mentor._id}
                onClick={() => {
                  setSelectedMentorId(mentor._id)
                  handleAssignMentor(selectedStudentId, mentor._id)
                }}
              >
                <ListItemText
                  primary={mentor.user?.name}
                  secondary={mentor.expertise.join(', ')}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAssignMentorModalOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <VideoMettingMentor
        open={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        mentorId={userInfo?._id}
        studentId={selectedStudentId}
      />
    </Box>
  )
}

export default MentorMenteePage
