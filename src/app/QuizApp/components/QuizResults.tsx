"use client";

import React, { useState, useEffect } from "react";
import { QuizData } from "../../../services/quizService";

interface QuizResultsProps {
  _quizData: QuizData | null;
  liveQuizData: QuizData | null;
  _onQuizComplete?: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  _quizData,
  liveQuizData,
  _onQuizComplete,
}) => {
  // Sequential reveal states for results
  const [showResults, setShowResults] = useState(false);

  // Get leaderboard data
  const leaderboard = liveQuizData?.participants
    ? Object.entries(liveQuizData.participants)
        .map(([_id, participant]) => ({
          username: participant.username,
          responses: participant.responses,
          scores: participant.scores,
          totalScore: participant.totalScore,
          joinedAt: participant.joinedAt,
        }))
        .sort((a, b) => b.totalScore - a.totalScore)
    : [];

  // Reveal effect for results
  useEffect(() => {
    if (liveQuizData?.participants && leaderboard.length > 0) {
      const timer = setTimeout(() => setShowResults(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowResults(false);
    }
  }, [liveQuizData?.participants, leaderboard.length]);

  // If no participants, show empty state
  if (
    !liveQuizData?.participants ||
    Object.keys(liveQuizData.participants).length === 0
  ) {
    return (
      <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-4xl font-bold text-dark-royalty mb-4">
            Quiz Complete!
          </h2>
          <p className="text-xl text-deep-sea/70">
            No participants joined this quiz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-blue-50 to-white">
      {/* Title */}
      <div className="absolute top-16 left-0 right-0 px-16">
        <h1 className="text-6xl font-bold text-dark-royalty leading-tight text-center">
          🏆 Quiz Complete!
        </h1>
      </div>

      {/* Results Container - Center of screen */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center space-y-6">
          {/* First Place */}
          {leaderboard[0] && showResults && (
            <div className="flex flex-col items-center animate-fade-in">
              <div className="bg-yellow-500 text-white rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold mb-3">
                1
              </div>
              <div className="bg-yellow-400 rounded-2xl w-48 h-20 flex flex-col items-center justify-center text-white shadow-lg">
                <div className="text-lg font-bold">
                  {leaderboard[0].username}
                </div>
                <div className="text-2xl font-bold">
                  {leaderboard[0].totalScore}
                </div>
              </div>
            </div>
          )}

          {/* Second Place */}
          {leaderboard[1] && showResults && (
            <div className="flex flex-col items-center animate-fade-in">
              <div className="bg-gray-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-3">
                2
              </div>
              <div className="bg-gray-400 rounded-2xl w-40 h-16 flex flex-col items-center justify-center text-white shadow-lg">
                <div className="text-base font-bold">
                  {leaderboard[1].username}
                </div>
                <div className="text-xl font-bold">
                  {leaderboard[1].totalScore}
                </div>
              </div>
            </div>
          )}

          {/* Third Place */}
          {leaderboard[2] && showResults && (
            <div className="flex flex-col items-center animate-fade-in">
              <div className="bg-orange-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-3">
                3
              </div>
              <div className="bg-orange-400 rounded-2xl w-40 h-16 flex flex-col items-center justify-center text-white shadow-lg">
                <div className="text-base font-bold">
                  {leaderboard[2].username}
                </div>
                <div className="text-xl font-bold">
                  {leaderboard[2].totalScore}
                </div>
              </div>
            </div>
          )}

          {/* Additional participants */}
          {leaderboard.length > 3 && showResults && (
            <div className="mt-6 text-center">
              <h3 className="text-xl font-semibold text-dark-royalty mb-3">
                Other Participants
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {leaderboard.slice(3).map((participant, index) => (
                  <div
                    key={participant.username}
                    className="bg-gray-100 rounded-lg px-3 py-2 text-gray-700 text-sm"
                  >
                    <span className="font-medium">{index + 4}.</span>{" "}
                    {participant.username} - {participant.totalScore}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thank you message */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-xl text-deep-sea/70">Thanks for participating!</p>
      </div>
    </div>
  );
};

export default QuizResults;
