import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  TextField,
  Button,
  Box,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from "@mui/material";
import { VideoCall, Shuffle, Person, Group, MeetingRoom } from "@mui/icons-material";
import axios from "axios";
import { useSelector } from "react-redux";

const API = import.meta.env.VITE_BACKEND_URL;

function VideoMeeting({ classId,role:role2 }) {
  const [roomId, setRoomId] = useState("");
  const [meetings, setMeetings] = useState([]);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();
console.log(role2)
  // Access userInfo from Redux
  const { userInfo } = useSelector((state) => {
    console.log("Redux State - userInfo:", state.user.userInfo);
    return state.user;
  });

  // Update role state when userInfo changes
  useEffect(() => {
    console.log("User Info in useEffect:", userInfo);
    if (userInfo?.role) {
      setRole(userInfo.role);
      console.log("Role updated:", userInfo.role);
    } else {
      console.log("Role is undefined in userInfo");
    }
  }, [userInfo]);

  // Fetch meeting links for the class
  const getMeetLinks = async () => {
    try {
      const response = await axios.get(`${API}/meetlink/getmeetlink/${classId}`);
      setMeetings(response.data); // Assuming response.data is an array of meeting objects
    } catch (error) {
      console.error("Error fetching meeting links:", error);
    }
  };

  useEffect(() => {
    if (classId && role) { // Ensure role is set before fetching
      getMeetLinks();
    }
  }, [classId, role]);
  

  // Generate a random room ID
  const handleRoomIdGenerate = () => {
    const randomId = Math.random().toString(36).substring(2, 9);
    const timestamp = Date.now().toString().substring(-4);
    setRoomId(randomId + timestamp);
  };

  // Handle one-on-one call
  const handleOneAndOneCall = () => {
    if (!roomId) {
      alert("Please Generate Room ID First");
      return;
    }
    navigate(`/room/${classId}/${roomId}?type=one-on-one`);
  };

  // Handle group call
  const handleGroupCall = () => {
    if (!roomId) {
      alert("Please Generate Room ID First");
      return;
    }
    navigate(`/room/${classId}/${roomId}?type=group-call`);
  };

  // Handle joining a meeting link
  const handleJoinMeeting = (url) => {
    window.open(url, "_blank"); // Open the meeting link in a new tab
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
          position: "relative",
        }}
      >
        {/* Video Meet Section (Left Top Corner) */}
        <Box
          sx={{
            position: "absolute",
            top: 1,
            left: 16,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <VideoCall sx={{ fontSize: 70, color: "primary.main" }} />
          <Typography variant="h3" sx={{ fontWeight: "bold" }}>
            Video Meet 
          </Typography>
        </Box>

        {/* Main Content (Centered) */}
        <Box
          sx={{
            textAlign: "center",
            maxWidth: 400,
            width: "100%",
          }}
        >
          {role === 'teacher' && (
            <>
              <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
                Start a Video Meeting
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 4, color: "text.secondary" }}>
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
                    backgroundColor: "background.paper",
                    borderRadius: 1,
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<Shuffle />}
                  onClick={handleRoomIdGenerate}
                  sx={{
                    py: 1,
                    fontWeight: "bold",
                    backgroundColor: "#3f51b5",
                    "&:hover": {
                      backgroundColor: "#303f9f",
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
                    fontWeight: "bold",
                    backgroundColor: "#4caf50",
                    "&:hover": {
                      backgroundColor: "#388e3c",
                    },
                    "&:disabled": {
                      backgroundColor: "#bdbdbd",
                    },
                  }}
                >
                  One-on-One Call
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Group />}
                  onClick={handleGroupCall}
                  disabled={!roomId}
                  sx={{
                    py: 1,
                    fontWeight: "bold",
                    backgroundColor: "#ff9800",
                    "&:hover": {
                      backgroundColor: "#f57c00",
                    },
                    "&:disabled": {
                      backgroundColor: "#bdbdbd",
                    },
                  }}
                >
                  Group Call
                </Button>
              </Stack>
            </>
          )}
          {role === "student" && (
          <>
            <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
              Available Meetings
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 4, color: "text.secondary" }}>
              Join a meeting by clicking the "Join" button.
            </Typography>

            <List>
              {meetings.map((meeting) => (
                <ListItem key={meeting?._id} sx={{ borderBottom: "1px solid #e0e0e0" }}>
                  {/* Left Side: Meeting Name */}
                  <ListItemText
                    primary={
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
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
                        backgroundColor: "#3f51b5",
                        "&:hover": {
                          backgroundColor: "#303f9f",
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
    </>
  );
}

export default VideoMeeting;