"use client";

import React, { useState, useRef } from "react";

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
  media?: {
    file: File;
    url: string;
    type: "image" | "video";
  };
}

interface QuizAIProps {
  existingQuestions: QuizQuestion[];
  onQuestionsGenerated: (questions: QuizQuestion[]) => void;
  quizTitle?: string;
}

const QuizAI: React.FC<QuizAIProps> = ({
  existingQuestions,
  onQuestionsGenerated,
  quizTitle = "Live Quiz",
}) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedQuestions, setLastGeneratedQuestions] = useState<
    QuizQuestion[]
  >([]);
  const [showUndo, setShowUndo] = useState(false);
  const [error, setError] = useState("");
  const previousQuestionsRef = useRef<QuizQuestion[]>([]);

  const handleGenerateQuestions = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt to generate questions.");
      return;
    }

    setIsGenerating(true);
    setError("");

    // Store current questions for undo functionality
    previousQuestionsRef.current = [...existingQuestions];

    try {
      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          existingQuestions: existingQuestions.map((q) => ({
            id: q.id,
            question: q.question,
          })),
          quizTitle,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok and handle specific status codes
      if (!response.ok) {
        // First try to get the error message from the response body
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // If we can't parse the response, use default messages
          errorData = {};
        }

        if (response.status === 404) {
          setError(
            "API endpoint not found. Please check your server configuration.",
          );
          return;
        } else if (response.status === 408) {
          setError(
            errorData.message ||
              "⏱️ Request timed out. Please try with a simpler prompt or try again later.",
          );
          return;
        } else if (response.status === 429) {
          setError(
            errorData.message ||
              "🚫 Too many requests. Please wait a moment and try again.",
          );
          return;
        } else if (response.status === 401) {
          setError(
            errorData.message ||
              "🔐 Invalid API key. Please check your configuration.",
          );
          return;
        } else if (response.status === 500) {
          setError(
            errorData.message || "❌ Server error. Please try again later.",
          );
          return;
        } else {
          setError(
            errorData.message ||
              `HTTP ${response.status}: ${response.statusText}`,
          );
          return;
        }
      }

      const data = await response.json();

      if (data.success && data.questions) {
        // Generate unique IDs for new questions to avoid conflicts
        const questionsWithUniqueIds = data.questions.map(
          (question: QuizQuestion) => ({
            ...question,
            id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          }),
        );

        setLastGeneratedQuestions(questionsWithUniqueIds);
        setShowUndo(true);
        onQuestionsGenerated(questionsWithUniqueIds);
        setPrompt(""); // Clear the prompt after successful generation
      } else {
        // Show the detailed error message from the API
        const errorMessage =
          data.message || "Failed to generate questions. Please try again.";
        const details = data.details ? ` ${data.details}` : "";
        setError(errorMessage + details);
      }
    } catch (error) {
      console.error("Error generating questions:", error);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          setError(
            "Request timed out. Please try with a shorter prompt or try again later.",
          );
        } else if (error.message.includes("404")) {
          setError(
            "API endpoint not found. Please check your server configuration.",
          );
        } else if (error.message.includes("Failed to fetch")) {
          setError(
            "Network error. Please check your connection and try again.",
          );
        } else {
          setError(
            error.message || "An unexpected error occurred. Please try again.",
          );
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUndo = () => {
    if (previousQuestionsRef.current) {
      // Calculate which questions to remove (the ones that were just added)
      const questionsToRemove = lastGeneratedQuestions.map((q) => q.id);
      const restoredQuestions = existingQuestions.filter(
        (q) => !questionsToRemove.includes(q.id),
      );

      // Restore to previous state by removing the AI-generated questions
      onQuestionsGenerated(
        previousQuestionsRef.current.slice(restoredQuestions.length),
      );
      setShowUndo(false);
      setLastGeneratedQuestions([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerateQuestions();
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200 shadow-sm">
      <div className="flex items-stretch space-x-3">
        {/* AI Icon */}
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
          AI
        </div>

        {/* Input Field */}
        <div className="flex-1">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask AI to generate quiz questions... Try: 'Create 2 simple questions about animals' or 'Generate 1 question about movies'"
            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm h-16"
            disabled={isGenerating}
          />
        </div>

        {/* Generate Button - Full height */}
        <div className="flex-shrink-0">
          <button
            onClick={handleGenerateQuestions}
            disabled={isGenerating || !prompt.trim()}
            className="h-16 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[80px]"
          >
            {isGenerating ? (
              <span className="flex items-center space-x-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-xs">AI Thinking...</span>
              </span>
            ) : (
              "Generate"
            )}
          </button>
        </div>
      </div>

      {/* Status Row - Only show when needed */}
      {(error || lastGeneratedQuestions.length > 0 || showUndo) && (
        <div className="flex items-center justify-between mt-2 px-11">
          <div className="flex items-center space-x-4">
            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-xs">
                <div>{error}</div>
                {(error.includes("timeout") || error.includes("timed out")) && (
                  <div className="mt-1 text-gray-600">
                    💡 <strong>Tips:</strong> Try &quot;Create 1 question about
                    [topic]&quot; or use the &quot;+ Add Question&quot; button
                    below
                  </div>
                )}
              </div>
            )}

            {/* Success Message */}
            {lastGeneratedQuestions.length > 0 && !error && (
              <div className="text-green-600 text-xs">
                Generated {lastGeneratedQuestions.length} question
                {lastGeneratedQuestions.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Undo Button */}
          {showUndo && (
            <button
              onClick={handleUndo}
              className="text-xs text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizAI;
