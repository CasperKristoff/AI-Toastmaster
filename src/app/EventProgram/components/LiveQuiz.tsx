"use client";

import React, { useState, useEffect } from "react";
import { EventSegment, Event } from "../../../types/event";
import { QRCodeSVG } from "qrcode.react";

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
  responses: Record<string, Record<string, string>>; // questionId -> guestId -> answerId
  scores: Record<string, number>; // guestId -> score
}

interface LiveQuizProps {
  segment: EventSegment;
  event?: Event; // Using Event type instead of any
  isEditMode?: boolean;
  isPresentation?: boolean;
  hideTitle?: boolean;
  onUpdate?: (updatedSegment: EventSegment) => void;
}

const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3"];
const ICONS = ["▲", "◆", "●", "■"];

export default function LiveQuiz({
  segment,
  event: _event,
  isEditMode = false,
  isPresentation = false,
  hideTitle: _hideTitle,
  onUpdate,
}: LiveQuizProps) {
  const [quizData, setQuizData] = useState<QuizData>(() => {
    const existingData = segment.data?.quizData as QuizData;
    if (existingData) {
      return existingData;
    }

    // Generate new quiz data
    const sessionCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    return {
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
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const currentQuestion = quizData.questions[quizData.currentQuestionIndex];

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

  const startQuiz = () => {
    setQuizStarted(true);
    // Automatically start the first question
    setQuizData((prev) => ({ ...prev, isActive: true }));
    setCurrentTime(currentQuestion.timeLimit);
    setIsTimerRunning(true);
    setShowResults(false);
  };

  const startQuestion = () => {
    setQuizData((prev) => ({ ...prev, isActive: true }));
    setCurrentTime(currentQuestion.timeLimit);
    setIsTimerRunning(true);
    setShowResults(false);
  };

  const handleOptionClick = (optionId: string) => {
    if (!isPresentation) return;

    // In presentation mode, this would be handled by guest responses
    console.log(`Guest selected option: ${optionId}`);
  };

  // Get QR code URL - using the QR code as the session code
  const getQRCodeURL = (): string => {
    // Get the local IP address or hostname from window.location
    const host =
      window.location.hostname === "localhost"
        ? window.location.hostname
        : window.location.host;
    const protocol = window.location.protocol;
    const port = window.location.port;

    // Construct the URL using the host's IP or domain
    return `${protocol}//${host}${port ? `:${port}` : ""}/quiz/${quizData.sessionCode}`;
  };

  const getResponseCount = () => {
    const questionId = currentQuestion.id;
    return Object.keys(quizData.responses[questionId] || {}).length;
  };

  const getOptionPercentage = (optionId: string) => {
    const questionId = currentQuestion.id;
    const responses = quizData.responses[questionId] || {};
    const totalResponses = Object.keys(responses).length;
    if (totalResponses === 0) return 0;

    const optionResponses = Object.values(responses).filter(
      (id) => id === optionId,
    ).length;
    return Math.round((optionResponses / totalResponses) * 100);
  };

  // Display mode for non-presentation (used in presentation mode)
  if (!isPresentation && !isEditMode) {
    return (
      <div className="fixed inset-0 w-full h-full">
        {/* QR Code and Join Instructions - Top Right */}
        <div className="fixed top-24 right-24 z-50 flex flex-col items-center">
          <div className="flex justify-center mb-2">
            <QRCodeSVG value={getQRCodeURL()} size={180} />
          </div>
          <div className="text-center">
            <div className="text-sm text-deep-sea/70">Join at:</div>
            <div className="font-mono text-sm font-medium text-black">
              {getQRCodeURL()}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full h-full flex flex-col">
          {!quizStarted ? (
            // Intro Slide
            <>
              {/* Quiz Title - Only show when quiz hasn't started */}
              <div className="text-center mb-8">
                <h1
                  className="text-7xl font-bold text-dark-royalty mb-8 leading-tight tracking-tight"
                  style={{
                    marginTop: "-15rem",
                    position: "absolute",
                    top: "35%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "100%",
                  }}
                >
                  Quiz Time!
                </h1>
              </div>
              {/* Start Button */}
              <div className="flex items-center justify-center h-full">
                <button
                  onClick={startQuiz}
                  className="px-12 py-6 bg-gradient-to-r from-dark-royalty to-deep-sea text-white rounded-xl text-2xl font-bold hover:from-dark-royalty/90 hover:to-deep-sea/90 transition-all duration-300 shadow-lg hover:scale-105"
                >
                  Start Quiz
                </button>
              </div>
            </>
          ) : (
            // Full Screen Quiz Question Slide
            <>
              {/* Question at Top */}
              <div
                className="w-full text-center"
                style={{ marginTop: "100px" }}
              >
                <h2 className="text-5xl font-bold text-dark-royalty leading-tight">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Timer and Response Count on Sides - Halfway Down */}
              <div
                className="flex justify-between items-center w-full px-16"
                style={{ marginTop: "400px" }}
              >
                {/* Timer - Left Side */}
                <div className="text-center">
                  <div className="bg-purple-500 text-white rounded-full w-24 h-24 flex items-center justify-center text-4xl font-bold">
                    {currentTime}
                  </div>
                  <p className="text-xl text-deep-sea/70 mt-3">Timer</p>
                </div>

                {/* Response Count - Right Side */}
                <div className="text-center">
                  <div className="bg-purple-500 text-white rounded-full w-24 h-24 flex items-center justify-center text-4xl font-bold">
                    {getResponseCount()}
                  </div>
                  <p className="text-xl text-deep-sea/70 mt-3">Answers</p>
                </div>
              </div>

              {/* Answer Options - Bottom of Screen */}
              <div
                className="grid grid-cols-2 gap-3 w-full px-8"
                style={{ marginTop: "100px" }}
              >
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionClick(option.id)}
                    className={`relative p-6 rounded-2xl text-white font-bold text-3xl transition-all duration-300 hover:scale-105 h-36 flex items-center justify-center shadow-lg ${
                      showResults && option.isCorrect
                        ? "ring-4 ring-green-400"
                        : ""
                    }`}
                    style={{
                      backgroundColor:
                        index === 0
                          ? "#dc2626" // red
                          : index === 1
                            ? "#1e3a8a" // blue
                            : index === 2
                              ? "#f59e0b" // gold/yellow
                              : "#22c55e", // green
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-4xl">
                        {index === 0
                          ? "▲" // triangle
                          : index === 1
                            ? "◆" // diamond
                            : index === 2
                              ? "●" // circle
                              : "■"}{" "}
                        {/* square */}
                      </span>
                      <span className="text-3xl font-bold">{option.text}</span>
                    </div>
                    {showResults && option.isCorrect && (
                      <div className="absolute top-4 right-4">
                        <div className="text-green-300 text-2xl">✓</div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const updateQuizData = (newData: Partial<QuizData>) => {
    const updatedData = { ...quizData, ...newData };
    setQuizData(updatedData);

    // Only auto-save if not in edit mode (for presentation mode)
    if (!isEditMode && onUpdate) {
      const updatedSegment = {
        ...segment,
        data: {
          ...segment.data,
          quizData: updatedData,
        },
      };
      onUpdate(updatedSegment);
    }
  };

  // Add new question
  const addQuestion = () => {
    const newQuestionId = (quizData.questions.length + 1).toString();
    const newQuestion: QuizQuestion = {
      id: newQuestionId,
      question: `Question ${newQuestionId}`,
      options: [
        {
          id: "a",
          text: "Option A",
          isCorrect: false,
          color: COLORS[0],
          icon: ICONS[0],
        },
        {
          id: "b",
          text: "Option B",
          isCorrect: true,
          color: COLORS[1],
          icon: ICONS[1],
        },
        {
          id: "c",
          text: "Option C",
          isCorrect: false,
          color: COLORS[2],
          icon: ICONS[2],
        },
        {
          id: "d",
          text: "Option D",
          isCorrect: false,
          color: COLORS[3],
          icon: ICONS[3],
        },
      ],
      timeLimit: 20,
      pointType: "standard" as const,
    };

    updateQuizData({
      questions: [...quizData.questions, newQuestion],
    });
  };

  // Remove question
  const removeQuestion = (index: number) => {
    if (quizData.questions.length > 1) {
      const newQuestions = quizData.questions.filter((_, i) => i !== index);
      updateQuizData({ questions: newQuestions });
    }
  };

  if (isPresentation) {
    return (
      <div
        className="w-full h-full"
        style={{
          background:
            "linear-gradient(135deg, rgba(240, 240, 255, 0.1), transparent, rgba(255, 240, 240, 0.1))",
        }}
      >
        {/* QR Code and Join Instructions - Top Right */}
        <div className="fixed top-24 right-24 z-50 flex flex-col items-center">
          <div className="flex justify-center mb-2">
            <QRCodeSVG value={getQRCodeURL()} size={180} />
          </div>
          <div className="text-center">
            <div className="text-sm text-deep-sea/70">Join at:</div>
            <div className="font-mono text-sm font-medium text-black">
              {getQRCodeURL()}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center h-full px-16">
          {!quizStarted ? (
            // Intro Slide
            <>
              {/* Start Button */}
              <div className="text-center">
                <button
                  onClick={startQuiz}
                  className="px-12 py-6 bg-gradient-to-r from-dark-royalty to-deep-sea text-white rounded-xl text-2xl font-bold hover:from-dark-royalty/90 hover:to-deep-sea/90 transition-all duration-300 shadow-lg hover:scale-105"
                >
                  Start Quiz
                </button>
              </div>
            </>
          ) : (
            // Quiz Question Slide
            <>
              {/* Timer and Response Count */}
              <div className="bg-white/30 backdrop-blur-sm rounded-3xl p-10 border-2 border-dark-royalty/20 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  {/* Timer - Left Side */}
                  <div className="text-center">
                    <div className="bg-purple-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold">
                      {currentTime}
                    </div>
                    <p className="text-sm text-deep-sea/70 mt-1">Timer</p>
                  </div>

                  {/* Response Count - Right Side */}
                  <div className="text-center">
                    <div className="bg-purple-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold">
                      {getResponseCount()}
                    </div>
                    <p className="text-sm text-deep-sea/70 mt-1">Answers</p>
                  </div>
                </div>

                {/* Question */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-dark-royalty text-center">
                    {currentQuestion.question}
                  </h2>
                </div>

                {/* Answer Options */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
                  {currentQuestion.options.map((option, _index) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(option.id)}
                      className={`relative p-4 rounded-xl text-white font-bold text-base transition-all duration-300 hover:scale-105 ${
                        showResults && option.isCorrect
                          ? "ring-4 ring-green-400 shadow-lg"
                          : ""
                      }`}
                      style={{ backgroundColor: option.color }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{option.icon}</span>
                          <span>{option.text}</span>
                        </div>
                        {showResults && (
                          <div className="text-right">
                            <div className="text-xs opacity-80">
                              {getOptionPercentage(option.id)}%
                            </div>
                            {option.isCorrect && (
                              <div className="text-green-300 text-lg">✓</div>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Controls */}
                <div className="text-center mt-6">
                  {!quizData.isActive && (
                    <button
                      onClick={startQuestion}
                      className="px-6 py-3 bg-gradient-to-r from-dark-royalty to-deep-sea text-white rounded-xl text-lg font-bold hover:from-dark-royalty/90 hover:to-deep-sea/90 transition-all duration-300 shadow-lg hover:scale-105"
                    >
                      Start Question
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10">
        <h3 className="text-xl font-bold text-dark-royalty mb-4">Quiz Setup</h3>

        {/* Question Navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-deep-sea/70">
              Questions ({quizData.questions.length})
            </label>
            <button
              onClick={addQuestion}
              className="px-4 py-2 bg-dark-royalty text-white rounded-lg hover:bg-dark-royalty/90 transition-all duration-300 text-sm font-medium"
            >
              + Add Question
            </button>
          </div>

          {/* Question Selector */}
          <div className="flex space-x-2 mb-4 overflow-x-auto">
            {quizData.questions.map((question, index) => (
              <button
                key={question.id}
                onClick={() => updateQuizData({ currentQuestionIndex: index })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  quizData.currentQuestionIndex === index
                    ? "bg-dark-royalty text-white"
                    : "bg-deep-sea/10 text-deep-sea/70 hover:bg-deep-sea/20"
                }`}
              >
                Q{index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Current Question */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-deep-sea/70">
              Question {quizData.currentQuestionIndex + 1}
            </label>
            {quizData.questions.length > 1 && (
              <button
                onClick={() => removeQuestion(quizData.currentQuestionIndex)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Remove Question
              </button>
            )}
          </div>
          <textarea
            value={currentQuestion.question}
            onChange={(e) => {
              const updatedQuestions = [...quizData.questions];
              updatedQuestions[quizData.currentQuestionIndex] = {
                ...currentQuestion,
                question: e.target.value,
              };
              updateQuizData({ questions: updatedQuestions });
            }}
            className="w-full px-4 py-3 border border-dark-royalty/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300 resize-none"
            rows={3}
            placeholder="Enter your quiz question..."
          />
        </div>

        {/* Answer Options */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-deep-sea/70 mb-2">
            Answer Options
          </label>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div key={option.id} className="flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: option.color }}
                >
                  {option.icon}
                </div>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => {
                    const updatedQuestions = [...quizData.questions];
                    updatedQuestions[quizData.currentQuestionIndex] = {
                      ...currentQuestion,
                      options: currentQuestion.options.map((opt, i) =>
                        i === index ? { ...opt, text: e.target.value } : opt,
                      ),
                    };
                    updateQuizData({ questions: updatedQuestions });
                  }}
                  className="flex-1 px-3 py-2 border border-dark-royalty/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
                  placeholder={`Option ${index + 1}`}
                />
                <input
                  type="radio"
                  name="correct"
                  checked={option.isCorrect}
                  onChange={() => {
                    const updatedQuestions = [...quizData.questions];
                    updatedQuestions[quizData.currentQuestionIndex] = {
                      ...currentQuestion,
                      options: currentQuestion.options.map((opt, i) => ({
                        ...opt,
                        isCorrect: i === index,
                      })),
                    };
                    updateQuizData({ questions: updatedQuestions });
                  }}
                  className="w-4 h-4 text-dark-royalty"
                />
                <span className="text-sm text-deep-sea/70">Correct</span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-deep-sea/70 mb-2">
              Time Limit (seconds)
            </label>
            <select
              value={currentQuestion.timeLimit}
              onChange={(e) => {
                const updatedQuestions = [...quizData.questions];
                updatedQuestions[quizData.currentQuestionIndex] = {
                  ...currentQuestion,
                  timeLimit: parseInt(e.target.value),
                };
                updateQuizData({ questions: updatedQuestions });
              }}
              className="w-full px-4 py-3 border border-dark-royalty/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
            >
              <option value={10}>10 seconds</option>
              <option value={20}>20 seconds</option>
              <option value={30}>30 seconds</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-sea/70 mb-2">
              Point Type
            </label>
            <select
              value={currentQuestion.pointType}
              onChange={(e) => {
                const updatedQuestions = [...quizData.questions];
                updatedQuestions[quizData.currentQuestionIndex] = {
                  ...currentQuestion,
                  pointType: e.target.value as "standard" | "double" | "none",
                };
                updateQuizData({ questions: updatedQuestions });
              }}
              className="w-full px-4 py-3 border border-dark-royalty/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
            >
              <option value="standard">Standard</option>
              <option value="double">Double Points</option>
              <option value="none">No Points</option>
            </select>
          </div>
        </div>

        {/* Session Code */}
        <div className="mt-6 p-4 bg-deep-sea/10 rounded-xl">
          <p className="text-sm text-deep-sea/70 mb-2">Session Code</p>
          <p className="text-xl font-bold text-dark-royalty">
            {quizData.sessionCode}
          </p>
        </div>

        {/* Save Button */}
        {isEditMode && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                if (onUpdate) {
                  const updatedSegment = {
                    ...segment,
                    data: {
                      ...segment.data,
                      quizData: quizData,
                    },
                  };
                  onUpdate(updatedSegment);
                }
              }}
              className="px-6 py-3 bg-gradient-to-r from-dark-royalty to-deep-sea text-white rounded-xl font-bold hover:from-dark-royalty/90 hover:to-deep-sea/90 transition-all duration-300 shadow-lg hover:scale-105"
            >
              Save Quiz & Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
