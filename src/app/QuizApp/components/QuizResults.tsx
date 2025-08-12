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

  // Get all participants sorted by score
  const allParticipants = liveQuizData?.participants
    ? Object.entries(liveQuizData.participants)
        .map(([_id, participant]) => ({
          username: participant.username, // This is the actual name entered by mobile user
          responses: participant.responses,
          scores: participant.scores,
          totalScore: participant.totalScore,
          joinedAt: participant.joinedAt,
        }))
        .sort((a, b) => b.totalScore - a.totalScore)
    : [];

  // Get top 3 for podium (always create 3 slots, some may be empty)
  const podiumParticipants = [
    allParticipants[0] || null, // 1st place
    allParticipants[1] || null, // 2nd place
    allParticipants[2] || null, // 3rd place
  ];

  // Get remaining participants for the list below podium
  const remainingParticipants = allParticipants.slice(3);

  // Sequential reveal effect for podium
  useEffect(() => {
    // Always show reveal animation, even for empty slots
    const timer1 = setTimeout(() => setShowThirdPlace(true), 500);
    const timer2 = setTimeout(() => setShowSecondPlace(true), 1200);
    const timer3 = setTimeout(() => setShowFirstPlace(true), 1900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [liveQuizData?.participants]);

  // If no participants, show empty state
  if (
    !liveQuizData?.participants ||
    Object.keys(liveQuizData.participants).length === 0
  ) {
    return (
      <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-8xl mb-6">🏁</div>
          <h2 className="text-5xl font-bold text-dark-royalty mb-4">
            Quiz Complete!
          </h2>
          <p className="text-xl text-slate-600">
            No participants joined this quiz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="absolute top-8 left-0 right-0 px-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-dark-royalty mb-2">
            🏆 Quiz Results
          </h1>
          <p className="text-lg text-slate-600">
            {allParticipants.length} participant
            {allParticipants.length !== 1 ? "s" : ""} competed
          </p>
        </div>
      </div>

      {/* Podium - Center of screen with consistent layout */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="flex items-end justify-center gap-6">
          {/* Second Place - Left */}
          <div
            className={`flex flex-col items-center transition-all duration-700 ${showSecondPlace ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="mb-3">
              <div className="w-14 h-14 bg-slate-400 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                2
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-36 h-28 flex flex-col items-center justify-center p-4">
              {podiumParticipants[1] ? (
                <>
                  <div className="text-sm font-semibold text-slate-600 mb-1 text-center truncate w-full">
                    {podiumParticipants[1].username}
                  </div>
                  <div className="text-2xl font-bold text-slate-800">
                    {podiumParticipants[1].totalScore}
                  </div>
                  <div className="text-xs text-slate-500">points</div>
                </>
              ) : (
                <div className="text-slate-400 text-center">
                  <div className="text-sm font-medium">No participant</div>
                </div>
              )}
            </div>
          </div>

          {/* First Place - Center (highest) */}
          <div
            className={`flex flex-col items-center transition-all duration-700 ${showFirstPlace ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="mb-3">
              <div className="w-16 h-16 bg-yellow-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                1
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl border border-yellow-200 w-40 h-36 flex flex-col items-center justify-center p-4">
              {podiumParticipants[0] ? (
                <>
                  <div className="text-base font-semibold text-slate-700 mb-2 text-center truncate w-full">
                    {podiumParticipants[0].username}
                  </div>
                  <div className="text-3xl font-bold text-yellow-600">
                    {podiumParticipants[0].totalScore}
                  </div>
                  <div className="text-xs text-slate-500">points</div>
                </>
              ) : (
                <div className="text-slate-400 text-center">
                  <div className="text-sm font-medium">No participant</div>
                </div>
              )}
            </div>
          </div>

          {/* Third Place - Right */}
          <div
            className={`flex flex-col items-center transition-all duration-700 ${showThirdPlace ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="mb-3">
              <div className="w-14 h-14 bg-amber-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                3
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-36 h-28 flex flex-col items-center justify-center p-4">
              {podiumParticipants[2] ? (
                <>
                  <div className="text-sm font-semibold text-slate-600 mb-1 text-center truncate w-full">
                    {podiumParticipants[2].username}
                  </div>
                  <div className="text-2xl font-bold text-slate-800">
                    {podiumParticipants[2].totalScore}
                  </div>
                  <div className="text-xs text-slate-500">points</div>
                </>
              ) : (
                <div className="text-slate-400 text-center">
                  <div className="text-sm font-medium">No participant</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional participants below podium */}
      {remainingParticipants.length > 0 && (
        <div className="absolute bottom-24 left-0 right-0 px-8">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold text-slate-700 mb-4 text-center">
              Other Participants
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {remainingParticipants.map((participant, index) => (
                <div
                  key={participant.username}
                  className="bg-white rounded-lg shadow-sm border border-slate-200 px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                      {index + 4}
                    </div>
                    <span className="font-medium text-slate-700 truncate">
                      {participant.username}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-slate-800">
                    {participant.totalScore}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Thank you message */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-lg text-slate-500">Thanks for participating! 🎉</p>
      </div>
    </div>
  );
};

export default QuizResults;
