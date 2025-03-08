import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useLocation } from 'react-router-dom';
import { useGetSubmissionResultQuery } from '../redux/api/assignmentSlice';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const Studentreport3 = () => {
  const location = useLocation();
  const { studentId, assignmentId } = location.state || {};
  const { data: resultData, error: resultError, isLoading: resultLoading } = useGetSubmissionResultQuery({ assignmentId, studentId });

  const [reportData, setReportData] = useState({
    results: [],
    totalScore: 0,
    assignmentTitle: 'Evaluation Report',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAndParseResults = async (resultsString) => {
    try {
      console.log("Sending results string to Flask backend...");
      console.log(resultsString);
      const parseResponse = await fetch('http://127.0.0.1:5000/parsejson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ input_string: resultsString }),
      });
      console.log("Parse response status:", parseResponse.status);

      if (!parseResponse.ok) {
        const errorText = await parseResponse.text();
        console.error("Parse response error:", errorText);
        throw new Error(`Server error: ${errorText}`);
      }

      const parsedData = await parseResponse.json();
      console.log("Parsed data:", parsedData);

      // Extract the `results` array from the parsed data
      const resultsArray = parsedData.results;

      // Update the state with the extracted results array
      setReportData({
        results: resultsArray, // Use the extracted array
        totalScore: parsedData.total_score || 0,
        assignmentTitle: resultData.assignmentTitle || 'Evaluation Report',
      });
    } catch (err) {
      console.error("Error in fetchAndParseResults:", err);
      setError(err.message);
    } finally {
      setLoading(false);
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
      }
    } else if (resultError) {
      setError(resultError.message);
      setLoading(false);
    }
  }, [resultData, resultError]);

  if (loading || resultLoading) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-lg">
        <h1 className="text-center text-3xl font-bold text-gray-800">Loading...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-lg">
        <h1 className="text-center text-3xl font-bold text-gray-800">Error</h1>
        <p className="mt-4 text-center text-gray-600">{error}</p>
      </div>
    );
  }

  const { results, totalScore, assignmentTitle } = reportData;

  // Calculate derived values
  const maxMarks = results.length * 10;
  const percentage =
    maxMarks > 0 ? ((totalScore / maxMarks) * 100)?.toFixed(2) : 0;
  const grade =
    percentage >= 90
      ? 'A+'
      : percentage >= 80
      ? 'A'
      : percentage >= 70
      ? 'B'
      : percentage >= 60
      ? 'C'
      : 'D';

  // Chart data configurations
  const barChartData = {
    labels: results.map((result) => `Q${result.question_no}`),
    datasets: [
      {
        label: 'Score (out of 10)',
        data: results.map((r) => r?.score || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  const pieChartData = {
    labels: ['Correct', 'Incorrect'],
    datasets: [
      {
        data: [totalScore, Math.max(maxMarks - totalScore, 0)],
        backgroundColor: ['#4CAF50', '#FF5252'],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-lg">
      <h1 className="mb-8 text-center text-3xl font-bold text-gray-800">
        {assignmentTitle}
      </h1>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-gray-600">Total Score</p>
          <p className="text-2xl font-bold text-blue-600">
            {totalScore.toFixed(1)}/{maxMarks}
          </p>
        </div>
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-sm text-gray-600">Percentage</p>
          <p className="text-2xl font-bold text-green-600">{percentage}%</p>
        </div>
        <div className="rounded-lg bg-purple-50 p-4">
          <p className="text-sm text-gray-600">Grade</p>
          <p className="text-2xl font-bold text-purple-600">{grade}</p>
        </div>
        <div className="rounded-lg bg-yellow-50 p-4">
          <p className="text-sm text-gray-600">Questions</p>
          <p className="text-2xl font-bold text-yellow-600">
            {results.length}
          </p>
        </div>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-4 shadow">
          <h3 className="mb-4 text-lg font-semibold">Question-wise Scores</h3>
          <div className="h-64">
            <Bar
              data={barChartData}
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: {
                    max: 10,
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 shadow">
          <h3 className="mb-4 text-lg font-semibold">Score Distribution</h3>
          <div className="h-64">
            <Pie data={pieChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-4 shadow">
        <h3 className="mb-4 text-lg font-semibold">Detailed Analysis</h3>
        <div
          className="space-y-4 overflow-y-auto pr-2"
          style={{ maxHeight: '500px' }}
        >
          {results.map((result, index) => (
            <div key={index} className="rounded-lg bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between">
                <h4 className="text-lg font-semibold">
                  Q{result.question_no}: {result.question}
                </h4>
                <span
                  className={`rounded px-2 py-1 ${
                    result.score >= 8
                      ? 'bg-green-100 text-green-800'
                      : result.score >= 5
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {(result.score ?? 0).toFixed(1)}/{(result.max_score ?? 10)}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-blue-600">
                    Student Answer:
                  </span>{' '}
                  {result.answer || 'No answer provided'}
                </p>
                {/* <p className="text-sm">
                  <span className="font-medium text-green-600">Context:</span>{' '}
                  {result.context?.join(' ') || 'No context available'}
                </p> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Studentreport3;