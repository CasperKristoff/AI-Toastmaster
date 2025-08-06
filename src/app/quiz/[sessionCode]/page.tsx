"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface QuizQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    color: string;
    icon: string;
  }[];
  timeLimit: number;
  pointType: "standard" | "double" | "none";
  media?: string;
}

interface QuizData {
  sessionCode: string;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  isActive: boolean;
  responses: Record<string, Record<string, string>>;
  scores: Record<string, number>;
}

const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3"];
const ICONS = ["▲", "◆", "●", "■"];

export default function QuizParticipationPage() {
  const params = useParams();
  const sessionCode = params.sessionCode as string;

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [isJoined, setIsJoined] = useState(false);

  // Mock quiz data for demonstration
  useEffect(() => {
    // In a real app, this would fetch from your backend
    const mockQuizData: QuizData = {
      sessionCode,
      questions: [
        {
          id: "1",
          question: "How many counties are there in Norway?",
          options: [
            {
              id: "a",
              text: "10",
              isCorrect: false,
              color: COLORS[0],
              icon: ICONS[0],
            },
            {
              id: "b",
              text: "15",
              isCorrect: true,
              color: COLORS[1],
              icon: ICONS[1],
            },
            {
              id: "c",
              text: "13",
              isCorrect: false,
              color: COLORS[2],
              icon: ICONS[2],
            },
            {
              id: "d",
              text: "22",
              isCorrect: false,
              color: COLORS[3],
              icon: ICONS[3],
            },
          ],
          timeLimit: 20,
          pointType: "standard" as const,
        },
      ],
      currentQuestionIndex: 0,
      isActive: false,
      responses: {},
      scores: {},
    };
    setQuizData(mockQuizData);
  }, [sessionCode]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && currentTime > 0) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setShowResults(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, currentTime]);

  const handleJoin = () => {
    if (guestName.trim()) {
      setIsJoined(true);
    }
  };

  const handleAnswerSelect = (optionId: string) => {
    if (!isTimerRunning || selectedAnswer) return;

    setSelectedAnswer(optionId);
    // In a real app, this would send the answer to the backend
    console.log(`Guest ${guestName} selected: ${optionId}`);
  };

  if (!quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-2xl font-bold text-dark-royalty mb-2">
            Loading Quiz...
          </h1>
          <p className="text-deep-sea/70">
            Please wait while we set up your quiz.
          </p>
        </div>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-3xl font-bold text-dark-royalty mb-2">
              Join Live Quiz
            </h1>
            <p className="text-deep-sea/70">Enter your name to participate</p>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10">
            <div className="mb-4">
              <label className="block text-sm font-medium text-deep-sea/70 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-4 py-3 border border-dark-royalty/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
                placeholder="Enter your name..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleJoin();
                  }
                }}
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={!guestName.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-dark-royalty to-deep-sea text-white rounded-xl font-bold hover:from-dark-royalty/90 hover:to-deep-sea/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Quiz
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-deep-sea/50">
              Session Code: {sessionCode}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quizData.questions[quizData.currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark-royalty mb-4">
            Live Quiz
          </h1>
          <div className="flex justify-center space-x-8">
            <div className="bg-purple-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold">
              {currentTime}
            </div>
            <div className="bg-purple-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold">
              {
                Object.keys(quizData.responses[currentQuestion?.id] || {})
                  .length
              }
            </div>
          </div>
          <p className="text-sm text-deep-sea/70 mt-2">Answers</p>
        </div>

        {/* Question */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-dark-royalty/10">
          <h2 className="text-xl font-bold text-dark-royalty text-center">
            {currentQuestion?.question}
          </h2>
        </div>

        {/* Answer Options */}
        <div className="grid grid-cols-2 gap-4">
          {currentQuestion?.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleAnswerSelect(option.id)}
              disabled={selectedAnswer !== null || !isTimerRunning}
              className={`relative p-4 rounded-xl text-white font-bold transition-all duration-300 ${
                selectedAnswer === option.id
                  ? "ring-4 ring-white shadow-lg scale-105"
                  : "hover:scale-105"
              } ${
                selectedAnswer !== null && selectedAnswer !== option.id
                  ? "opacity-50"
                  : ""
              }`}
              style={{ backgroundColor: option.color }}
            >
              <div className="flex items-center justify-center space-x-3">
                <span className="text-xl">{option.icon}</span>
                <span>{option.text}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="text-center mt-8">
          {!isTimerRunning && !showResults && (
            <div className="text-deep-sea/70">
              Waiting for the quiz to start...
            </div>
          )}
          {selectedAnswer && (
            <div className="text-green-600 font-bold">Answer submitted!</div>
          )}
          {showResults && (
            <div className="text-deep-sea/70">
              Quiz completed! Check the main screen for results.
            </div>
          )}
        </div>

        {/* Guest Info */}
        <div className="text-center mt-4">
          <p className="text-sm text-deep-sea/50">Joined as: {guestName}</p>
        </div>
      </div>
    </div>
  );
}
