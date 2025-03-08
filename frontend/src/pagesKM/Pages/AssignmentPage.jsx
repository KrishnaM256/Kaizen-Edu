import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  IconButton,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  useTheme,
  Avatar,
  TextField,
  Collapse,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import UploadIcon from "@mui/icons-material/Upload";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DescriptionIcon from "@mui/icons-material/Description";
import { motion } from "framer-motion";
import { styled } from "@mui/system";
import { useNavigate } from "react-router-dom";
import {
  useDeleteAssignmentMutation,
  useGetAssignmentsByClassQuery,
  useUpdateAssignmentMutation,
  useUploadAssignmentMutation,
  useSubmitAnswerMutation,
  useGetSubmissionsQuery,
} from "../../redux/api/assignmentSlice";
import { BASE_URL } from "../../redux/constants";
import { useSelector } from "react-redux";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

// Custom styled components with blue theme
const StyledButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
  border: 0,
  borderRadius: 15,
  color: "white",
  padding: "10px 20px",
  boxShadow: "0 3px 5px 2px rgba(33, 150, 243, .3)",
  transition: "transform 0.2s",
  "&:hover": {
    transform: "scale(1.05)",
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: 10,
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  transition: "transform 0.2s",
  "&:hover": {
    transform: "translateY(-5px)",
  },
}));

const AssignmentPage = ({ classId }) => {
  const { userInfo } = useSelector((state) => state.user);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openSubmissionsModal, setOpenSubmissionsModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [chapterPdf, setChapterPdf] = useState(null);
  const [assignmentPdf, setAssignmentPdf] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [scores, setScores] = useState({});
  const [ai_Score, setAi_Score] = useState(0);
  const [studentAssignment, setStudentAssignment] = useState();
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [selectedFiles, setSelectedFiles] = useState({});
  const [plagiarismResults, setPlagiarismResults] = useState({});
  const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false); // New state for file upload loading
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for submit loading

  const theme = useTheme();
  const navigate = useNavigate();

  // RTK Query hooks
  const {
    data: assignments,
    isLoading,
    refetch,
  } = useGetAssignmentsByClassQuery(classId);
  console.log(assignments);
  const [uploadAssignment, { isLoading: isUploading }] =
    useUploadAssignmentMutation();
  const [deleteAssignment, { isLoading: isDeleting }] =
    useDeleteAssignmentMutation();
  const [updateAssignment, { isLoading: isUpdating }] =
    useUpdateAssignmentMutation();
  const [submitAnswer, { isLoading: isAnswering }] = useSubmitAnswerMutation();
  // Handle file input change for chapter PDF
  const handleChapterPdfChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === "application/pdf") {
        setChapterPdf(selectedFile);

        // Create FormData and append the file
        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
          // Call the /upload endpoint
          const response = await fetch("http://localhost:5000/upload", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            console.log(
              "File uploaded and stored in ChromaDB:",
              result.message
            );
            setNotification({
              open: true,
              message: "Chapter PDF uploaded and stored successfully!",
              severity: "success",
            });
          } else {
            throw new Error("Failed to upload chapter PDF");
          }
        } catch (error) {
          console.error("Error uploading chapter PDF:", error);
          setNotification({
            open: true,
            message: "Failed to upload chapter PDF. Please try again.",
            severity: "error",
          });
        }
      } else {
        setNotification({
          open: true,
          message:
            "Invalid file type. Please upload a PDF file for the chapter.",
          severity: "error",
        });
      }
    }
  };

  // Handle file input change for assignment PDF
  const handleAssignmentPdfChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === "application/pdf") {
        setAssignmentPdf(selectedFile);
      } else {
        setNotification({
          open: true,
          message:
            "Invalid file type. Please upload a PDF file for the assignment.",
          severity: "error",
        });
      }
    }
  };

  // Handle assignment upload
  const handleUploadAssignment = async () => {
    if (!title || !deadline || !chapterPdf || !assignmentPdf) {
      setNotification({
        open: true,
        message: "Please provide a title, deadline, and select both files.",
        severity: "error",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("deadline", deadline);
    formData.append("classId", classId);
    formData.append("chapterPdf", chapterPdf);
    formData.append("assignmentPdf", assignmentPdf);

    try {
      await uploadAssignment(formData).unwrap();
      setNotification({
        open: true,
        message: "Assignment uploaded successfully!",
        severity: "success",
      });
      setOpenDialog(false);
      setTitle("");
      setDescription("");
      setDeadline("");
      setChapterPdf(null);
      setAssignmentPdf(null);
      refetch(); // Refresh the assignments list
    } catch (error) {
      setNotification({
        open: true,
        message: error.data?.message || "Failed to upload assignment.",
        severity: "error",
      });
    }
  };

  // Handle assignment deletion
  const handleDeleteAssignment = async (assignmentId) => {
    try {
      await deleteAssignment(assignmentId).unwrap();
      setNotification({
        open: true,
        message: "Assignment deleted successfully!",
        severity: "success",
      });
      refetch(); // Refresh the assignments list
    } catch (error) {
      setNotification({
        open: true,
        message: error.data?.message || "Failed to delete assignment.",
        severity: "error",
      });
    }
  };

  // Handle assignment edit
  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setTitle(assignment.title);
    setDescription(assignment.description);
    setDeadline(new Date(assignment.deadline).toISOString().split("T")[0]);
    setOpenEditDialog(true);
  };

  // Handle assignment update
  const handleUpdateAssignment = async () => {
    if (!title || !deadline) {
      setNotification({
        open: true,
        message: "Please provide a title and deadline.",
        severity: "error",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("deadline", deadline);
    if (chapterPdf) formData.append("chapterPdf", chapterPdf);
    if (assignmentPdf) formData.append("assignmentPdf", assignmentPdf);

    try {
      await updateAssignment({
        assignmentId: editingAssignment._id,
        formData,
      }).unwrap();
      setNotification({
        open: true,
        message: "Assignment updated successfully!",
        severity: "success",
      });
      setOpenEditDialog(false);
      setTitle("");
      setDescription("");
      setDeadline("");
      setChapterPdf(null);
      setAssignmentPdf(null);
      refetch(); // Refresh the assignments list
    } catch (error) {
      setNotification({
        open: true,
        message: error.data?.message || "Failed to update assignment.",
        severity: "error",
      });
    }
  };

  // Handle file upload for student submissions
  const handleFileChange = async (event, assignmentId) => {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFiles((prev) => ({ ...prev, [assignmentId]: file }));
      setStudentAssignment(event.target.files[0]);
      try {
        setIsCheckingPlagiarism(true);
        const formData = new FormData();
        formData.append("file", file);

        // Perform plagiarism check
        const response = await fetch("http://localhost:5000/detect_ai", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          const aiScore = (result.winstonai?.ai_score || 0) * 100;
          setPlagiarismResults((prev) => ({
            ...prev,
            [assignmentId]: aiScore,
          }));
          setAi_Score(aiScore);
        } else {
          throw new Error("Plagiarism check failed");
        }
      } catch (error) {
        console.error("Error submitting assignment:", error);
        setNotification({
          open: true,
          message: "Failed to submit assignment. Please try again.",
          severity: "error",
        });
      } finally {
        setIsCheckingPlagiarism(false);
      }
    }
  };

  // Handle file upload for student submissions
  const handleUpload = async (assignmentId, assignmentPdfFilename) => {
    const selectedFile = selectedFiles[assignmentId];
    if (!selectedFile) {
      alert("Please select a file before uploading.");
      return;
    }

    setIsUploadingFile(true); // Start loading for upload

    try {
      // Fetch the assignment PDF from the server
      const assignmentPdfUrl = `${BASE_URL}/uploads/${assignmentPdfFilename}`;
      const response = await fetch(assignmentPdfUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch assignment PDF");
      }
      const assignmentPdfBlob = await response.blob();
      const assignmentPdfFile = new File(
        [assignmentPdfBlob],
        assignmentPdfFilename,
        { type: "application/pdf" }
      );

      // Create FormData and append both files with correct keys
      const formData = new FormData();
      formData.append("answersheet", selectedFile);
      formData.append("question_paper", assignmentPdfFile);
      console.log({ selectedFile: selectedFile });
      // Send to Flask backend
      const uploadResponse = await fetch(
        "http://localhost:5000/get_student_score",
        {
          method: "POST",
          body: formData,
        }
      );

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        // Update scores state with the new result
        setScores((prev) => ({
          ...prev,
          [assignmentId]: result.total_score,
        }));
        setEvaluationResults((prev) => ({
          ...prev,
          [assignmentId]: result,
        }));
        console.log({ result: result });
        const submissionData = new FormData();
        submissionData.append("assignmentId", assignmentId);
        submissionData.append("studentId", userInfo._id); // Use the logged-in student's ID
        submissionData.append("results", JSON.stringify(result));
        console.log(result); // Convert results to JSON string
        submissionData.append("total_score", result.total_score);
        submissionData.append("answerFile", studentAssignment);
        submissionData.append("plagiarismScore", ai_Score);

        // Submit the answer
        const submissionResponse = await submitAnswer(submissionData).unwrap();
        setNotification({
          open: true,
          message: "Assignment submitted successfully!",
          severity: "success",
        });
        console.log({ submissionResponse: submissionResponse });
      } else {
        alert("Upload failed.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file: " + error.message);
    } finally {
      setIsUploadingFile(false); // Stop loading for upload
    }
  };

  const hasStudentSubmitted = (assignment) => {
    return assignment.submissions?.some(
      (submission) => submission.studentId === userInfo._id
    );
  };

  // Inside the AssignmentPage component
  const handleViewReport = ({ studentId, assignmentId }) => {
    navigate("/report", {
      state: {
        studentId: studentId, // Pass only the student ID
        assignmentId: assignmentId,
      },
    });
  };
  const handleViewFeedback = ({ studentId, assignmentId }) => {
    navigate("/feedback", {
      state: {
        studentId: studentId, // Pass the student ID
        assignmentId: assignmentId, // Pass the assignment ID
      },
    });
  };
  // const handleViewFeedback = async (assignmentId) => {
  //   try {
  //     // Get the evaluation results for the assignment
  //     const results = evaluationResults[assignmentId];
  //     if (!results) {
  //       throw new Error("No evaluation results found");
  //     }

  //     // Send the results array to the Flask backend
  //     const response = await fetch("http://localhost:5000/generate-feedback", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ results }), // Send the results array
  //     });

  //     if (!response.ok) {
  //       throw new Error("Failed to fetch feedback");
  //     }

  //     // Parse the feedback data from the response
  //     const feedbackData = await response.json();

  //     // Navigate to the feedback page with the feedback data
  //     navigate("/feedback", { state: { feedbackData } });
  //   } catch (error) {
  //     console.error("Error fetching feedback:", error);
  //     setNotification({
  //       open: true,
  //       message: "Failed to fetch feedback. Please try again.",
  //       severity: "error",
  //     });
  //   }
  // };
  // Handle viewing submissions
  // Handle viewing submissions
  const handleViewSubmissions = async (assignmentId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/assignment/teacher/assignment/${assignmentId}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log("API Response:", data); // Log the response to debug

        // Ensure the response is an array
        if (Array.isArray(data)) {
          setSubmissions(data);
        } else {
          // If the response is not an array, transform it into one
          setSubmissions([data]);
        }

        setOpenSubmissionsModal(true);
      } else {
        throw new Error("Failed to fetch submissions");
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setNotification({
        open: true,
        message: "Failed to fetch submissions. Please try again.",
        severity: "error",
      });
    }
  };
  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  console.log(submissions);
  // Toggle expanded state for assignment card
  const toggleExpand = (assignmentId) => {
    setExpandedAssignmentId((prevId) =>
      prevId === assignmentId ? null : assignmentId
    );
  };

  return (
    <Box sx={{ p: 3, background: theme.palette.background.default }}>
      {/* Page Header */}
      <Typography
        variant="h3"
        gutterBottom
        sx={{ fontWeight: "bold", color: theme.palette.text.primary }}
      >
        Assignments
      </Typography>

      {/* Create Assignment Button */}
      {userInfo.role === "teacher" && (
        <StyledButton
          startIcon={<UploadIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ mb: 3 }}
        >
          Create New Assignment
        </StyledButton>
      )}

      {/* Assignments List */}
      {isLoading ? (
        <CircularProgress />
      ) : (
        <Box>
          {assignments?.map((assignment) => (
            <motion.div
              key={assignment._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StyledCard>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      cursor: "pointer",
                    }}
                    onClick={() => toggleExpand(assignment._id)}
                  >
                    {/* Left Side: Assignment Details */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        <DescriptionIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                          {assignment?.title.length > 50
                            ? `${assignment?.title.slice(0, 50)}...`
                            : assignment?.title}
                        </Typography>

                        <Typography variant="body2" color="textSecondary">
                          Uploaded on:{" "}
                          {new Date(assignment?.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Deadline:{" "}
                          {new Date(assignment?.deadline).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Right Side: Actions and PDF Links */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {/* Assignment PDF Link */}
                      <Button
                        variant="outlined"
                        startIcon={<DescriptionIcon />}
                        component="a"
                        href={`${BASE_URL}/uploads/${assignment.assignmentPdf}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Assignment PDF
                      </Button>

                      {/* Chapter PDF Link */}
                      {userInfo.role === "teacher" && (
                        <Button
                          variant="outlined"
                          startIcon={<DescriptionIcon />}
                          component="a"
                          href={`${BASE_URL}/uploads/${assignment.chapterPdf}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Chapter PDF
                        </Button>
                      )}
                      {userInfo.role === "student" &&
                        (assignment.submissions?.some(
                          (submission) => submission.studentId === userInfo._id
                        ) ? (
                          <>
                            <Button
                              variant="outlined"
                              startIcon={<DescriptionIcon />}
                              component="a"
                              href={`${BASE_URL}/uploads/${assignment.submissions?.find((sub) => sub.studentId === userInfo._id).answerFile}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Submitted PDF
                            </Button>
                            <Typography
                              variant="body1"
                              sx={{
                                ml: 2,
                                fontWeight: "bold",
                                color: theme.palette.success.main,
                              }}
                            >
                              Score:{" "}
                              {
                                assignment.submissions?.find(
                                  (sub) => sub.studentId === userInfo._id
                                ).result.total_score
                              }
                            </Typography>
                            <Button
                              variant="outlined"
                              color="secondary"
                              onClick={() =>
                                handleViewReport({
                                  studentId: userInfo._id,
                                  assignmentId: assignment._id,
                                })
                              } // Pass the student ID
                              sx={{ ml: 2 }}
                            >
                              View Report
                            </Button>
                            <Button
                              variant="outlined"
                              color="primary"
                              onClick={() =>
                                handleViewFeedback({
                                  studentId: userInfo._id, // Pass the logged-in student's ID
                                  assignmentId: assignment._id, // Pass the assignment ID
                                })
                              }
                              sx={{ ml: 2 }}
                            >
                              View Feedback
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              component="label"
                              role={undefined}
                              variant="contained"
                              tabIndex={-1}
                              startIcon={<CloudUploadIcon />}
                            >
                              Upload assignment
                              <VisuallyHiddenInput
                                type="file"
                                onChange={(e) =>
                                  handleFileChange(e, assignment._id)
                                }
                              />
                            </Button>

                            {selectedFiles[assignment._id] && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                }}
                              >
                                {/* Plagiarism Check Result */}
                                {plagiarismResults[assignment._id] !==
                                  undefined && (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color:
                                        plagiarismResults[assignment._id] > 30
                                          ? theme.palette.error.main
                                          : theme.palette.success.main,
                                      fontWeight: "bold",
                                    }}
                                  >
                                    AI Detection:{" "}
                                    {plagiarismResults[assignment._id].toFixed(
                                      2
                                    )}
                                    %
                                  </Typography>
                                )}

                                {/* Submit Button */}
                                <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={() =>
                                    handleUpload(
                                      assignment._id,
                                      assignment.assignmentPdf
                                    )
                                  }
                                  disabled={
                                    (plagiarismResults[assignment._id] !==
                                      undefined &&
                                      plagiarismResults[assignment._id] > 75) ||
                                    isUploadingFile
                                  }
                                >
                                  {isUploadingFile ? (
                                    <CircularProgress size={24} />
                                  ) : (
                                    "Submit"
                                  )}
                                </Button>

                                {/* Score Display */}
                                {scores[assignment._id] && (
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      ml: 2,
                                      fontWeight: "bold",
                                      color: theme.palette.success.main,
                                    }}
                                  >
                                    Score: {scores[assignment._id]}/
                                    {assignment.questions?.length * 10}
                                  </Typography>
                                )}
                              </Box>
                            )}

                            {/* View Report Button */}
                            {(evaluationResults[assignment._id] ||
                              scores[assignment._id]) && (
                              <Button
                                variant="outlined"
                                color="secondary"
                                onClick={() => handleViewReport(userInfo._id)} // Pass the student ID
                                sx={{ ml: 2 }}
                              >
                                View Report
                              </Button>
                            )}

                            {/* View Feedback Button */}
                            {scores[assignment._id] && (
                              <>
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  onClick={() =>
                                    handleViewFeedback(assignment._id)
                                  }
                                  sx={{ ml: 2 }}
                                >
                                  View Feedback
                                </Button>
                              </>
                            )}
                          </>
                        ))}
                      {/* Delete Button */}
                      {userInfo.role === "teacher" && (
                        <>
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() =>
                              handleViewSubmissions(assignment._id)
                            }
                          >
                            View Submissions
                          </Button>

                          <IconButton
                            edge="end"
                            onClick={() =>
                              confirm(
                                "Are you sure you want to delete this assignment?"
                              ) && handleDeleteAssignment(assignment._id)
                            }
                            disabled={isDeleting}
                            sx={{ color: theme.palette.error.main }}
                          >
                            {isDeleting ? (
                              <CircularProgress size={24} />
                            ) : (
                              <DeleteIcon />
                            )}
                          </IconButton>

                          <IconButton
                            edge="end"
                            onClick={() => handleEditAssignment(assignment)}
                            disabled={isUpdating}
                            sx={{ color: theme.palette.primary.main }}
                          >
                            {isUpdating ? (
                              <CircularProgress size={24} />
                            ) : (
                              <EditIcon />
                            )}
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </Box>

                  {/* Description Section */}
                  <Collapse in={expandedAssignmentId === assignment._id}>
                    <Typography variant="h6" sx={{ mt: 2, fontWeight: "bold" }}>
                      Title:
                    </Typography>
                    <Typography variant="body1">{assignment?.title}</Typography>

                    <Typography variant="h6" sx={{ mt: 2, fontWeight: "bold" }}>
                      Description:
                    </Typography>
                    <Typography variant="body1">
                      {assignment?.description}
                    </Typography>
                  </Collapse>

                  {/* Progress Bar for Uploading */}
                  {isUploading && <LinearProgress sx={{ mt: 2 }} />}
                </CardContent>
              </StyledCard>
            </motion.div>
          ))}
        </Box>
      )}

      {/* Create Assignment Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth>
        <DialogTitle>Create New Assignment</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              marginTop: "10px",
            }}
          >
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={4}
              required
            />
            <TextField
              label="Deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
            >
              Upload Chapter PDF
              <input
                type="file"
                hidden
                onChange={handleChapterPdfChange}
                accept="application/pdf"
                required
              />
            </Button>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
            >
              Upload Assignment PDF
              <input
                type="file"
                hidden
                onChange={handleAssignmentPdfChange}
                accept="application/pdf"
                required
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUploadAssignment}
            disabled={isUploading}
            variant="contained"
            color="primary"
          >
            {isUploading ? <CircularProgress size={24} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        fullWidth
      >
        <DialogTitle>Edit Assignment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={4}
            />
            <TextField
              label="Deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
            >
              Upload New Chapter PDF
              <input
                type="file"
                hidden
                onChange={handleChapterPdfChange}
                accept="application/pdf"
              />
            </Button>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
            >
              Upload New Assignment PDF
              <input
                type="file"
                hidden
                onChange={handleAssignmentPdfChange}
                accept="application/pdf"
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateAssignment}
            disabled={isUpdating}
            variant="contained"
            color="primary"
          >
            {isUpdating ? <CircularProgress size={24} /> : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submissions Modal */}
      <Dialog
        open={openSubmissionsModal}
        onClose={() => setOpenSubmissionsModal(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Submissions</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Plagiarism Score</TableCell>
                  <TableCell>Submitted PDF</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions[0]?.submissions?.map((submission) => (
                  <TableRow key={submission._id}>
                    <TableCell>{submission.studentId?.name}</TableCell>
                    <TableCell>{submission.studentId?.email}</TableCell>
                    <TableCell>
                      {submission.result?.total_score || "N/A"}
                    </TableCell>
                    <TableCell>{submission.plagiarismScore || "N/A"}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        startIcon={<DescriptionIcon />}
                        component="a"
                        href={`${BASE_URL}/uploads/${submission.answerFile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSubmissionsModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AssignmentPage;
