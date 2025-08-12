"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { EventSegment, Event } from "../../../types/event";
import {
  quizService,
  QuizData,
  QuizQuestion,
} from "../../../services/quizService";
import QuizResults from "./QuizResults";

interface QuizPresentationProps {
  segment: EventSegment;
  event?: Event;
  onQuizComplete?: () => void;
}

const COLORS = ["#E53E3E", "#3182CE", "#D69E2E", "#38A169"]; // Bright red, blue, yellow, green
const ICONS = ["▲", "◆", "●", "■"];

function QuizPresentation({
  segment,
  event: _event,
  onQuizComplete,
}: QuizPresentationProps) {
  console.log("QuizPresentation: received segment:", segment);
  console.log("QuizPresentation: segment.data:", segment.data);
  console.log(
    "QuizPresentation: segment.data?.quizData:",
    segment.data?.quizData,
  );

  const [quizData, setQuizData] = useState<QuizData>(() => {
    const existingData = segment.data?.quizData as Partial<QuizData>;
    if (
      existingData &&
      existingData.questions &&
      existingData.questions.length > 0
    ) {
      console.log(
        "QuizPresentation: initializing with existing data from segment",
      );
      // Ensure we start at the first question with all required properties
      return {
        sessionCode:
          existingData.sessionCode ||
          Math.random().toString(36).substring(2, 8).toUpperCase(),
        title: existingData.title || "Live Quiz",
        questions: existingData.questions,
        currentQuestionIndex: 0,
        isActive: false,
        showResults: false,
        participants: {},
        responses: {},
        isComplete: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createdAt: new Date() as unknown as any, // Will be replaced by service
      };
    }

    console.log("QuizPresentation: initializing with sample data");
    // Generate sample quiz data with the exact same structure as QuizEditor
    const sessionCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    console.log(
      "QuizPresentation: Generated sample session code:",
      sessionCode,
    );
    return {
      sessionCode,
      title: "Sample Quiz",
      questions: [
        {
          id: "sample-1",
          question: "Hvor gammel er jeg?",
          options: [
            {
              id: "a",
              text: "Trondheim",
              isCorrect: false,
              color: COLORS[0],
              icon: ICONS[0],
            },
            {
              id: "b",
              text: "Boston",
              isCorrect: true,
              color: COLORS[1],
              icon: ICONS[1],
            },
            {
              id: "c",
              text: "Oslo",
              isCorrect: false,
              color: COLORS[2],
              icon: ICONS[2],
            },
            {
              id: "d",
              text: "Gjøvik",
              isCorrect: false,
              color: COLORS[3],
              icon: ICONS[3],
            },
          ],
          timeLimit: 30,
          pointType: "standard",
          media: {
            url: "https://via.placeholder.com/400x250/f0f0f0/666?text=Sample+Image",
            type: "image",
          },
        },
        {
          id: "sample-2",
          question: "What is the capital of Norway?",
          options: [
            {
              id: "a",
              text: "Bergen",
              isCorrect: false,
              color: COLORS[0],
              icon: ICONS[0],
            },
            {
              id: "b",
              text: "Oslo",
              isCorrect: true,
              color: COLORS[1],
              icon: ICONS[1],
            },
          ],
          timeLimit: 20,
          pointType: "standard",
          media: {
            url: "https://via.placeholder.com/400x250/3182CE/ffffff?text=Norway+Map",
            type: "image",
          },
        },
        {
          id: "sample-3",
          question: "Which programming language is this?",
          options: [
            {
              id: "a",
              text: "JavaScript",
              isCorrect: false,
              color: COLORS[0],
              icon: ICONS[0],
            },
            {
              id: "b",
              text: "Python",
              isCorrect: false,
              color: COLORS[1],
              icon: ICONS[1],
            },
            {
              id: "c",
              text: "TypeScript",
              isCorrect: true,
              color: COLORS[2],
              icon: ICONS[2],
            },
          ],
          timeLimit: 25,
          pointType: "double",
          media: {
            url: "https://via.placeholder.com/400x250/D69E2E/ffffff?text=Code+Example",
            type: "image",
          },
        },
      ],
      currentQuestionIndex: 0,
      isActive: false,
      showResults: false,
      participants: {},
      responses: {},
      isComplete: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createdAt: new Date() as unknown as any, // Will be replaced by service
    };
  });

  const updateQuizData = useCallback(
    (newData: Partial<QuizData>) => {
      const updatedData = { ...quizData, ...newData };
      setQuizData(updatedData);
    },
    [quizData],
  );

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [liveQuizData, setLiveQuizData] = useState<QuizData | null>(null);
  const [isQuizInitialized, setIsQuizInitialized] = useState(false);

  // SIMPLIFIED: Single state to control QuizResults rendering
  const [shouldShowQuizResults, setShouldShowQuizResults] = useState(false);

  const currentQuestion: QuizQuestion | null =
    quizData.questions[quizData.currentQuestionIndex] || null;

  // Auto-answer for participants who haven't answered the current question
  const autoAnswerForMissingParticipants = useCallback(async () => {
    if (
      !quizData?.sessionCode ||
      !currentQuestion ||
      !liveQuizData?.participants
    )
      return;

    const currentQuestionId = currentQuestion.id;
    const participants = liveQuizData.participants;

    console.log("QuizPresentation: Auto-answering for missing participants:", {
      questionId: currentQuestionId,
      totalParticipants: Object.keys(participants).length,
    });

    // Find participants who haven't answered this question
    const missingParticipants = Object.entries(participants).filter(
      ([_participantId, participant]) => {
        return !participant.responses[currentQuestionId];
      },
    );

    console.log(
      "QuizPresentation: Missing participants:",
      missingParticipants.length,
    );

    // Auto-answer with wrong option for each missing participant
    for (const [participantId, participant] of missingParticipants) {
      try {
        // Find a wrong option (not the correct one)
        const wrongOption = currentQuestion.options.find(
          (option) => !option.isCorrect,
        );
        if (wrongOption) {
          console.log(
            `QuizPresentation: Auto-answering for ${participant.username} with option: ${wrongOption.text}`,
          );

          await quizService.submitAnswer(
            quizData.sessionCode,
            participantId,
            currentQuestionId,
            wrongOption.id,
          );
        }
      } catch (error) {
        console.error(
          `QuizPresentation: Error auto-answering for ${participant.username}:`,
          error,
        );
      }
    }
  }, [quizData?.sessionCode, currentQuestion, liveQuizData?.participants]);

  // Initialize quiz in Firestore and subscribe to updates
  useEffect(() => {
    const existingData = segment.data?.quizData as QuizData;
    if (
      existingData &&
      existingData.questions &&
      existingData.questions.length > 0
    ) {
      // Ensure we start at the first question
      const initializedData = {
        ...existingData,
        currentQuestionIndex: 0,
        isActive: false,
        showResults: false,
        participants: {},
        responses: {},
        isComplete: false,
      };
      setQuizData(initializedData);

      // Reset QuizResults state
      setShouldShowQuizResults(false);

      // Initialize quiz in Firestore if not already done
      if (!isQuizInitialized) {
        const liveQuizDataForService = {
          sessionCode: existingData.sessionCode,
          title: segment.title || "Live Quiz",
          questions: existingData.questions,
          currentQuestionIndex: 0,
          isActive: false,
          showResults: false,
          participants: {},
          responses: {},
          isComplete: false,
        };

        console.log(
          "QuizPresentation: Creating quiz in Firestore:",
          liveQuizDataForService,
        );

        quizService
          .createQuiz(liveQuizDataForService)
          .then(() => {
            setIsQuizInitialized(true);
            console.log(
              "QuizPresentation: Quiz created successfully, subscribing to updates",
            );

            // Subscribe to live updates
            const unsubscribe = quizService.subscribeToQuiz(
              existingData.sessionCode, // Use session code from segment data
              (updatedQuiz) => {
                if (updatedQuiz) {
                  console.log(
                    "QuizPresentation: Received quiz update:",
                    updatedQuiz,
                  );
                  setLiveQuizData(updatedQuiz);

                  // Update local quiz data with live data
                  setQuizData((prev) => ({
                    ...prev,
                    currentQuestionIndex: updatedQuiz.currentQuestionIndex,
                    isActive: updatedQuiz.isActive,
                    showResults: updatedQuiz.showResults,
                    isComplete: updatedQuiz.isComplete,
                  }));

                  // Don't sync QuizResults state with Firebase isComplete
                  // QuizResults should only show when explicitly requested via showFinalResults
                  // This prevents mobile page from triggering completion state
                }
              },
            );

            return () => unsubscribe();
          })
          .catch((error) => {
            console.error("QuizPresentation: Error creating quiz:", error);
          });
      }
    }
  }, [segment, isQuizInitialized]);

  // SIMPLIFIED: Toggle results for current question only
  const toggleResults = useCallback(async () => {
    if (!quizData?.sessionCode) return;

    const newShowResults = !quizData.showResults;
    console.log("QuizPresentation: Toggling results to:", newShowResults);

    // Update local state immediately
    updateQuizData({ showResults: newShowResults });

    // If showing results, auto-answer for participants who haven't answered
    if (newShowResults && liveQuizData?.participants) {
      await autoAnswerForMissingParticipants();
    }

    // Update Firebase
    await quizService.showResults(quizData.sessionCode, newShowResults);
  }, [
    quizData?.sessionCode,
    quizData.showResults,
    liveQuizData?.participants,
    autoAnswerForMissingParticipants,
    updateQuizData,
  ]);

  // Timer effect and auto-show results when all participants have answered
  useEffect(() => {
    if (!currentQuestion) return;

    // Start timer when question changes or when going to next question
    setTimeLeft(currentQuestion.timeLimit);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-show results when timer runs out
          if (!quizData.showResults) {
            toggleResults();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    currentQuestion?.id,
    currentQuestion?.timeLimit,
    currentQuestion,
    quizData.showResults,
    toggleResults,
  ]); // Timer resets when question changes

  // Auto-show results when all participants have answered
  useEffect(() => {
    if (!currentQuestion || !liveQuizData?.participants || quizData.showResults)
      return;

    const currentQuestionId = currentQuestion.id;
    const participants = liveQuizData.participants;
    const totalParticipants = Object.keys(participants).length;

    if (totalParticipants === 0) return;

    // Count how many participants have answered this question
    const answeredCount = Object.values(participants).filter(
      (participant) => participant.responses[currentQuestionId],
    ).length;

    console.log("QuizPresentation: Checking auto-show results:", {
      questionId: currentQuestionId,
      answeredCount,
      totalParticipants,
      shouldShow: answeredCount === totalParticipants,
    });

    // If all participants have answered, automatically show results
    if (answeredCount === totalParticipants && answeredCount > 0) {
      console.log(
        "QuizPresentation: All participants answered, auto-showing results",
      );
      toggleResults();
    }
  }, [
    currentQuestion,
    liveQuizData?.participants,
    quizData.showResults,
    toggleResults,
  ]);

  const goToNextQuestion = useCallback(async () => {
    if (!quizData?.sessionCode) return;

    const nextIndex = quizData.currentQuestionIndex + 1;
    console.log(
      `QuizPresentation: Moving from question ${quizData.currentQuestionIndex + 1} to ${nextIndex + 1} of ${quizData.questions.length}`,
    );

    if (nextIndex >= quizData.questions.length) {
      console.log(
        "QuizPresentation: Reached last question - don't auto-complete",
      );
      // Don't auto-complete the quiz when reaching the last question
      // Let the user explicitly click "Show Results" to see QuizResults
      if (onQuizComplete) {
        onQuizComplete();
      }
    } else {
      console.log(
        `QuizPresentation: Setting currentQuestionIndex to ${nextIndex}`,
      );

      // Update the quiz to the next question
      await quizService.updateQuiz(quizData.sessionCode, {
        currentQuestionIndex: nextIndex,
        isActive: true,
        showResults: false,
      });

      // Update local state
      updateQuizData({
        currentQuestionIndex: nextIndex,
        showResults: false,
      });
    }
  }, [
    quizData?.sessionCode,
    quizData.currentQuestionIndex,
    quizData.questions.length,
    onQuizComplete,
    updateQuizData,
  ]);

  // SIMPLIFIED: Show QuizResults function
  const showFinalResults = useCallback(async () => {
    if (!quizData?.sessionCode) return;

    console.log("QuizPresentation: Show Final Results clicked");
    console.log("QuizPresentation: Setting shouldShowQuizResults to true");

    // IMMEDIATELY show QuizResults
    setShouldShowQuizResults(true);

    try {
      // Update Firebase in background - DON'T set isComplete to true
      // This prevents mobile page from showing its completion screen
      await quizService.updateQuiz(quizData.sessionCode, {
        showResults: true,
        isActive: false,
        // isComplete: false - Keep quiz active so mobile doesn't show completion
      });

      // DON'T update local quiz data with isComplete: true
      // This prevents any interference with QuizResults rendering

      // DON'T call onQuizComplete() - this triggers the presentation page
      // to show "Quiz Complete" overlay which covers QuizResults.tsx

      console.log("QuizPresentation: Final results shown successfully");
    } catch (error) {
      console.error("Error showing final results:", error);
      // Don't revert the state - keep QuizResults showing
    }
  }, [quizData?.sessionCode]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "n":
          goToNextQuestion();
          break;
        case "arrowright":
          goToNextQuestion();
          break;
        case "r":
          toggleResults();
          break;
        case "s":
          // Show Results shortcut for last question
          if (quizData.currentQuestionIndex + 1 >= quizData.questions.length) {
            showFinalResults();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [
    currentQuestion,
    quizData.showResults,
    goToNextQuestion,
    toggleResults,
    quizData.currentQuestionIndex,
    quizData.questions.length,
    showFinalResults,
  ]);

  // Debug logging
  console.log("QuizPresentation: Current quiz state:", {
    totalQuestions: quizData.questions.length,
    currentIndex: quizData.currentQuestionIndex,
    currentQuestion: currentQuestion?.question,
    currentQuestionData: currentQuestion,
    hasQuestions: quizData.questions.length > 0,
    isComplete: quizData.isComplete,
    shouldShowQuizResults: shouldShowQuizResults,
    showResults: quizData.showResults,
  });

  // Safety check
  if (!quizData || quizData.questions.length === 0) {
    return (
      <div className="absolute inset-0 w-full h-full bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-dark-royalty mb-4">
            No Quiz Questions
          </h2>
          <p className="text-xl text-deep-sea/70">
            This quiz doesn&apos;t have any questions yet.
          </p>
        </div>
      </div>
    );
  }

  // ROBUST: Show QuizResults when this state is true
  if (shouldShowQuizResults) {
    console.log("QuizPresentation: RENDERING QuizResults component");
    console.log(
      "QuizPresentation: shouldShowQuizResults:",
      shouldShowQuizResults,
    );
    console.log(
      "QuizPresentation: This will override ANY other rendering logic",
    );

    // This return statement takes absolute priority over everything else
    // No other code can execute after this return
    return (
      <QuizResults
        _quizData={quizData}
        liveQuizData={liveQuizData}
        _onQuizComplete={onQuizComplete}
      />
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full bg-white">
      {/* Question Counter - Top center, matching QuizEditor style */}
      <div className="absolute top-12 left-0 right-0">
        <div className="text-center">
          <span className="text-2xl font-medium text-blue-600">
            Question {quizData.currentQuestionIndex + 1} of{" "}
            {quizData.questions.length}
          </span>
        </div>
      </div>

      {/* Question Text - Large and centered, matching QuizEditor input style */}
      <div className="absolute top-16 left-0 right-0 px-16">
        <h1 className="text-4xl font-bold text-black leading-tight text-center px-6 py-4">
          {currentQuestion.question}
        </h1>
      </div>

      {/* Media Area - Position based on number of alternatives */}
      {currentQuestion.media && (
        <div
          className={`absolute top-32 left-0 right-0 flex justify-center px-8 ${
            currentQuestion.options.length === 2
              ? "bottom-[440px]" // More space for 2 tall alternatives + margin
              : "bottom-[420px]" // Less space above 4 alternatives + margin
          }`}
        >
          <div className="flex justify-center items-center w-full h-full">
            <div className="relative w-full h-full max-w-4xl">
              {typeof currentQuestion.media === "string" ? (
                <Image
                  src={currentQuestion.media}
                  alt="Question media"
                  fill
                  className="object-contain"
                />
              ) : currentQuestion.media.type === "image" ? (
                <Image
                  src={currentQuestion.media.url}
                  alt="Question media"
                  fill
                  className="object-contain"
                />
              ) : (
                <video
                  src={currentQuestion.media.url}
                  className="w-full h-full object-contain"
                  controls
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timer - Center left */}
      <div className="absolute left-8 top-1/2 transform -translate-y-1/2">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center">
          <div className="text-sm font-medium text-gray-600 mb-2">
            Time Left
          </div>
          <div
            className={`text-4xl font-bold ${
              timeLeft <= 10
                ? "text-red-500"
                : timeLeft <= 30
                  ? "text-orange-500"
                  : "text-blue-600"
            }`}
          >
            {timeLeft}
          </div>
        </div>
      </div>

      {/* Answer Count - Center right */}
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center">
          <div className="text-sm font-medium text-gray-600 mb-2">
            Responses
          </div>
          <div className="text-4xl font-bold text-green-600">
            {liveQuizData?.participants
              ? Object.values(liveQuizData.participants).length
              : 0}
          </div>
        </div>
      </div>

      {/* Answer Options - Bottom section, wider and closer to bottom */}
      <div className="absolute bottom-8 left-0 right-0 px-8">
        <div className="max-w-7xl mx-auto">
          <div
            className={`grid ${
              currentQuestion.options.length === 2
                ? "grid-cols-2 gap-6"
                : "grid-cols-2 gap-4"
            }`}
          >
            {currentQuestion.options.map((option) => {
              // Calculate stats from live quiz data
              let stats = null;
              if (
                liveQuizData &&
                quizData.showResults &&
                liveQuizData.participants
              ) {
                // Count responses for this option by checking participant responses
                const totalResponses = Object.values(
                  liveQuizData.participants,
                ).length;
                const optionResponses = Object.values(
                  liveQuizData.participants,
                ).filter(
                  (participant) =>
                    participant.responses[currentQuestion.id] === option.id,
                ).length;
                const percentage =
                  totalResponses > 0
                    ? Math.round((optionResponses / totalResponses) * 100)
                    : 0;

                stats = {
                  id: option.id,
                  count: optionResponses,
                  percentage: percentage,
                };
              }

              return (
                <div
                  key={option.id}
                  className={`relative group rounded-3xl shadow-2xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center ${
                    currentQuestion.options.length === 2
                      ? "min-h-[388px]"
                      : "min-h-[180px]"
                  } ${quizData.showResults && option.isCorrect ? "ring-4 ring-green-400" : "hover:shadow-xl"}`}
                  style={{ backgroundColor: option.color }}
                >
                  {/* Correct Answer Indicator - Only show when results are shown */}
                  {quizData.showResults && option.isCorrect && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      ✓
                    </div>
                  )}

                  {/* Option Text - Responsive sizing based on text length */}
                  <div
                    className={`text-white text-center font-bold px-8 w-full ${
                      option.text.length > 50
                        ? "text-lg"
                        : option.text.length > 30
                          ? "text-xl"
                          : "text-2xl"
                    }`}
                  >
                    {option.text}
                  </div>

                  {/* Results - Show percentage and count when results are visible */}
                  {quizData.showResults && stats && (
                    <div className="text-white text-center mt-4">
                      <div className="text-4xl font-bold">
                        {stats.percentage}%
                      </div>
                      <div className="text-sm opacity-80">
                        ({stats.count} votes)
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Control Instructions - Bottom left */}
      <div className="absolute bottom-2 left-8">
        <div className="bg-white/80 rounded-lg shadow-sm px-4 py-2 text-sm text-gray-600">
          <div>
            R: Toggle Results | N: Next | S: Show Results (last question)
          </div>
        </div>
      </div>

      {/* Navigation Button - Bottom right, above alternatives */}
      <div className="absolute bottom-2 right-8 flex space-x-2">
        <button
          onClick={toggleResults}
          className="text-blue-600 text-lg font-medium cursor-pointer hover:text-blue-800 transition-colors px-4 py-2 bg-white/80 rounded-lg shadow-sm"
        >
          {quizData.showResults ? "Hide Results" : "Show Results"}
        </button>
        <button
          onClick={goToNextQuestion}
          data-quiz-next
          className="text-gray-600 text-lg font-medium cursor-pointer hover:text-gray-800 transition-colors px-4 py-2 bg-white/80 rounded-lg shadow-sm"
        >
          {quizData.currentQuestionIndex + 1 >= quizData.questions.length
            ? "Next"
            : "Next"}
        </button>
        {quizData.currentQuestionIndex + 1 >= quizData.questions.length && (
          <button
            onClick={showFinalResults}
            className="text-green-600 text-lg font-medium cursor-pointer hover:text-green-800 transition-colors px-4 py-2 bg-white/80 rounded-lg shadow-sm"
          >
            Show Results
          </button>
        )}
      </div>
    </div>
  );
}

export default QuizPresentation;
