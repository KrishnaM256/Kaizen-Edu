import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
} from '@mui/material';
import { Close, Shuffle, Person, VideoCall } from '@mui/icons-material';

const VideoMettingMentor = ({ open, onClose, mentorId, studentId }) => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  // Access userInfo from Redux
  const { userInfo } = useSelector((state) => state.user);

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
    navigate(`/mentor/${mentorId}/${studentId}?type=one-on-one`);
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