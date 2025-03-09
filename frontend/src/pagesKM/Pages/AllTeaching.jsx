import {
  Button,
  Dialog,
  Card,
  CardContent,
  Typography,
  TextField,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import React, { useState } from 'react'
import { FaPlus } from 'react-icons/fa'
import CreateClass from './CreateClass'
import './AllTeaching.css'
import {
  useGetAllClassesQuery,
  useJoinClassMutation,
  useGetAllPublicClassesQuery,
} from '../../redux/api/classApiSlice'
import { useSelector } from 'react-redux'

const AllTeaching = ({ navigate }) => {
  const { userInfo } = useSelector((state) => state.user)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [classCode, setClassCode] = useState('')

  // Fetch all classes for the logged-in user (teacher or student)
  const {
    data: userClasses,
    isLoading: isUserClassesLoading,
    error: userClassesError,
    refetch: refetchUserClasses,
  } = useGetAllClassesQuery(userInfo.role != 'admin' && userInfo._id)

  // Fetch all public classes that the student has not joined
  const {
    data: publicClassesData,
    isLoading: isPublicClassesLoading,
    error: publicClassesError,
    refetch: refetchPublicClasses,
  } = useGetAllPublicClassesQuery({ userId: userInfo._id, role: userInfo.role })

  const [joinClass, { isLoading: isJoining }] = useJoinClassMutation()

  // Handle joining a class (public or private)
  const handleJoinClass = async (classId = null) => {
    if (!classId && !classCode) {
      alert('Please enter a class code.')
      return
    }

    try {
      const response = await joinClass({
        classCode,
        studentId: userInfo._id,
        classId, // For public classes
      }).unwrap()
      alert(response.message) // Show success message
      setIsJoinModalOpen(false) // Close the join modal
      refetchUserClasses() // Refresh the user's class list
      refetchPublicClasses() // Refresh the public classes list
    } catch (error) {
      alert(error.data?.message || 'Failed to join class.') // Show error message
    }
    setClassCode('')
  }

  // Separate private classes from the user's classes
  const privateClasses = userClasses?.classes?.filter(
    (classItem) => !classItem.isPublic
  )

  // Loading and error states
  if (isUserClassesLoading || isPublicClassesLoading)
    return <p>Loading classes...</p>
  if (userClassesError || publicClassesError)
    return <p>Error fetching classes</p>

  return (
    <section>
      <div className="buttonContainer">
        {userInfo.role === 'teacher' && (
          <Button
            variant="contained"
            endIcon={<FaPlus />}
            onClick={() => setIsModalOpen(true)}
          >
            Create Class
          </Button>
        )}
        {userInfo.role === 'student' && (
          <Button
            variant="contained"
            endIcon={<FaPlus />}
            onClick={() => setIsJoinModalOpen(true)}
          >
            Join Private Class
          </Button>
        )}
      </div>

      {/* Create Class Dialog */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <CreateClass
          refetch={refetchUserClasses}
          onClose={() => setIsModalOpen(false)}
        />
      </Dialog>

      {/* Join Private Class Dialog */}
      <Dialog
        open={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Join Private Class</DialogTitle>
        <DialogContent>
          <TextField
            name="classCode"
            label="Enter Class Code"
            fullWidth
            margin="dense"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsJoinModalOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleJoinClass()}
            disabled={isJoining}
            variant="contained"
            color="primary"
          >
            {isJoining ? 'Joining...' : 'Join'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Public Classes Section */}
      <h2 className="mx-6 font-normal text-xl">Public Classes</h2>
      <div className="classList">
        {publicClassesData?.classes?.length > 0 ? (
          publicClassesData.classes.map((classItem) => (
            <div key={classItem._id} className="classCardWrapper">
              <Card className="classCard">
                <div className="classHeader">{classItem.name}</div>
                <CardContent className="classContent">
                  <Typography className="classCode">
                    Class Code: {classItem.classCode}
                  </Typography>
                  <Typography className="teacherInfo">
                    Teacher: {classItem.teacher.name} ({classItem.teacher.email}
                    )
                  </Typography>
                  <Typography className="studentCount">
                    Students: {classItem.students.length}
                  </Typography>
                  {userInfo.role === 'student' && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleJoinClass(classItem._id)}
                      disabled={classItem.students.includes(userInfo._id)}
                    >
                      {classItem.students.includes(userInfo._id)
                        ? 'Joined'
                        : 'Join Class'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ))
        ) : (
          <p>No public classes available</p>
        )}
      </div>

      {/* Private Classes Section */}
      <h2 className="mx-6 font-normal text-xl">Private Classes</h2>
      <div className="classList">
        {privateClasses?.length > 0 ? (
          privateClasses.map((classItem) => (
            <div
              key={classItem._id}
              onClick={() => navigate(`/class/${classItem._id}`)}
              className="classCardWrapper"
            >
              <Card className="classCard">
                <div className="classHeader">{classItem.name}</div>
                <CardContent className="classContent">
                  <Typography className="classCode">
                    Class Code: {classItem.classCode}
                  </Typography>
                  <Typography className="teacherInfo">
                    Teacher: {classItem.teacher.name} ({classItem.teacher.email}
                    )
                  </Typography>
                  <Typography className="studentCount">
                    Students: {classItem.students.length}
                  </Typography>
                </CardContent>
              </Card>
            </div>
          ))
        ) : (
          <p>No private classes available</p>
        )}
      </div>
    </section>
  )
}

export default AllTeaching
