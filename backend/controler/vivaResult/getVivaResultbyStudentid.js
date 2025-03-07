import vivaresult from '../../model/vivaResult.model.js';
import Quiz from "../../model/quiz.model.js"; // Import the Quiz model
import Class from "../../model/class.model.js"; // Import the Class model

export const getVivaResultByStudentid = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Step 1: Fetch viva results and populate the 'vivaId' field
        const vivaResults = await vivaresult.find({ studentId }).populate('vivaId');

        console.log("Viva results found:", vivaResults);
        if (!vivaResults || vivaResults.length === 0) {
            return res.status(404).json({ message: "No viva results found for the student" });
        }

        // Step 2: Fetch class details for each viva's classid
        const formattedResults = await Promise.all(
            vivaResults.map(async (result) => {
                const viva = result.vivaId;
                if (viva && viva.classid) {
                    // Fetch the class details using the classid (which is a String)
                    const classDetails = await Class.findOne({ _id: viva.classid });
                    return {
                        ...result.toObject(),
                        vivaId: {
                            ...viva.toObject(),
                            classDetails: classDetails || null, // Include class details
                        },
                    };
                }
                return result.toObject();
            })
        );

        res.status(200).json(formattedResults);
    } catch (error) {
        console.error("Error fetching viva results:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};