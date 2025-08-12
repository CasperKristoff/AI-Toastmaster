"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  quizService,
  QuizData,
  QuizQuestion,
} from "../../../services/quizService";

const QuizVotingPage: React.FC = () => {
  const params = useParams();
  const sessionCode = params.sessionCode as string;

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [participantId, setParticipantId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [hasJoined, setHasJoined] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [hasAnswered, setHasAnswered] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUsernameForm, setShowUsernameForm] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Use ref to avoid useEffect dependency issues
  const quizDataRef = useRef<QuizData | null>(null);

  // Generate participant ID on mount
  useEffect(() => {
    const id = Math.random().toString(36).substring(2, 15);
    setParticipantId(id);
  }, []);

  useEffect(() => {
    if (!sessionCode) {
      setError("No session code provided");
      setIsLoading(false);
      return;
    }

    // Get quiz data and subscribe to updates
    const loadQuiz = async () => {
      try {
        // Get initial quiz data
        const initialQuizData = await quizService.getQuiz(sessionCode);
        if (!initialQuizData) {
          setError("Quiz not found");
          setIsLoading(false);
          return;
        }

        setQuizData(initialQuizData);
        quizDataRef.current = initialQuizData;
        setIsLoading(false);

        // Subscribe to real-time updates
        console.log(
          "Mobile page: Subscribing to quiz updates for session:",
          sessionCode,
        );
        const unsubscribe = quizService.subscribeToQuiz(
          sessionCode,
          (updatedQuiz) => {
            console.log("Mobile page: Received quiz update:", updatedQuiz);
            console.log(
              "Mobile page: Previous quiz data:",
              quizDataRef.current,
            );
            if (updatedQuiz) {
              console.log("Mobile page: Updating quiz data with:", {
                isActive: updatedQuiz.isActive,
                currentQuestionIndex: updatedQuiz.currentQuestionIndex,
                showResults: updatedQuiz.showResults,
                isComplete: updatedQuiz.isComplete,
              });

              // CRITICAL: Only update if the new data is more complete or has important changes
              setQuizData((prevQuizData) => {
                if (!prevQuizData) {
                  // First time loading, accept all data
                  quizDataRef.current = updatedQuiz;
                  return updatedQuiz;
                }

                // Check if this is a meaningful update
                const isImportantUpdate =
                  updatedQuiz.isActive !== prevQuizData.isActive ||
                  updatedQuiz.currentQuestionIndex !==
                    prevQuizData.currentQuestionIndex ||
                  updatedQuiz.showResults !== prevQuizData.showResults ||
                  updatedQuiz.isComplete !== prevQuizData.isComplete ||
                  Object.keys(updatedQuiz.participants || {}).length !==
                    Object.keys(prevQuizData.participants || {}).length;

                // SAFETY CHECK: Prevent isActive from flipping back to false once it's true
                if (
                  prevQuizData.isActive &&
                  !updatedQuiz.isActive &&
                  !updatedQuiz.isComplete
                ) {
                  console.log(
                    "Mobile page: BLOCKING isActive flip from true to false (quiz not complete)",
                  );
                  return prevQuizData;
                }

                if (isImportantUpdate) {
                  console.log("Mobile page: Applying important update:", {
                    isActive: updatedQuiz.isActive,
                    currentQuestionIndex: updatedQuiz.currentQuestionIndex,
                    wasActive: prevQuizData.isActive,
                    wasCurrentQuestionIndex: prevQuizData.currentQuestionIndex,
                  });

                  // Reset selected option when moving to a new question
                  if (
                    updatedQuiz.currentQuestionIndex !==
                    prevQuizData.currentQuestionIndex
                  ) {
                    setSelectedOption("");
                  }

                  // Update ref with new data
                  quizDataRef.current = updatedQuiz;
                  return updatedQuiz;
                } else {
                  console.log("Mobile page: Skipping non-important update");
                  // Keep existing data but update participants if needed
                  return {
                    ...prevQuizData,
                    participants:
                      updatedQuiz.participants || prevQuizData.participants,
                  };
                }
              });
            } else {
              console.log("Mobile page: Received null quiz update");
            }
          },
        );

        return unsubscribe;
      } catch {
        setError("Failed to load quiz");
        setIsLoading(false);
      }
    };

    const unsubscribe = loadQuiz();
    return () => {
      unsubscribe?.then((unsub) => unsub?.());
    };
  }, [sessionCode]);

  const handleJoinQuiz = async () => {
    if (!username.trim() || !participantId) return;

    try {
      console.log("Mobile page: Joining quiz with:", {
        sessionCode,
        participantId,
        username: username.trim(),
      });

      const success = await quizService.joinQuiz(
        sessionCode,
        participantId,
        username.trim(),
      );

      if (success) {
        console.log("Mobile page: Successfully joined quiz");

        // Add participant to local quiz data immediately
        if (quizData) {
          setQuizData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              participants: {
                ...prev.participants,
                [participantId]: {
                  username: username.trim(),
                  responses: {},
                  scores: {},
                  totalScore: 0,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  joinedAt: new Date() as any,
                },
              },
            };
          });
        }

        setHasJoined(true);
        setShowUsernameForm(false);
        setError(null);
      } else {
        console.error("Mobile page: Failed to join quiz");
        setError("Failed to join quiz. Please try again.");
      }
    } catch (error) {
      console.error("Mobile page: Error joining quiz:", error);
      setError("Failed to join quiz");
    }
  };

  const handleOptionSelect = async (optionId: string) => {
    if (!hasJoined || !currentQuestion || !quizData) {
      console.error("Mobile page: Prerequisites not met:", {
        hasJoined,
        currentQuestion: !!currentQuestion,
        quizData: !!quizData,
      });
      return;
    }

    const questionId = currentQuestion.id;
    if (hasAnswered[questionId]) {
      console.log("Mobile page: Already answered this question:", questionId);
      return;
    }

    // Set selected option for visual feedback
    setSelectedOption(optionId);

    // SIMPLE, DIRECT SUBMISSION - Let's test this first
    setTimeout(async () => {
      try {
        console.log(
          "Mobile page: SIMPLE TEST - Attempting direct submission:",
          {
            sessionCode,
            participantId,
            questionId,
            optionId,
            quizDataExists: !!quizData,
            participantExists: !!quizData.participants?.[participantId],
            currentQuestionIndex: quizData.currentQuestionIndex,
          },
        );

        // Simple, direct submission
        const success = await quizService.submitAnswer(
          sessionCode,
          participantId,
          questionId,
          optionId,
        );

        if (success) {
          console.log("Mobile page: SIMPLE TEST - Submission succeeded!");
          setHasAnswered((prev) => ({ ...prev, [questionId]: true }));
          setSelectedOption("");
          setSubmitError(null);
        } else {
          console.error("Mobile page: SIMPLE TEST - Submission failed");
          setSubmitError(
            "Submission failed. Please rejoin the quiz and try again.",
          );
        }
      } catch (error) {
        console.error(
          "Mobile page: SIMPLE TEST - Error during submission:",
          error,
        );
        setSubmitError("Network error. Please check your connection.");
      }
    }, 300);
  };

  const currentQuestion: QuizQuestion | null =
    quizData?.questions?.[quizData.currentQuestionIndex] || null;

  // Reset answer state when moving to a new question
  useEffect(() => {
    if (quizData && currentQuestion) {
      const questionId = currentQuestion.id;
      if (!hasAnswered[questionId]) {
        setSelectedOption("");
      }
    }
  }, [
    quizData?.currentQuestionIndex,
    currentQuestion?.id,
    hasAnswered,
    quizData,
    currentQuestion,
  ]);

  const participant = hasJoined && quizData?.participants?.[participantId];

  // Debug logging
  console.log("Mobile page state:", {
    hasJoined,
    isActive: quizData?.isActive,
    currentQuestionIndex: quizData?.currentQuestionIndex,
    currentQuestion: currentQuestion?.question,
    showUsernameForm,
    isComplete: quizData?.isComplete,
    participantCount: quizData?.participants
      ? Object.keys(quizData.participants).length
      : 0,
    sessionCode,
    quizDataSessionCode: quizData?.sessionCode,
    quizDataKeys: quizData ? Object.keys(quizData) : [],
    quizDataIsActive: quizData?.isActive,
    quizDataCurrentQuestionIndex: quizData?.currentQuestionIndex,
  });

  // CRITICAL: Log the exact condition check
  console.log("CRITICAL CHECK:", {
    hasJoined,
    quizDataExists: !!quizData,
    quizDataIsActive: quizData?.isActive,
    shouldShowWaiting: hasJoined && quizData && !quizData.isActive,
    shouldShowActive: quizData && quizData.isActive,
    currentQuestionExists: !!currentQuestion,
    questionsLength: quizData?.questions?.length,
    currentQuestionIndex: quizData?.currentQuestionIndex,
    quizDataKeys: quizData ? Object.keys(quizData) : [],
    quizDataValues: quizData
      ? {
          isActive: quizData.isActive,
          currentQuestionIndex: quizData.currentQuestionIndex,
          showResults: quizData.showResults,
          isComplete: quizData.isComplete,
          participantsCount: Object.keys(quizData.participants || {}).length,
        }
      : null,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-royalty/10 via-deep-sea/5 to-kimchi/10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🧠</div>
          <div className="text-xl font-bold text-dark-royalty">
            Loading quiz...
          </div>
        </div>
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-royalty/10 via-deep-sea/5 to-kimchi/10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-xl font-bold text-dark-royalty">
            {error || "Quiz not found"}
          </div>
          <div className="text-deep-sea/60 mt-2">
            The quiz you&apos;re looking for doesn&apos;t exist or has expired.
          </div>
        </div>
      </div>
    );
  }

  // Show username form
  if (showUsernameForm && !hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-royalty/10 via-deep-sea/5 to-kimchi/10 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🧠</div>
            <h1
              className="text-2xl font-bold text-dark-royalty mb-2"
              style={{ marginTop: "-75px" }}
            >
              {quizData.title}
            </h1>
          </div>

          {/* Username Form */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10 mb-6">
            <h2 className="text-xl font-bold text-dark-royalty text-center mb-4">
              Enter your name to join
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your name"
                className="w-full p-4 rounded-xl border-2 border-dark-royalty/20 focus:border-dark-royalty focus:outline-none text-dark-royalty"
                onKeyPress={(e) => e.key === "Enter" && handleJoinQuiz()}
              />

              <button
                onClick={handleJoinQuiz}
                disabled={!username.trim()}
                className="w-full px-6 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Quiz
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-deep-sea/60">
            Powered by AI Toastmaster
          </div>
        </div>
      </div>
    );
  }

  // Check if we're on the last question and should show QuizResults
  if (
    quizData.currentQuestionIndex + 1 >= quizData.questions.length &&
    quizData.showResults
  ) {
    // Show a message that results are being displayed on the host side
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-royalty/10 via-deep-sea/5 to-kimchi/10 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-2xl font-bold text-dark-royalty mb-2">
              Quiz Results Available!
            </h1>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10 mb-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-dark-royalty mb-4">
                Final Results
              </h2>
              <div className="text-lg text-deep-sea/70 mb-4">
                The host is now showing the final results with the podium and
                top 3 players!
              </div>
              <div className="text-sm text-deep-sea/60">
                Check the presentation screen for the complete results.
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-deep-sea/60">
            Thanks for participating!
          </div>
        </div>
      </div>
    );
  }

  // Check if quiz is actually complete (this should rarely happen now)
  if (quizData.isComplete) {
    // Calculate participant position for regular completion
    let position = "N/A";
    let positionEmoji = "🏆";

    if (participant && quizData.participants) {
      const leaderboard = Object.entries(quizData.participants)
        .map(([_id, p]) => ({
          username: p.username,
          totalScore: p.totalScore,
        }))
        .sort((a, b) => b.totalScore - a.totalScore);

      const participantIndex = leaderboard.findIndex(
        (p) => p.username === participant.username,
      );
      if (participantIndex !== -1) {
        const actualPosition = participantIndex + 1;
        position = actualPosition.toString();

        // Set position emoji
        if (actualPosition === 1) {
          positionEmoji = "🥇";
        } else if (actualPosition === 2) {
          positionEmoji = "🥈";
        } else if (actualPosition === 3) {
          positionEmoji = "🥉";
        } else {
          positionEmoji = "🏆";
        }
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-royalty/10 via-deep-sea/5 to-kimchi/10 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">{positionEmoji}</div>
            <h1 className="text-2xl font-bold text-dark-royalty mb-2">
              Quiz Complete!
            </h1>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10 mb-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-dark-royalty mb-4">
                Your Final Score
              </h2>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {participant ? participant.totalScore : 0}
              </div>
              <div className="text-sm text-deep-sea/60">points</div>

              {/* Position Display */}
              <div className="mt-4 pt-4 border-t border-dark-royalty/10">
                <h3 className="text-lg font-bold text-dark-royalty mb-2">
                  Your Position
                </h3>
                <div className="text-3xl font-bold text-dark-royalty">
                  {position}
                </div>
                <div className="text-sm text-deep-sea/60">
                  {position === "1"
                    ? "st"
                    : position === "2"
                      ? "nd"
                      : position === "3"
                        ? "rd"
                        : "th"}{" "}
                  place
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-deep-sea/60">
            Check the presentation for final results!
          </div>
        </div>
      </div>
    );
  }

  // Waiting for quiz to start
  if (hasJoined && quizData && !quizData.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-royalty/10 via-deep-sea/5 to-kimchi/10 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-dark-royalty mb-2">
              Waiting for quiz to start...
            </h1>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10 mb-6">
            <div className="text-center">
              <h2 className="text-lg font-bold text-dark-royalty mb-2">
                Welcome, {username}!
              </h2>
              <div className="text-deep-sea/60">
                You&apos;ve successfully joined the quiz. Please wait for the
                host to start.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active quiz
  if (
    quizData &&
    quizData.isActive &&
    quizData.questions &&
    quizData.questions.length > 0
  ) {
    return (
      <div className="fixed inset-0 overflow-hidden overscroll-none touch-manipulation">
        {/* Alternatives */}
        {currentQuestion && (
          <>
            {!hasAnswered[currentQuestion.id] ? (
              <div className="absolute inset-0 p-3 pb-24">
                <div className="grid grid-cols-2 gap-3 h-full">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option.id)}
                      className={`relative rounded-2xl transition-all duration-300 flex items-center justify-center ${
                        selectedOption === option.id
                          ? "ring-4 ring-white shadow-2xl scale-105"
                          : "hover:scale-102 hover:shadow-xl"
                      }`}
                      style={{ backgroundColor: option.color }}
                    >
                      {/* Only show color, no text */}
                      {selectedOption === option.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-dark-royalty rounded-full"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 p-3 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-6">✅</div>
                  <h2 className="text-2xl font-bold text-dark-royalty mb-3">
                    Answer submitted!
                  </h2>
                  <div className="text-lg text-deep-sea/70">
                    Waiting for the next question...
                  </div>
                  <div className="mt-4 text-sm text-deep-sea/50">
                    You&apos;ll get points if you answered correctly!
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Score - bottom right with safe area */}
        <div
          className="absolute bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg"
          style={{
            right: "calc(env(safe-area-inset-right, 0px) + 16px)",
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
          }}
        >
          <div className="text-center">
            <div className="text-lg font-bold text-dark-royalty">
              {participant ? participant.totalScore : 0}
            </div>
            <div className="text-xs text-deep-sea/60">points</div>
          </div>
        </div>

        {/* Submit error toast */}
        {submitError && (
          <div
            className="absolute left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)" }}
          >
            {submitError}
          </div>
        )}
      </div>
    );
  }

  // Fallback: Show error or loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-royalty/10 via-deep-sea/5 to-kimchi/10 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">❓</div>
        <div className="text-xl font-bold text-dark-royalty">
          Quiz state not recognized
        </div>
        <div className="text-deep-sea/60 mt-2">
          Please check the console for debugging information.
        </div>
      </div>
    </div>
  );
};

export default QuizVotingPage;
