import React, { useRef, useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { Container, Typography, Button, Box } from "@mui/material";
import { ExitToApp } from "@mui/icons-material";
import axios from "axios";
const API = import.meta.env.VITE_BACKEND_URL;
function RoomMeet() {
  const { roomId } = useParams();
  const { classId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const zpRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [callType, setCallType] = useState("");

  const APP_ID = 1199460465;
  const SECRET = "841c556067da90c047308ae1ea221cdc";

  const addMeetingLink=async()=>{
    const meetinglink=window.location.href;
    try {
      await axios.post(`${API}/meetlink/addmeetlink`,{
        classId,
        name:"Your name",
        url:meetinglink,
      });
      console.log("meeting link added succesfuly");
    } catch (error) {
      console.log('failed to add meet link ');
    }
  }
  const deleteMeetingLink = async () => {
    try {
      await axios.delete(`${API}/meetlink/deletemeetlink/${classId}`);
      console.log("Meeting link deleted successfully");
    } catch (error) {
      console.error("Failed to delete meeting link:", error);
    }
  };
  // Initialize ZegoUIKit and join room on component mount
  const myMeeting = (type) => {
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      APP_ID,
      SECRET,
      roomId,
      Date.now().toString(),
      "Your Name"
    );
    console.log("Kit Token:", kitToken); // Debugging
  
    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zpRef.current = zp;
    console.log("ZegoUIKit Instance:", zp); // Debugging
  
    zp.joinRoom({
      container: videoContainerRef.current,
      sharedLinks: [
        {
          name: "Video Call Link",
          url:
            window.location.protocol +
            "//" +
            window.location.host +
            window.location.pathname +
            "?type=" + encodeURIComponent(type),
        },
      ],
      scenario: {
        mode:
          type === "one-on-one"
            ? ZegoUIKitPrebuilt.OneONoneCall
            : ZegoUIKitPrebuilt.GroupCall,
      },
      maxUsers: type === "one-on-one" ? 2 : 10,
      onJoinRoom: () => {
        console.log("Joined Room"); // Debugging
        setJoined(true);
        addMeetingLink();
      },
      onLeaveRoom: () => {
        console.log("Left Room"); // Debugging
        navigate("/main");
        deleteMeetingLink();
      },
    });
  };

  // Handle exit from the room
  const handleExit = () => {
    if (zpRef.current) {
      zpRef.current.destroy();
    }
    navigate("/main");
  };

  // On component mount, extract call type from location and initialize meeting
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const type = query.get("type");
    console.log("Call Type:", type); // Debugging
    setCallType(type);
  }, [location.search]);

  // Initialize meeting after callType state is set
  useEffect(() => {
    if (callType) {
      myMeeting(callType);
    }

    // Cleanup function for component unmount
    return () => {
      if (zpRef.current) {
        zpRef.current.destroy();
      }
    };
  }, [callType, roomId, navigate]);

  return (
    <Container
      maxWidth={false}
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f5f5f5",
        padding: 0,
      }}
    >
      {!joined && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 2,
            backgroundColor: "#ffffff",
            boxShadow: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {callType === "one-on-one"
              ? "One-on-One Video Call"
              : "Group Video Call"}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ExitToApp />}
            onClick={handleExit}
            sx={{
              backgroundColor: "#ff4444",
              "&:hover": {
                backgroundColor: "#cc0000",
              },
            }}
          >
            Exit
          </Button>
        </Box>
      )}
      <Box
        ref={videoContainerRef}
        sx={{
          flex: 1,
          backgroundColor: "#000000",
          overflow: "hidden",
        }}
      />
    </Container>
  );
}

export default  RoomMeet;