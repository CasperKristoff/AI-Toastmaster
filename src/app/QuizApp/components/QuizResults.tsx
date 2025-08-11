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
  // Sequential reveal states for podium
  const [showThirdPlace, setShowThirdPlace] = useState(false);
  const [showSecondPlace, setShowSecondPlace] = useState(false);
  const [showFirstPlace, setShowFirstPlace] = useState(false);

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
        .slice(0, 3) // Only show top 3
    : [];

  // Sequential reveal effect for podium
  useEffect(() => {
    if (liveQuizData?.participants && leaderboard.length > 0) {
      // Start sequential reveal
      const timer1 = setTimeout(() => setShowThirdPlace(true), 500);
      const timer2 = setTimeout(() => setShowSecondPlace(true), 1500);
      const timer3 = setTimeout(() => setShowFirstPlace(true), 2500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      // Reset reveal states
      setShowThirdPlace(false);
      setShowSecondPlace(false);
      setShowFirstPlace(false);
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

      {/* Podium - Center of screen */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="flex items-end justify-center space-x-4">
          {/* Third Place - Left */}
          {leaderboard[2] && showThirdPlace && (
            <div className="flex flex-col items-center animate-fade-in">
              <div className="bg-orange-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-2">
                3
              </div>
              <div className="bg-orange-400 rounded-t-3xl w-32 h-24 flex flex-col items-center justify-center text-white shadow-lg">
                <div className="text-lg font-bold">
                  {leaderboard[2].username}
                </div>
                <div className="text-2xl font-bold">
                  {leaderboard[2].totalScore}
                </div>
              </div>
            </div>
          )}

          {/* First Place - Center (highest) */}
          {leaderboard[0] && showFirstPlace && (
            <div className="flex flex-col items-center animate-fade-in">
              <div className="bg-yellow-500 text-white rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold mb-2">
                1
              </div>
              <div className="bg-yellow-400 rounded-t-3xl w-40 h-32 flex flex-col items-center justify-center text-white shadow-lg">
                <div className="text-xl font-bold">
                  {leaderboard[0].username}
                </div>
                <div className="text-3xl font-bold">
                  {leaderboard[0].totalScore}
                </div>
              </div>
            </div>
          )}

          {/* Second Place - Right */}
          {leaderboard[1] && showSecondPlace && (
            <div className="flex flex-col items-center animate-fade-in">
              <div className="bg-gray-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-2">
                2
              </div>
              <div className="bg-gray-400 rounded-t-3xl w-32 h-24 flex flex-col items-center justify-center text-white shadow-lg">
                <div className="text-lg font-bold">
                  {leaderboard[1].username}
                </div>
                <div className="text-2xl font-bold">
                  {leaderboard[1].totalScore}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional participants below podium */}
      {leaderboard.length > 3 && (
        <div className="absolute bottom-32 left-0 right-0 px-16">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-dark-royalty mb-4">
              Other Participants
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {leaderboard.slice(3).map((participant, index) => (
                <div
                  key={participant.username}
                  className="bg-gray-100 rounded-lg px-4 py-2 text-gray-700"
                >
                  <span className="font-medium">{index + 4}.</span>{" "}
                  {participant.username} - {participant.totalScore}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Thank you message */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-2xl text-deep-sea/70">Thanks for participating!</p>
      </div>
    </div>
  );
};

export default QuizResults;
