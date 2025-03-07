import VivaResult from "../../model/vivaResult.model.js";

export const addVivaResult = async (req, res) => {
    try {
        const { vivaId, studentId, studentName, totalQuestions, questionAnswerSet,  dateOfViva,proctoredFeedback } = req.body;

        if (!vivaId || !studentId || !studentName) {
            return res.status(400).json({ message: "Missing required fields", success: false });
        }

        const attemptedQuestions = questionAnswerSet.filter(q => q.evaluation);
        const attemptedCount = attemptedQuestions.length;
        let totalScore = 0;
        attemptedQuestions.forEach(question => {
            const evaluation = question.evaluation;
            const scoreMatch = evaluation.match(/Total Average Score \(out of 10\): (\d+(\.\d+)?)/);
            if (scoreMatch) {
                totalScore += parseFloat(scoreMatch[1]);
            }
        });

        // Calculate overall mark as a percentage out of 100%
        const totalPossibleScore = totalQuestions * 10; // Each question is out of 10
        const overallMark = (totalScore / totalPossibleScore) * 100;
        const roundedOverallMark = Math.round(overallMark);

        const newVivaResult = new VivaResult({
            vivaId,
            studentId,
            studentName,
            totalQuestions,
            questionAnswerSet,
            dateOfViva,
            overallMark:roundedOverallMark,
            proctoredFeedback
        });
        const savedVivaResult = await newVivaResult.save();
        console.log("savedVivaResult",savedVivaResult);
        res.status(201).json({
            message: "Viva result saved successfully",
            data: savedVivaResult,
            success: true
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: error.message || "Server Error" });
    }
};
