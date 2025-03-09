import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Close, Shuffle, Person, VideoCall, MeetingRoom } from '@mui/icons-material';

const API = 'http://127.0.0.1:5000'; // Replace with your actual API endpoint

const VideoMettingMentor = ({ open, onClose, mentorId, studentId }) => {
  const [roomId, setRoomId] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();
console.log(studentId);
  // Access userInfo from Redux
  const { userInfo } = useSelector((state) => state.user);

  // Update role state when userInfo changes
  useEffect(() => {
    if (userInfo?.role && userInfo._id) {
      setRole(userInfo.role);
    }
  }, [userInfo]);

  // Fetch meeting links for the class
  const getMeetLinks = async () => {
    try {
      const response = await axios.get(`${API}/mentormeet/getmentormeet/${studentId}`);
      setMeetings(response.data); // Assuming response.data is an array of meeting objects
    } catch (error) {
      console.error('Error fetching meeting links:', error);
    }
  };

  useEffect(() => {
    if (  role) {
      getMeetLinks();
    }
  }, [ role]);

  // Generate a random room ID
  const handleRoomIdGenerate = () => {
    const randomId = Math.random().toString(36).substring(2, 9);
    const timestamp = Date.now().toString().substring(-4);
    setRoomId(randomId + timestamp);
  };

  // Handle one-on-one call
  const handleOneAndOneCall = () => {
    if (!roomId) {
      alert('Please Generate Room ID First');
      return;
    }
    navigate(`/room/${mentorId}/${studentId}?type=one-on-one`);
  };

  // Handle joining a meeting link
  const handleJoinMeeting = (url) => {
    window.open(url, '_blank'); // Open the meeting link in a new tab
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h6">Start a One-on-One Call</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80vh',
            position: 'relative',
          }}
        >
          {/* Video Meet Section (Left Top Corner) */}
          <Box
            sx={{
              position: 'absolute',
              top: 1,
              left: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <VideoCall sx={{ fontSize: 70, color: 'primary.main' }} />
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              Video Meet
            </Typography>
          </Box>

          {/* Main Content (Centered) */}
          <Box
            sx={{
              textAlign: 'center',
              maxWidth: 400,
              width: '100%',
            }}
          >
            {role === 'teacher' && (
              <>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Start a Video Meeting
                </Typography>
                <Typography variant="subtitle1" sx={{ mb: 4, color: 'text.secondary' }}>
                  Start a video meeting with a randomly generated Room ID
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Generated Room ID"
                    value={roomId}
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{
                      backgroundColor: 'background.paper',
                      borderRadius: 1,
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<Shuffle />}
                    onClick={handleRoomIdGenerate}
                    sx={{
                      py: 1,
                      fontWeight: 'bold',
                      backgroundColor: '#3f51b5',
                      '&:hover': {
                        backgroundColor: '#303f9f',
                      },
                    }}
                  >
                    Generate Room ID
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Person />}
                    onClick={handleOneAndOneCall}
                    disabled={!roomId}
                    sx={{
                      py: 1,
                      fontWeight: 'bold',
                      backgroundColor: '#4caf50',
                      '&:hover': {
                        backgroundColor: '#388e3c',
                      },
                      '&:disabled': {
                        backgroundColor: '#bdbdbd',
                      },
                    }}
                  >
                    One-on-One Call
                  </Button>
                </Stack>
              </>
            )}
            {role === 'student' && (
              <>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Available Meetings
                </Typography>
                <Typography variant="subtitle1" sx={{ mb: 4, color: 'text.secondary' }}>
                  Join a meeting by clicking the "Join" button.
                </Typography>

                <List>
                  {meetings.map((meeting) => (
                    <ListItem key={meeting?._id} sx={{ borderBottom: '1px solid #e0e0e0' }}>
                      {/* Left Side: Meeting Name */}
                      <ListItemText
                        primary={
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {meeting?.name}
                          </Typography>
                        }
                      />

                      {/* Right Side: Join Button */}
                      <ListItemSecondaryAction>
                        <Button
                          variant="contained"
                          startIcon={<MeetingRoom />}
                          onClick={() => handleJoinMeeting(meeting?.url)}
                          sx={{
                            backgroundColor: '#3f51b5',
                            '&:hover': {
                              backgroundColor: '#303f9f',
                            },
                          }}
                        >
                          Join
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VideoMettingMentor;