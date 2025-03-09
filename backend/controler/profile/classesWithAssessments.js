import Class from '../../model/class.model.js';
import User from '../../model/user.model.js'; // Assuming students are stored in the User model
import Quiz from '../../model/quiz.model.js';
import QuizResult from '../../model/quiz.Result.js';
import Viva from '../../model/viva.model.js';
import Assignment from '../../model/assignment.model.js';

export const getClassesByTeacherId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Step 1: Find all classes where the teacher ID matches
    const classes = await Class.find({ teacher: userId });

    // Step 2: Fetch details for each class
    const formattedClasses = await Promise.all(classes.map(async (cls) => {
      // Step 2.1: Count the number of students in the class
      const numberOfStudents = cls.students.length;

      // Step 2.2: Fetch all quizzes, vivas, and assignments for the class
      const quizzes = await Quiz.find({ class: cls._id });
      const vivas = await Viva.find({ class: cls._id });
      const assignments = await Assignment.find({ class: cls._id });

      // Step 2.3: Count the number of quizzes, vivas, and assignments
      const numberOfQuizzes = quizzes.length;
      const numberOfVivas = vivas.length;
      const numberOfAssignments = assignments.length;

      // Step 2.4: Count the number of students who attempted each quiz, viva, and assignment
      const quizAttempts = await Promise.all(quizzes.map(async (quiz) => {
        const quizResults = await QuizResult.find({ quizid: quiz._id });
        return {
          quizId: quiz._id,
          quizName: quiz.quizname,
          totalStudentsAttempted: quizResults.length,
        };
      }));

      const vivaAttempts = await Promise.all(vivas.map(async (viva) => {
        const vivaResults = await VivaResult.find({ vivaid: viva._id });
        return {
          vivaId: viva._id,
          vivaName: viva.vivaname,
          totalStudentsAttempted: vivaResults.length,
        };
      }));

      const assignmentAttempts = await Promise.all(assignments.map(async (assignment) => {
        const assignmentResults = await AssignmentResult.find({ assignmentid: assignment._id });
        return {
          assignmentId: assignment._id,
          assignmentName: assignment.assignmentname,
          totalStudentsAttempted: assignmentResults.length,
        };
      }));

      return {
        classId: cls._id,
        className: cls.name,
        classCode: cls.classCode,
        numberOfStudents,
        numberOfQuizzes,
        numberOfVivas,
        numberOfAssignments,
        quizzes: quizAttempts,
        vivas: vivaAttempts,
        assignments: assignmentAttempts,
      };
    }));

    // Step 3: Send the formatted result as a response
    res.status(200).json({
      success: true,
      numberOfClasses: classes.length,
      classes: formattedClasses,
    });
  } catch (error) {
    console.error('Error fetching teacher class details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};