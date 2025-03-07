import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
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
} from '@mui/material';

const API = import.meta.env.VITE_BACKEND_URL;

const Profile = () => {
  const [classes, setClasses] = useState([]); // State to store classes
  const [loading, setLoading] = useState(true); // State to track loading status
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null); // State to handle errors
  const { userInfo } = useSelector((state) => state.user);
  const [vivaResults, setVivaResults] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [assignmentResults, setAssignmentResults] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(''); // State to store selected class ID

  // Fetch Viva Results
  const fetchVivaResults = async () => {
    try {
      const response = await axios.get(`${API}/vivaresult/getvivaresultbystudentid/${userId}`);
      setVivaResults(response.data);
      console.log("Viva Results:", response.data);
    } catch (error) {
      console.error('Error fetching viva results:', error);
      setError('Failed to fetch viva results.');
    }
  };

  // Fetch Quiz Results
  const fetchQuizResults = async () => {
    try {
      const response = await axios.get(`${API}/quizresult/quizresultbystudentid/${userId}`);
      setQuizResults(response.data);
      console.log("Quiz Results:", response.data);
    } catch (error) {
      console.error('Error fetching quiz results:', error);
      setError('Failed to fetch quiz results.');
    }
  };

  // Fetch Assignment Results
  const fetchAssignmentResults = async () => {
    try {
      const response = await axios.get(`${API}/assignment/${userId}`);
      setAssignmentResults(response?.data);
    } catch (error) {
      console.error('Error fetching assignment results:', error);
      setError('Failed to fetch assignment results.');
    }
  };

  // Fetch all results when the component mounts
  useEffect(() => {
    const fetchAllResults = async () => {
      setLoading(true);
      await fetchVivaResults();
      await fetchQuizResults();
      await fetchAssignmentResults();
      setLoading(false);
    };

    if (userId) {
      fetchAllResults();
    }
  }, [userId]);

  // Update role and userid state when userInfo changes
  useEffect(() => {
    if (userInfo) {
      setRole(userInfo.role);
      setUserId(userInfo._id);
    }
  }, [userInfo]);

  // Fetch classes when userid changes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(`${API}/class/getAllClasses/${userId}`);
        setClasses(response.data.classes);
        console.log(response.data.classes);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching classes:', error);
        setError('Failed to fetch classes. Please try again.');
        setLoading(false);
      }
    };

    if (userId) {
      fetchClasses();
    }
  }, [userId]);

  // Filter results based on selected class ID
  const filteredVivaResults = selectedClassId
    ? vivaResults.filter((result) => result.vivaId.classid === selectedClassId)
    : vivaResults;

  const filteredQuizResults = selectedClassId
    ? quizResults.filter((result) => result.quizid.classid === selectedClassId)
    : quizResults;

  const filteredAssignmentResults = selectedClassId
    ? assignmentResults.filter((result) => result.classid === selectedClassId)
    : assignmentResults;

  // Function to get assignment results for a specific student
  const getStudentAssignmentResults = (assignment) => {
    return assignment.submissions.filter((submission) => submission.studentId === userId);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={4} sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Profile Section */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, textAlign: 'center', backgroundColor: '#fff' }}>
        <Avatar
          src={userInfo.profile_pic}
          alt={userInfo.name}
          sx={{ width: 100, height: 100, mb: 2, margin: 'auto' }}
        />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          {userInfo.name}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          {userInfo.email}
        </Typography>
      </Paper>

      {/* Class Filter Dropdown */}
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

      {/* Results Section */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Results
      </Typography>
      <Grid container spacing={4}>
        {/* Viva Results */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Viva Results
              </Typography>
              {filteredVivaResults.length > 0 ? (
                <List>
                  {filteredVivaResults.map((result) => (
                    <React.Fragment key={result._id}>
                      <ListItem>
                        <ListItemText primary={result.vivaId.vivaname} />
                        <ListItemSecondaryAction>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {result.overallMark}
                          </Typography>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body1">No viva results found.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quiz Results */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Quiz Results
              </Typography>
              {filteredQuizResults.length > 0 ? (
                <List>
                  {filteredQuizResults.map((result) => (
                    <React.Fragment key={result._id}>
                      <ListItem>
                        <ListItemText primary={result.quizid.quizname} />
                        <ListItemSecondaryAction>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {result.overallMark}
                          </Typography>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body1">No quiz results found.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Assignment Results */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Assignment Results
              </Typography>
              {filteredAssignmentResults.length > 0 ? (
                <List>
                  {filteredAssignmentResults.map((assignment) => {
                    const studentResults = getStudentAssignmentResults(assignment);
                    return studentResults.map((result) => (
                      <React.Fragment key={result._id}>
                        <ListItem>
                          <ListItemText primary={assignment.title} />
                          <ListItemSecondaryAction>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {result.result.total_score}
                            </Typography>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ));
                  })}
                </List>
              ) : (
                <Typography variant="body1">No assignment results found.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;