import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
} from "@mui/material";
import { MeetingRoom } from "@mui/icons-material";
import axios from "axios";
import { useSelector } from "react-redux";

const API = import.meta.env.VITE_BACKEND_URL;

function Videomenting() {
  const [meetings, setMeetings] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const navigate = useNavigate();

  // Access userInfo from Redux
  const { userInfo } = useSelector((state) => {
    console.log("Redux State - userInfo:", state.user.userInfo);
    return state.user;
  });

  // Update studentId state when userInfo changes
  useEffect(() => {
    console.log("User Info in useEffect:", userInfo);
    if (userInfo?._id) {
      setStudentId(userInfo._id);
      console.log("Student ID updated:", userInfo._id);
    } else {
      console.log("Student ID is undefined in userInfo");
    }
  }, [userInfo]);

  // Fetch meeting links for the student
  const getMeetLinks = async () => {
    try {
      const response = await axios.get(`${API}/mentormeet/getmentormeet/${studentId}`);
      console.log("response.data", response.data);
      setMeetings(response.data); // Assuming response.data is an array of meeting objects
    } catch (error) {
      console.error("Error fetching meeting links:", error);
    }
  };

  useEffect(() => {
    if (studentId) {
      getMeetLinks();
    }
  }, [studentId]);

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
        </Box>
      </Box>
    </>
  );
}

export default Videomenting;