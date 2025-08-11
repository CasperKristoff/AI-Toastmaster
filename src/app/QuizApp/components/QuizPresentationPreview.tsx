"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { EventSegment, Event } from "../../../types/event";
import {
  quizService,
  QuizData,
  QuizQuestion,
} from "../../../services/quizService";

interface QuizPresentationPreviewProps {
  segment: EventSegment;
  event?: Event;
  onStartQuiz: () => void;
}

export default function QuizPresentationPreview({
  segment,
  event: _event,
  onStartQuiz,
}: QuizPresentationPreviewProps) {
  // Get quiz data for session code
  const quizData = segment.data?.quizData as
    | { sessionCode?: string }
    | undefined;

  // IMPORTANT: Use existing session code or generate one and store it
  let sessionCode = quizData?.sessionCode;
  if (!sessionCode) {
    sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log(
      "QuizPresentationPreview: Generated new session code:",
      sessionCode,
    );
    // Store this session code in the segment data for consistency
    if (segment.data?.quizData) {
      (segment.data.quizData as { sessionCode?: string }).sessionCode =
        sessionCode;
    }
  }

  console.log("QuizPresentationPreview: Using session code:", sessionCode);
  console.log(
    "QuizPresentationPreview: Segment quiz data:",
    segment.data?.quizData,
  );

  const [participantCount, setParticipantCount] = useState(0);
  const [isQuizInitialized, setIsQuizInitialized] = useState(false);

  const getQRCodeURL = (): string => {
    return `${window.location.origin}/QuizApp/${sessionCode}`;
  };

  // Initialize quiz in Firebase and subscribe to participant updates
  useEffect(() => {
    const initializeQuiz = async () => {
      if (isQuizInitialized) return;

      const existingData = segment.data?.quizData as
        | { questions?: QuizQuestion[]; sessionCode?: string }
        | undefined;
      if (
        existingData &&
        existingData.questions &&
        existingData.questions.length > 0
      ) {
        const liveQuizData: Omit<QuizData, "createdAt"> = {
          sessionCode: sessionCode,
          title: segment.title || "Live Quiz",
          questions: existingData.questions || [],
          currentQuestionIndex: 0,
          isActive: false, // Start inactive
          showResults: false,
          participants: {},
          responses: {},
          isComplete: false,
        };

        try {
          console.log(
            "QuizPresentationPreview: Creating quiz in Firebase with data:",
            liveQuizData,
          );
          await quizService.createQuiz(liveQuizData);
          console.log(
            "QuizPresentationPreview: Quiz created successfully in Firebase",
          );
          setIsQuizInitialized(true);

          // Subscribe to participant updates
          const unsubscribe = quizService.subscribeToQuiz(
            sessionCode,
            (updatedQuiz: QuizData | null) => {
              console.log(
                "QuizPresentationPreview: Received quiz update:",
                updatedQuiz,
              );
              if (updatedQuiz) {
                setParticipantCount(
                  Object.keys(updatedQuiz.participants || {}).length,
                );
              }
            },
          );

          return () => unsubscribe();
        } catch (error) {
          console.error("Error initializing quiz:", error);
        }
      }
    };

    initializeQuiz();
  }, [segment, sessionCode, isQuizInitialized]);

  const handleStartQuiz = async () => {
    // Start the quiz in Firebase before switching to active mode
    if (sessionCode) {
      try {
        console.log(
          "QuizPresentationPreview: Starting quiz with session code:",
          sessionCode,
        );
        const updateData = {
          isActive: true,
          showResults: false,
          currentQuestionIndex: 0,
        };
        console.log(
          "QuizPresentationPreview: Updating quiz with data:",
          updateData,
        );
        await quizService.updateQuiz(sessionCode, updateData);
        console.log("Quiz started successfully in Firebase");
      } catch (error) {
        console.error("Error starting quiz:", error);
      }
    }
    onStartQuiz();
  };

  return (
    <div
      className="w-full h-full relative"
      style={{
        background:
          "linear-gradient(135deg, rgba(240, 240, 255, 0.1), transparent, rgba(255, 240, 240, 0.1))",
      }}
    >
      {/* QR Code and Join Instructions - Top Right (matching Poll) */}
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

      {/* Participant Count - Top Left */}
      <div className="fixed top-24 left-24 z-50 bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/20 shadow-lg">
        <div className="text-center">
          <div className="text-4xl font-bold text-dark-royalty mb-2">
            {participantCount}
          </div>
          <div className="text-sm text-deep-sea/70">
            {participantCount === 1 ? "Participant" : "Participants"}
          </div>
          <div className="text-xs text-deep-sea/50 mt-1">
            {participantCount > 0
              ? "Ready to start!"
              : "Waiting for participants..."}
          </div>
        </div>
      </div>

      {/* Title positioned to match presentation standard */}
      <h1
        className="text-7xl font-bold text-dark-royalty leading-tight tracking-tight text-center"
        style={{
          marginTop: "-15rem",
          position: "absolute",
          top: "35%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
        }}
      >
        {segment.title || "Live Quiz"}
      </h1>

      {/* Main Content */}
      <div className="flex flex-col items-center h-full px-16 justify-center">
        {/* Start Button */}
        <button
          onClick={handleStartQuiz}
          disabled={participantCount === 0}
          className={`px-16 py-8 rounded-3xl text-3xl font-bold transition-all duration-300 shadow-xl ${
            participantCount === 0
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-gradient-to-r from-dark-royalty to-deep-sea text-white hover:from-dark-royalty/90 hover:to-deep-sea/90 hover:scale-105"
          }`}
        >
          {participantCount === 0
            ? "Waiting for Participants..."
            : `Start Quiz (${participantCount} ${participantCount === 1 ? "participant" : "participants"})`}
        </button>

        {participantCount === 0 && (
          <p className="text-deep-sea/60 mt-4 text-lg text-center">
            Ask participants to scan the QR code to join the quiz
          </p>
        )}
      </div>
    </div>
  );
}
