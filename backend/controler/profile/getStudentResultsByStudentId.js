
import Class from '../../model/class.model.js'
import Viva from '../../model/viva.model.js'
import Assignment from '../../model/assignment.model.js';
import Quiz from '../../model/quiz.model.js'
import QuizResult  from "../../model/quiz.Result.js"
import  VivaResult   from "../../model/vivaResult.model.js"
import User from '../../model/user.model.js';

// export const getStudentResultsByStudentId = async (req, res) => {
//   try {
//     const { studentid } = req.params;

//     // Step 1: Find all classes where the student is enrolled
//     const classes = await Class.find({ students: studentid })
//       .populate('teacher', 'name email') // Populate teacher details (name and email)
//       .populate('students', 'name email'); // Populate student details (name and email)

//     if (!classes || classes.length === 0) {
//       return res.status(404).json({ message: 'No classes found for this student' });
//     }

//     // Step 2: Return the class details
//     res.status(200).json({
//       studentId: studentid,
//       classes: classes,
//     });
//   } catch (error) {
//     console.error('Error fetching classes by student ID:', error);
//     res.status(500).json({ message: 'Server Error', error: error.message });
//   }
// };

export const getStudentResultsByStudentId = async (req, res) => {
  try {
    const { studentid } = req.params;

    // Debugging: Check if models are defined
    console.log('Class:', Class);
    console.log('Quiz:', Quiz);
    console.log('QuizResult:', QuizResult);
    console.log('Viva:', Viva);
    console.log('VivaResult:', VivaResult);
    console.log('Assignment:', Assignment);
    console.log('User:', User);

    // Step 1: Find all classes where the student is enrolled
    const classes = await Class.find({ students: studentid })
    .populate('teacher', 'name email') // Populate teacher details (name and email)
    .populate('students', 'name email');    
    console.log(classes);
    if (!classes || classes.length === 0) {
      return res.status(404).json({ message: 'No classes found for this student' });
    }

    // Step 2: Fetch the student's details (name)
    const student = await User.findById(studentid).select('name');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Step 3: For each class, fetch quizzes, vivas, assignments, and results for the student
    const classesWithResults = await Promise.all(
      classes.map(async (cls) => {
        // Fetch all quizzes for this class
        const quizzes = await Quiz.find({ classid: cls._id.toString() }).select('_id quizname');
        console.log("quizzes:",quizzes)
        // Fetch all quiz results for this student in this class
        const quizResults = await QuizResult.find({
          'quizid.classid': cls._id.toString(),
          studentId: studentid,
        });
        console.log("quizResults:",quizResults)
        // Fetch all vivas for this class
        const vivas = await Viva.find({ classid: cls._id.toString() }).select('_id vivaname');
        console.log("vivas:",vivas)
        // Fetch all viva results for this student in this class
        const vivaResults = await VivaResult.find({
          'quizid.classid': cls._id.toString(),
          studentId: studentid,
        });
        console.log("vivaResults:",vivaResults)
        // Fetch all assignments for this class
        const assignments = await Assignment.find({ classId: cls._id.toString() }).select('_id title');
        console.log("assignments:",assignments)
        // Map quiz results for the student
        const studentQuizResults = quizzes.map((quiz) => {
          const result = quizResults.find(
            (res) => res.quizid._id.toString() === quiz._id.toString()
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
                (res) => res.quizid._id.toString() === quiz._id.toString()
              )
          )
          .map((quiz) => ({
            quizId: quiz._id,
            quizName: quiz.quizname,
          }));

        // Map viva results for the student
        const studentVivaResults = vivas.map((viva) => {
          const result = vivaResults.find(
            (res) => res.quizid._id.toString() === viva._id.toString()
          );
          console.log("studentVivaResults",studentVivaResults)
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
                (res) => res.quizid._id.toString() === viva._id.toString()
              )
          )
          .map((viva) => ({
            vivaId: viva._id,
            vivaName: viva.vivaname,
          }));

        // Map assignment submissions for the student
        const studentAssignmentResults = assignments.map((assignment) => {
          const submission = assignment.submissions.find(
            (sub) => sub.studentId.toString() === studentid
          );
          console.log("studentAssignmentResults:",studentAssignmentResults)
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
                (sub) => sub.studentId.toString() === studentid
              )
          )
          .map((assignment) => ({
            assignmentId: assignment._id,
            assignmentName: assignment.title,
          }));

        return {
          classid: cls._id,
          classname: cls.name,
          teacher: cls.teacher, // Include teacher ID
          quizResults: studentQuizResults,
          quizzesNotTaken: quizzesNotTaken,
          vivaResults: studentVivaResults,
          vivasNotTaken: vivasNotTaken,
          assignmentResults: studentAssignmentResults,
          assignmentsNotSubmitted: assignmentsNotSubmitted,
        };
      })
    );

    res.status(200).json({
      studentId: studentid,
      studentName: student.name, // Include student name
      classes: classesWithResults,
    });
  } catch (error) {
    console.error('Error fetching student results by student ID:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};