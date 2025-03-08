import QuizResult from "../../model/quiz.Result.js";
import Quiz from "../../model/quiz.model.js"; // Import the Quiz model
import Class from "../../model/class.model.js"; // Import the Class model

export const getQuizResultsByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        console.log("Fetching quiz results for studentId:", studentId);

        // Step 1: Fetch quiz results and populate the 'quizid' field
        const quizResults = await QuizResult.find({ studentId }).populate('quizid');

        console.log("Quiz results found:", quizResults);

        if (!quizResults || quizResults.length === 0) {
            return res.status(404).json({ message: "No quiz results found for the student" });
        }

        // Step 2: Fetch class details for each quiz's classid
        const formattedResults = await Promise.all(
            quizResults.map(async (result) => {
                const quiz = result.quizid;
                if (quiz && quiz.classid) {
                    // Fetch the class details using the classid (which is a String)
                    const classDetails = await Class.findOne({ _id: quiz.classid });
                    return {
                        ...result.toObject(),
                        quizid: {
                            ...quiz.toObject(),
                            classDetails: classDetails || null, // Include class details
                        },
                    };
                }
                return result.toObject();
            })
        );

        res.status(200).json(formattedResults);
    } catch (error) {
        console.error("Error fetching quiz results:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};