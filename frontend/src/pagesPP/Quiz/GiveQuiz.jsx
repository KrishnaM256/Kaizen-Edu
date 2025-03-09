import React, { useState, useEffect } from "react";
import axios from "axios";
import VideoAnalysis from "../Viva/VideoAnalysis.jsx";
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  CircularProgress,
  Paper,
} from "@mui/material";
import { useNavigate, useParams } from "react-router";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useSelector } from "react-redux";

const GiveQuiz = () => {
  const [quizData, setQuizData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizEnded, setQuizEnded] = useState(false);
  const [totalMarks, setTotalMarks] = useState(0);
  const [endVideo, setEndVideo] = useState(false);
  const [report, setReport] = useState(null);
  const [reportReady, setReportReady] = useState(false);
  const { quizId } = useParams();
  const navigate=useNavigate();
  const { userInfo } = useSelector((state) => state.user); // Access user role from Redux
  //  console.log(userInfo);
  // Fetch quiz data
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:4001/quiz/getquizbyquizid/${quizId}`
        );
        setQuizData(response.data);
        setTimeRemaining(response.data.duration * 60 * 1000); // Convert duration to milliseconds
      } catch (error) {
        console.error("Error fetching quiz data:", error);
      }
    };

    fetchQuizData();
  }, [quizId]);

  // Timer for auto-submission
  useEffect(() => {
    if (timeRemaining > 0 && !quizEnded) {
      const timer = setTimeout(() => {
        setTimeRemaining((prev) => prev - 1000);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining <= 0 && !quizEnded) {
      handleSubmit(); // Auto-submit when time runs out
    }
  }, [timeRemaining, quizEnded]);

  // Handle answer selection
  const handleAnswerChange = (questionId, answer) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Calculate marks
  const calculateMarks = () => {
    let marks = 0;
    quizData?.questionAnswerSet?.forEach((question) => {
      if (selectedAnswers[question._id] === question.correctoption) {
        marks += quizData.markperquestion; // Add marks for each correct answer
      }
    });

    // Calculate percentage
    const totalPossibleMarks = quizData.questionAnswerSet.length * quizData.markperquestion;
    const percentage = (marks / totalPossibleMarks) * 100;
    return percentage.toFixed(0); // Return percentage with 2 decimal places
  };

  // Handle quiz submission
  const handleSubmit = async () => {
    if (!quizData || quizEnded) return; // Ensure quizData is available

    setTotalMarks(calculateMarks());
    setQuizEnded(true);
    setEndVideo(true); // Stop video analysis

    console.log("Quiz submitted. Waiting for report...");
  };

  // Submit quiz results after video analysis report
  useEffect(() => {
    if (reportReady && quizEnded && quizData) {
      const submissionData = {
        quizid: quizData._id,
        studentId: userInfo._id, // Replace with actual student ID
        studentName: userInfo.name, // Replace with actual student name
        totalQuestions: quizData.questionAnswerSet.length,
        questionAnswerSet: quizData.questionAnswerSet.map((question) => ({
          questionText: question.questionText,
          options: question.options,
          correctoption: question.correctoption,
          studentAnswer: selectedAnswers[question._id] || "Not answered",
        })),
        overallMark: totalMarks,
        proctoredFeedback: report?.allDetectedObjects,
      };

      axios
        .post("http://localhost:4001/quizresult/addquizresult", submissionData)
        .then((response) => {
          console.log("Quiz result submitted successfully:", response.data);
        })
        .catch((error) => {
          console.error("Error submitting quiz result:", error);
        });
        navigate('/main');
    }
  }, [reportReady, quizEnded, quizData]);

  if (!quizData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box display="flex" height="100vh" p={2} gap={2}>
      {/* Left Side: Video Analysis */}
      <Box flex={1} bgcolor="#f5f5f5" borderRadius={2} p={2}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
          Video Analysis
        </Typography>
        <VideoAnalysis
          endVideo={endVideo}
          onAnalysisComplete={(report) => {
            setReport(report);
            setReportReady(true);
          }}
        />

        {/* Timer with Icon */}
        <Box mt={2} display="flex" alignItems="center" justifyContent="center">
          <AccessTimeIcon sx={{ fontSize: "2rem", color: "primary.main", mr: 1 }} />
          <Typography variant="h5" color="primary" sx={{ fontWeight: "bold" }}>
            {Math.floor(timeRemaining / 60000)}:
            {Math.floor((timeRemaining % 60000) / 1000)
              .toString()
              .padStart(2, "0")}
          </Typography>
        </Box>
      </Box>

      {/* Right Side: Quiz Questions or Results */}
      <Box flex={2} bgcolor="#ffffff" borderRadius={2} p={3} boxShadow={2} sx={{ overflowY: "auto" }}>
        {!quizEnded ? (
          <>
            {/* Quiz Name */}
            <Box bgcolor="#e3f2fd" p={2} borderRadius={2} mb={3} textAlign="center">
              <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
                {quizData.quizname}
              </Typography>
            </Box>

            {/* Quiz Questions */}
            {quizData.questionAnswerSet.map((question, index) => (
              <Paper key={question._id} elevation={3} sx={{ mb: 3, p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: "500" }}>
                  Question {index + 1}: {question.questionText}
                </Typography>
                <RadioGroup
                  value={selectedAnswers[question._id] || ""}
                  onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                >
                  {question.options.map((option, optionIndex) => (
                    <FormControlLabel
                      key={optionIndex}
                      value={option}
                      control={<Radio color="primary" />}
                      label={<Typography>{option}</Typography>}
                    />
                  ))}
                </RadioGroup>
              </Paper>
            ))}

            {/* Submit Button */}
            <Box display="flex" justifyContent="flex-end" mt={4}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                sx={{ fontWeight: "bold" }}
              >
                Submit Quiz
              </Button>
            </Box>
          </>
        ) : (
          // Quiz Results
          <Box mt={4}>
            <Typography variant="h6" color="secondary" align="center" sx={{ fontWeight: "bold" }}>
              The quiz has ended. Thank you for participating!
            </Typography>
            <Typography variant="h5" align="center" mt={2} sx={{ fontWeight: "bold" }}>
              Your Score: {totalMarks} / {quizData.questionAnswerSet.length}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default GiveQuiz;
