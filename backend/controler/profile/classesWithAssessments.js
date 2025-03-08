
import Class from '../../model/class.model.js'
import Viva from '../../model/viva.model.js'
import Assignment from '../../model/assignment.model.js';
import Quiz from '../../model/quiz.model.js'
import QuizResult  from "../../model/quiz.Result.js"
import  VivaResult   from "../../model/vivaResult.model.js"
import User from '../../model/user.model.js';
export const getClassesByTeacherId = async (req, res) => {
    try {
      const { userId } = req.params;
  
      // Step 1: Find all classes where the teacher ID matches
      const classes = await Class.find({ teacher: userId }).select('_id name students');
  

      if (!classes || classes.length === 0) {
        return res.status(404).json({ message: 'No classes found for this teacher' });
      }
  
      // Step 2: For each class, fetch quizzes, vivas, assignments, and results
      const classesWithResults = await Promise.all(
        classes.map(async (cls) => {
          // Fetch all quizzes for this class
          const quizzes = await Quiz.find({ classid: cls._id.toString() }).select('_id quizname');
  
          // Fetch all quiz results for this class
          const quizResults = await QuizResult.find({ 'quizid.classid': cls._id.toString() });
  
          // Fetch all vivas for this class
          const vivas = await Viva.find({ classid: cls._id.toString() }).select('_id vivaname');
  
          // Fetch all viva results for this class
          const vivaResults = await VivaResult.find({ 'quizid.classid': cls._id.toString() });
  
          // Fetch all assignments for this class
          const assignments = await Assignment.find({ classId: cls._id.toString() }).select('_id title');
  
          // Fetch student details (names) for this class
          const students = await User.find({ _id: { $in: cls.students } }).select('_id name');
  
          // Create a map of student IDs to their names
          const studentNameMap = students.reduce((map, student) => {
            map[student._id.toString()] = student.name;
            return map;
          }, {});
  
          // Organize results by student
          const studentsWithResults = cls.students.map((studentId) => {
            const studentName = studentNameMap[studentId.toString()] || 'Unknown'; // Default to 'Unknown' if name not found
  
            // Map quiz results for the student
            const studentQuizResults = quizzes.map((quiz) => {
              const result = quizResults.find(
                (res) =>
                  res.studentId.toString() === studentId.toString() &&
                  res.quizid._id.toString() === quiz._id.toString()
              );
  
              return {
                quizId: quiz._id,
                quizName: quiz.quizname,
                result: result
                  ? {
                      overallMark: result.overallMark,
                      dateofquiz: result.dateofquiz,
                    }
                  : null, // Null if the student hasn't taken the quiz
              };
            });
  
            // Identify quizzes not taken by the student
            const quizzesNotTaken = quizzes
              .filter(
                (quiz) =>
                  !quizResults.some(
                    (res) =>
                      res.studentId.toString() === studentId.toString() &&
                      res.quizid._id.toString() === quiz._id.toString()
                  )
              )
              .map((quiz) => ({
                quizId: quiz._id,
                quizName: quiz.quizname,
              }));
  
            // Map viva results for the student
            const studentVivaResults = vivas.map((viva) => {
              const result = vivaResults.find(
                (res) =>
                  res.studentId.toString() === studentId.toString() &&
                  res.quizid._id.toString() === viva._id.toString()
              );
  
              return {
                vivaId: viva._id,
                vivaName: viva.vivaname,
                result: result
                  ? {
                      overallMark: result.overallMark,
                      dateofquiz: result.dateofquiz,
                    }
                  : null, // Null if the student hasn't taken the viva
              };
            });
  
            // Identify vivas not taken by the student
            const vivasNotTaken = vivas
              .filter(
                (viva) =>
                  !vivaResults.some(
                    (res) =>
                      res.studentId.toString() === studentId.toString() &&
                      res.quizid._id.toString() === viva._id.toString()
                  )
              )
              .map((viva) => ({
                vivaId: viva._id,
                vivaName: viva.vivaname,
              }));
  
            // Map assignment submissions for the student
            const studentAssignmentResults = assignments.map((assignment) => {
              const submission = assignment.submissions.find(
                (sub) => sub.studentId.toString() === studentId.toString()
              );
  
              return {
                assignmentId: assignment._id,
                assignmentName: assignment.title,
                submission: submission
                  ? {
                      answerFile: submission.answerFile,
                      plagiarismScore: submission.plagiarismScore,
                      totalScore: submission.result?.total_score || 0,
                      submittedAt: submission.submittedAt,
                    }
                  : null, // Null if the student hasn't submitted the assignment
              };
            });
  
            // Identify assignments not submitted by the student
            const assignmentsNotSubmitted = assignments
              .filter(
                (assignment) =>
                  !assignment.submissions.some(
                    (sub) => sub.studentId.toString() === studentId.toString()
                  )
              )
              .map((assignment) => ({
                assignmentId: assignment._id,
                assignmentName: assignment.title,
              }));
  
            return {
              studentId: studentId.toString(),
              studentName: studentName, // Include student name
              quizResults: studentQuizResults,
              quizzesNotTaken: quizzesNotTaken,
              vivaResults: studentVivaResults,
              vivasNotTaken: vivasNotTaken,
              assignmentResults: studentAssignmentResults,
              assignmentsNotSubmitted: assignmentsNotSubmitted,
            };
          });
  
          return {
            classid: cls._id,
            classname: cls.name,
            students: studentsWithResults,
          };
        })
      );
  
      res.status(200).json({ classes: classesWithResults });
    } catch (error) {
      console.error('Error fetching all student results by teacher ID:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  };
  


  