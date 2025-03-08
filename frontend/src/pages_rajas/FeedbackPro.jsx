import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, useTheme, CircularProgress, Button } from "@mui/material";
import { useLocation } from "react-router-dom";
import { useGetSubmissionResultQuery } from "../redux/api/assignmentSlice";

const FeedbackPro = () => {
  const location = useLocation();
  const { studentId, assignmentId } = location.state || {}; // Access state here
  const theme = useTheme();
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state for initial data fetch
  const [feedbackLoading, setFeedbackLoading] = useState(false); // Loading state for feedback generation
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0); // Track retry attempts

  // Fetch submission data using Redux Toolkit Query
  const {
    data: resultData,
    error: resultError,
    isLoading: resultLoading,
  } = useGetSubmissionResultQuery({ assignmentId, studentId });

  console.log("Student ID:", studentId); // Debugging log
  console.log("Assignment ID:", assignmentId); // Debugging log
  console.log("Result Data:", resultData); // Debugging log

  const fetchAndParseResults = async (resultsString) => {
    try {
      console.log("Sending results string to Flask backend for parsing...");
      const parseResponse = await fetch('http://127.0.0.1:5000/parsejson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ input_string: resultsString }),
      });

      if (!parseResponse.ok) {
        const errorText = await parseResponse.text();
        throw new Error(`Failed to parse results: ${errorText}`);
      }

      const parsedData = await parseResponse.json();
      console.log("Parsed data:", parsedData);

      // Extract the `results` array from the parsed data
      const resultsArray = parsedData.results;

      // Set loading state for feedback generation
      setFeedbackLoading(true);

      // Send the parsed results array to the `/generate-feedback` endpoint
      const feedbackResponse = await fetch('http://localhost:5000/generate-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ results: resultsArray }),
      });

      if (!feedbackResponse.ok) {
        const errorText = await feedbackResponse.text();
        throw new Error(`Failed to fetch feedback: ${errorText}`);
      }

      // Parse the feedback data from the response
      const feedbackData = await feedbackResponse.json();
      setFeedbackData(feedbackData);
    } catch (err) {
      console.error("Error in fetchAndParseResults:", err);
      setError(err.message);
    } finally {
      setLoading(false); // Initial loading complete
      setFeedbackLoading(false); // Feedback generation loading complete
    }
  };

  useEffect(() => {
    if (resultData) {
      try {
        const resultsString = resultData.result?.results;
        console.log("Results string:", resultsString);

        if (!resultsString) {
          throw new Error('No results data found.');
        }

        fetchAndParseResults(resultsString);
      } catch (err) {
        setError('Failed to parse results data.');
        setLoading(false);
        setFeedbackLoading(false);
      }
    } else if (resultError) {
      setError(resultError.message);
      setLoading(false);
      setFeedbackLoading(false);
    }
  }, [resultData, resultError, retryCount]); // Retry when retryCount changes

  const handleRetry = () => {
    setError(null); // Clear previous errors
    setLoading(true); // Show loading indicator
    setRetryCount((prev) => prev + 1); // Increment retry count to trigger useEffect
  };

  if (loading || resultLoading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Fetching results...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h5" color="error" sx={{ mb: 2 }}>
          Error: {error}
        </Typography>
        <Button variant="contained" color="primary" onClick={handleRetry}>
          Retry
        </Button>
      </Box>
    );
  }

  if (feedbackLoading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Generating feedback. This may take a while...
        </Typography>
      </Box>
    );
  }

  if (!feedbackData.length) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h5" color="textSecondary">
          No feedback data available.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, background: theme.palette.background.default }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        Feedback
      </Typography>

      {feedbackData.map((feedback, index) => (
        <Paper key={index} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          {feedback.error ? (
            <Typography variant="body1" color="error">
              <strong>Error:</strong> {feedback.error}
            </Typography>
          ) : (
            <>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                Question: {feedback.question}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Your Answer:</strong> {feedback.context}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Simplified Answer:</strong> {feedback.answer}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Evaluation:</strong> {feedback.evaluation}
              </Typography>
              <Typography variant="body1">
                <strong>Feedback:</strong> {feedback.feedback}
              </Typography>
            </>
          )}
        </Paper>
      ))}

      {feedbackData.some((feedback) => feedback.error) && (
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Button variant="contained" color="primary" onClick={handleRetry}>
            Retry Failed Requests
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default FeedbackPro;