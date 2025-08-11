"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { EventSegment, Event } from "../../../types/event";
import { eventService } from "../../../services/eventService";
// Server-side upload endpoint avoids App Check/CORS in local dev

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

interface QuizData {
  sessionCode: string;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  isActive: boolean;
  responses: Record<string, Record<string, string>>;
  scores: Record<string, number>;
}

interface QuizEditorProps {
  segment: EventSegment;
  event?: Event;
  onUpdate?: (updatedSegment: EventSegment) => void;
  onClose?: () => void;
}

const COLORS = ["#E53E3E", "#3182CE", "#D69E2E", "#38A169"]; // Bright red, blue, yellow, green
const ICONS = ["▲", "◆", "●", "■"];

export default function QuizEditor({
  segment,
  event: _event,
  onUpdate,
  onClose,
}: QuizEditorProps) {
  const router = useRouter();
  console.log("QuizEditor: received segment:", segment);
  console.log("QuizEditor: segment.data:", segment.data);
  console.log("QuizEditor: segment.data?.quizData:", segment.data?.quizData);

  const [quizData, setQuizData] = useState<QuizData>(() => {
    const existingData = segment.data?.quizData as QuizData;
    if (existingData) {
      console.log("QuizEditor: initializing with existing data from segment");
      return existingData;
    }

    console.log("QuizEditor: initializing with default data");
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
          question: "",
          options: [
            {
              id: "a",
              text: "",
              isCorrect: true,
              color: COLORS[0],
              icon: ICONS[0],
            },
            {
              id: "b",
              text: "",
              isCorrect: false,
              color: COLORS[1],
              icon: ICONS[1],
            },
          ],
          timeLimit: 30,
          pointType: "standard",
        },
      ],
      currentQuestionIndex: 0,
      isActive: false,
      responses: {},
      scores: {},
    };
  });

  // Track initialization and local editable title
  const _isInitialMount = useRef(true);
  const hasInitialized = useRef(false);
  const [segmentTitle, setSegmentTitle] = useState<string>(
    segment.title || "Live Quiz",
  );
  const autoAddedFirstQuestionRef = useRef(false);

  // Update quiz data when segment changes
  useEffect(() => {
    const existingData = segment.data?.quizData as QuizData;
    if (existingData) {
      setQuizData(existingData);
      hasInitialized.current = true;
    } else {
      // If no existing data, we still need to mark as initialized
      // since we have default data from the initial state
      hasInitialized.current = true;
    }
  }, [segment]);

  // Keep local title in sync if segment changes externally
  useEffect(() => {
    setSegmentTitle(segment.title || "Live Quiz");
  }, [segment.title]);

  const updateQuizData = useCallback(
    (newData: Partial<QuizData>) => {
      const updatedData = { ...quizData, ...newData };

      // Check data size and warn if getting large
      const dataSize = JSON.stringify(updatedData).length;
      if (dataSize > 500000) {
        // 500KB warning
        console.warn(
          `QuizEditor: Quiz data is getting large: ${Math.round(dataSize / 1024)}KB. Consider optimizing images or reducing content.`,
        );
      }

      setQuizData(updatedData);
    },
    [quizData],
  );

  // Automatically create and persist the first question if none exist to bypass
  // the superficial "Add First Question" step. Ensures users land directly in
  // the editing UI with an empty question ready to fill in, and the change is
  // saved so it survives reloads.
  useEffect(() => {
    if (!autoAddedFirstQuestionRef.current && quizData.questions.length === 0) {
      autoAddedFirstQuestionRef.current = true;
      const initialQuestion: QuizQuestion = {
        id: Math.random().toString(36).substring(2, 15),
        question: "",
        options: [
          {
            id: "a",
            text: "",
            isCorrect: true,
            color: COLORS[0],
            icon: ICONS[0],
          },
          {
            id: "b",
            text: "",
            isCorrect: false,
            color: COLORS[1],
            icon: ICONS[1],
          },
        ],
        timeLimit: 30,
        pointType: "standard",
      };
      const newQuizData: QuizData = {
        ...quizData,
        questions: [initialQuestion],
        currentQuestionIndex: 0,
      };
      setQuizData(newQuizData);
      if (onUpdate) {
        const updatedSegment: EventSegment = {
          ...segment,
          data: { ...(segment.data || {}), quizData: newQuizData },
        };
        onUpdate(updatedSegment);
      }
    }
  }, [quizData, onUpdate, segment, updateQuizData]);

  const handleSave = async () => {
    if (!onUpdate) return;

    console.log(
      "QuizEditor: Starting save with",
      quizData.questions.length,
      "questions",
    );
    console.log("QuizEditor: Quiz data:", quizData);

    // Persist any base64 media to storage and replace with download URLs
    const processedQuestions = await Promise.all(
      quizData.questions.map(async (q) => {
        if (
          q.media &&
          typeof q.media === "object" &&
          "file" in q.media &&
          q.media.file
        ) {
          try {
            const file: File = q.media.file;
            const ext =
              file.name?.split(".").pop() ||
              (q.media.type === "image" ? "jpg" : "mp4");
            const path = `quiz-media/${quizData.sessionCode}/${q.id}.${ext}`;
            const form = new FormData();
            form.append("file", file);
            form.append("path", path);
            const res = await fetch("/api/upload", {
              method: "POST",
              body: form,
            });
            if (!res.ok) throw new Error("upload failed");
            const { url } = await res.json();
            return { ...q, media: { url, type: q.media.type } } as QuizQuestion;
          } catch (e) {
            console.error("Upload failed via API", e);
            const { media: _media, ...rest } = q;
            return rest;
          }
        }
        if (q.media && q.media.url && q.media.url.startsWith("data:")) {
          try {
            const blob = await (await fetch(q.media.url)).blob();
            const ext = q.media.type === "image" ? "jpg" : "mp4";
            const path = `quiz-media/${quizData.sessionCode}/${q.id}.${ext}`;
            const file = new File([blob], `upload.${ext}`, {
              type: q.media.type === "image" ? "image/jpeg" : "video/mp4",
            });
            const form = new FormData();
            form.append("file", file);
            form.append("path", path);
            const res = await fetch("/api/upload", {
              method: "POST",
              body: form,
            });
            if (!res.ok) throw new Error("upload failed");
            const { url } = await res.json();
            return { ...q, media: { url, type: q.media.type } } as QuizQuestion;
          } catch (e) {
            console.error("Upload failed via API (data URL)", e);
            const { media: _media, ...rest } = q;
            return rest;
          }
        }
        // Keep only url/type on persisted entries
        if (q.media && typeof q.media === "object" && "file" in q.media) {
          const { file: _file, ...restMedia } = q.media;
          return { ...q, media: restMedia };
        }
        return q;
      }),
    );

    const updatedSegment: EventSegment = {
      ...segment,
      title: segmentTitle,
      data: {
        ...segment.data,
        quizData: { ...quizData, questions: processedQuestions },
      },
    };

    console.log(
      "QuizEditor: Processed questions count:",
      processedQuestions.length,
    );
    console.log("QuizEditor: Updated segment:", updatedSegment);

    onUpdate(updatedSegment);

    // Perform an immediate persist to Firestore to avoid losing changes when navigating away
    if (_event && (_event as Event).id) {
      const currentEvent = _event as Event;
      const existsIndex = currentEvent.timeline.findIndex(
        (s) => s.id === updatedSegment.id,
      );
      const updatedTimeline =
        existsIndex >= 0
          ? currentEvent.timeline.map((s) =>
              s.id === updatedSegment.id ? updatedSegment : s,
            )
          : [...currentEvent.timeline, updatedSegment];
      try {
        console.log(
          "QuizEditor: Saving to Firestore with timeline length:",
          updatedTimeline.length,
        );
        console.log(
          "QuizEditor: Quiz segment in timeline:",
          updatedTimeline.find((s) => s.id === updatedSegment.id),
        );
        await eventService.updateEvent(currentEvent.id, {
          timeline: updatedTimeline,
        });
        console.log("QuizEditor: Successfully saved to Firestore");
      } catch (e) {
        console.error("Immediate save failed", e);
      }
      router.replace(`/EventProgram?eventId=${currentEvent.id}`);
    }
  };

  const switchToQuestion = (index: number) => {
    if (index >= 0 && index < quizData.questions.length) {
      updateQuizData({ currentQuestionIndex: index });
    }
  };

  const addQuestion = () => {
    console.log(
      "QuizEditor: Adding question. Current count:",
      quizData.questions.length,
    );

    const newQuestion: QuizQuestion = {
      id: Math.random().toString(36).substring(2, 15),
      question: "",
      options: [
        {
          id: "a",
          text: "",
          isCorrect: true,
          color: COLORS[0],
          icon: ICONS[0],
        },
        {
          id: "b",
          text: "",
          isCorrect: false,
          color: COLORS[1],
          icon: ICONS[1],
        },
      ],
      timeLimit: 30,
      pointType: "standard",
    };

    const newQuestions = [...quizData.questions, newQuestion];
    const newQuestionIndex = newQuestions.length - 1;

    console.log("QuizEditor: New questions array length:", newQuestions.length);
    console.log("QuizEditor: New question index:", newQuestionIndex);

    updateQuizData({
      questions: newQuestions,
      currentQuestionIndex: newQuestionIndex, // Automatically switch to the new question
    });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = quizData.questions.filter((_, i) => i !== index);
    let newCurrentIndex = quizData.currentQuestionIndex;

    // Adjust current question index if needed
    if (index === quizData.currentQuestionIndex) {
      // If we're deleting the current question, go to the previous one (or 0 if it was the first)
      newCurrentIndex = Math.max(0, index - 1);
    } else if (index < quizData.currentQuestionIndex) {
      // If we're deleting a question before the current one, shift the index down
      newCurrentIndex = quizData.currentQuestionIndex - 1;
    }

    // Make sure the index doesn't exceed the new array length
    newCurrentIndex = Math.min(newCurrentIndex, newQuestions.length - 1);

    updateQuizData({
      questions: newQuestions,
      currentQuestionIndex: newCurrentIndex,
    });
  };

  const toggleOptionCount = (questionIndex: number) => {
    const newQuestions = [...quizData.questions];
    const question = newQuestions[questionIndex];
    const currentCount = question.options.length;

    if (currentCount === 2) {
      // Switch to 4 options
      question.options.push(
        {
          id: "c",
          text: "",
          isCorrect: false,
          color: COLORS[2],
          icon: ICONS[2],
        },
        {
          id: "d",
          text: "",
          isCorrect: false,
          color: COLORS[3],
          icon: ICONS[3],
        },
      );
    } else {
      // Switch to 2 options, keep only first 2
      question.options = question.options.slice(0, 2);
      // Make sure at least one is still correct
      if (!question.options.some((opt) => opt.isCorrect)) {
        question.options[0].isCorrect = true;
      }
    }

    updateQuizData({ questions: newQuestions });
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    field: string,
    value: string | boolean,
  ) => {
    const newQuestions = [...quizData.questions];
    newQuestions[questionIndex].options[optionIndex] = {
      ...newQuestions[questionIndex].options[optionIndex],
      [field]: value,
    };
    updateQuizData({ questions: newQuestions });
  };

  const setCorrectAnswer = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...quizData.questions];
    // Set all options to false first
    newQuestions[questionIndex].options.forEach((option, index) => {
      option.isCorrect = index === optionIndex;
    });
    updateQuizData({ questions: newQuestions });
  };

  const handleMediaUpload = (file: File) => {
    console.log(
      "QuizEditor: Uploading media file:",
      file.name,
      "Size:",
      Math.round(file.size / 1024) + "KB",
    );

    // Check file size limit (5MB)
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      alert(
        `File is too large (${Math.round(file.size / 1024 / 1024)}MB). Please use a file smaller than 5MB.`,
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      console.log(
        "QuizEditor: Media converted to data URL, size:",
        Math.round(url.length / 1024) + "KB",
      );

      const newQuestions = [...quizData.questions];
      newQuestions[quizData.currentQuestionIndex] = {
        ...newQuestions[quizData.currentQuestionIndex],
        media: {
          file,
          url,
          type: file.type.startsWith("image/") ? "image" : "video",
        },
      };
      updateQuizData({ questions: newQuestions });
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = (questionIndex: number) => {
    const newQuestions = [...quizData.questions];
    delete newQuestions[questionIndex].media;
    updateQuizData({ questions: newQuestions });
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleMediaUpload(file);
    }
  };

  // Ensure currentQuestionIndex is valid and get current question
  const validIndex = Math.max(
    0,
    Math.min(quizData.currentQuestionIndex, quizData.questions.length - 1),
  );
  const currentQuestion = quizData.questions[validIndex];

  // Sync the index if it was corrected
  useEffect(() => {
    if (
      validIndex !== quizData.currentQuestionIndex &&
      quizData.questions.length > 0
    ) {
      updateQuizData({ currentQuestionIndex: validIndex });
    }
  }, [
    validIndex,
    quizData.currentQuestionIndex,
    quizData.questions.length,
    updateQuizData,
  ]);

  // Debug logging
  console.log("QuizEditor: Safety check - quizData:", quizData);
  console.log(
    "QuizEditor: Safety check - questions.length:",
    quizData?.questions?.length,
  );
  console.log(
    "QuizEditor: Safety check - currentQuestionIndex:",
    quizData?.currentQuestionIndex,
  );

  // While the first question is being auto-created, show a lightweight placeholder
  if (!quizData || quizData.questions.length === 0) {
    return (
      <div className="flex h-full min-h-[700px] items-center justify-center">
        <div className="text-center text-deep-sea/70">
          Preparing first question...
        </div>
      </div>
    );
  }

  // Ensure we have a valid current question index
  if (validIndex !== quizData.currentQuestionIndex) {
    console.log(
      "QuizEditor: correcting currentQuestionIndex from",
      quizData.currentQuestionIndex,
      "to",
      validIndex,
    );
    updateQuizData({ currentQuestionIndex: validIndex });
    return null; // This will trigger a re-render with the corrected index
  }

  console.log(
    "QuizEditor: rendering quiz with",
    quizData.questions.length,
    "questions, current index:",
    quizData.currentQuestionIndex,
  );

  return (
    <>
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 69, 19, 0.3) transparent;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(139, 69, 19, 0.3);
          border-radius: 3px;
          transition: background-color 0.2s;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(139, 69, 19, 0.5);
        }

        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>
      <div className="flex h-[85vh] relative overflow-hidden bg-white rounded-2xl shadow-2xl">
        {/* Exit Button - Top Right */}
        <button
          onClick={() => (onClose ? onClose() : window.history.back())}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Left Sidebar - Question Navigation with Custom Scrolling */}
        <div className="w-64 bg-white/90 backdrop-blur-xl border-r border-dark-royalty/10 flex flex-col h-full overflow-hidden flex-shrink-0">
          {/* Quiz Settings Header - Fixed */}
          <div className="flex-shrink-0 p-4 border-b border-dark-royalty/10 bg-white/95">
            <h3 className="text-xl font-bold text-dark-royalty mb-4">
              Quiz Settings
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-deep-sea/70 mb-1">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={segmentTitle}
                  onChange={(e) => setSegmentTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-dark-royalty/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-deep-sea/70 mb-1">
                  Time Limit (seconds)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(currentQuestion.timeLimit ?? "")}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const newQuestions = [...quizData.questions];
                    // Allow empty field while editing; default to empty
                    if (raw === "") {
                      newQuestions[quizData.currentQuestionIndex].timeLimit = 0;
                    } else if (/^\d+$/.test(raw)) {
                      newQuestions[quizData.currentQuestionIndex].timeLimit =
                        parseInt(raw, 10);
                    }
                    updateQuizData({ questions: newQuestions });
                  }}
                  onBlur={(e) => {
                    const raw = e.target.value;
                    const newQuestions = [...quizData.questions];
                    if (raw === "" || isNaN(Number(raw))) {
                      newQuestions[quizData.currentQuestionIndex].timeLimit =
                        30; // fallback
                      updateQuizData({ questions: newQuestions });
                    }
                  }}
                  placeholder="e.g. 30"
                  className="w-full px-3 py-2 border border-dark-royalty/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-deep-sea/70 mb-1">
                  Point Type
                </label>
                <select
                  value={currentQuestion.pointType}
                  onChange={(e) => {
                    const newQuestions = [...quizData.questions];
                    newQuestions[quizData.currentQuestionIndex].pointType = e
                      .target.value as "standard" | "double" | "none";
                    updateQuizData({ questions: newQuestions });
                  }}
                  className="w-full px-3 py-2 border border-dark-royalty/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="double">Double Points</option>
                  <option value="none">No Points</option>
                </select>
              </div>
            </div>
          </div>

          {/* Questions List Header */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-dark-royalty/10">
            <h4 className="text-lg font-bold text-dark-royalty">
              Questions ({quizData.questions.length})
            </h4>
          </div>

          {/* Scrollable Questions List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4">
              <div className="space-y-3">
                {quizData.questions.map((question, index) => (
                  <div
                    key={question.id}
                    onClick={() => switchToQuestion(index)}
                    className={`
                    relative rounded-lg cursor-pointer transition-all duration-200 overflow-hidden ${
                      index === quizData.currentQuestionIndex
                        ? "ring-2 ring-dark-royalty shadow-lg"
                        : "hover:shadow-md"
                    }
                  `}
                  >
                    {/* Mini Preview Window */}
                    <div className="bg-white border border-dark-royalty/10 rounded-lg p-3">
                      {/* Question Number Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 bg-dark-royalty text-white text-xs rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <span className="text-xs font-medium text-dark-royalty">
                            Quiz
                          </span>
                        </div>
                        {quizData.questions.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeQuestion(index);
                            }}
                            className="text-red-400 hover:text-red-500 text-xs w-4 h-4 rounded-full bg-red-50 flex items-center justify-center"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Mini Question Text */}
                      <div className="text-xs text-gray-600 mb-2 line-clamp-1 bg-gray-50 rounded px-2 py-1">
                        {question.question || "Empty question"}
                      </div>

                      {/* Mini Media Preview */}
                      {question.media && (
                        <div className="mb-2">
                          <div className="w-full h-6 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-500">📷</span>
                          </div>
                        </div>
                      )}

                      {/* Mini Answer Options Grid */}
                      <div
                        className={`grid ${
                          question.options.length === 2
                            ? "grid-cols-2 gap-1"
                            : "grid-cols-2 gap-0.5"
                        }`}
                      >
                        {question.options.map((option, _optionIndex) => (
                          <div
                            key={option.id}
                            className={`rounded text-xs flex items-center justify-center text-white font-medium ${
                              question.options.length === 2
                                ? "h-10 px-1"
                                : "h-6 px-0.5"
                            } ${
                              option.isCorrect ? "ring-1 ring-green-400" : ""
                            }`}
                            style={{ backgroundColor: option.color }}
                          >
                            <span
                              className="truncate text-center"
                              style={{ fontSize: "10px" }}
                            >
                              {option.text || "Empty"}
                            </span>
                            {option.isCorrect && (
                              <span
                                className="ml-0.5 text-green-300"
                                style={{ fontSize: "8px" }}
                              >
                                ✓
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Time and Points Info */}
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                        <span>{question.timeLimit}s</span>
                        <span>{question.pointType}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom padding for better scrolling */}
              <div className="h-4"></div>
            </div>
          </div>

          {/* Fixed Add Question Button at Bottom */}
          <div className="flex-shrink-0 p-4 border-t border-dark-royalty/10 bg-white/95">
            <button
              onClick={addQuestion}
              className="w-full px-4 py-3 bg-dark-royalty text-white rounded-lg hover:bg-dark-royalty/90 transition-all text-sm font-medium shadow-sm flex items-center justify-center space-x-2"
            >
              <span className="text-lg">+</span>
              <span>Add Question</span>
            </button>
          </div>
        </div>

        {/* Main Content Area - Fixed Position, No Scrolling */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Question Editor - Presentation Preview Style */}
          <div className="flex-1 p-6 overflow-hidden">
            <div className="h-full flex flex-col items-center justify-start space-y-6">
              {/* Question Text - Matching presentation size and style */}
              <div className="w-full">
                <input
                  type="text"
                  value={currentQuestion.question}
                  onChange={(e) => {
                    const newQuestions = [...quizData.questions];
                    newQuestions[quizData.currentQuestionIndex].question =
                      e.target.value;
                    updateQuizData({ questions: newQuestions });
                  }}
                  placeholder="Enter your question here..."
                  className="w-full px-6 py-4 border border-dark-royalty/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300 text-4xl font-bold text-black text-center leading-tight"
                  style={{ minHeight: "4rem" }}
                />
              </div>

              {/* Media Upload - Compact preview for editor */}
              <div className="w-full">
                {currentQuestion.media ? (
                  <div className="flex justify-center">
                    <div className="relative">
                      {currentQuestion.media.type === "image" ? (
                        <Image
                          src={currentQuestion.media.url}
                          alt="Question media"
                          width={400}
                          height={250}
                          className="rounded-2xl shadow-lg object-cover max-w-full h-auto"
                        />
                      ) : (
                        <video
                          src={currentQuestion.media.url}
                          className="rounded-2xl shadow-lg max-w-lg max-h-48 object-cover"
                          controls
                        />
                      )}
                      <button
                        onClick={() =>
                          removeMedia(quizData.currentQuestionIndex)
                        }
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-dark-royalty/20 rounded-xl p-8 text-center bg-white/30 hover:bg-white/40 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileInputChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-16 h-16 bg-dark-royalty/10 rounded-full flex items-center justify-center">
                        <span className="text-3xl text-dark-royalty font-bold">
                          +
                        </span>
                      </div>
                      <p className="text-sm text-deep-sea/60">
                        Upload a picture or video by clicking here
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Answer Options - Presentation-sized grid */}
              <div className="w-full flex-grow">
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() =>
                      toggleOptionCount(quizData.currentQuestionIndex)
                    }
                    className="text-dark-royalty hover:text-dark-royalty/80 transition-colors text-sm font-medium underline"
                  >
                    {currentQuestion.options.length === 2
                      ? "Change to 4 Alternatives"
                      : "Change to 2 Alternatives"}
                  </button>
                </div>

                {/* Presentation-style Answer Grid - Dynamic sizing */}
                <div
                  className={`grid max-w-7xl mx-auto ${
                    currentQuestion.options.length === 2
                      ? "grid-cols-2 gap-6"
                      : "grid-cols-2 gap-4"
                  }`}
                >
                  {currentQuestion.options.map((option, optionIndex) => (
                    <div
                      key={option.id}
                      className={`relative group rounded-3xl shadow-2xl cursor-pointer transition-all duration-300 flex items-center justify-center ${
                        currentQuestion.options.length === 2
                          ? "min-h-[388px]"
                          : "min-h-[180px]"
                      } ${
                        option.isCorrect
                          ? "ring-4 ring-green-400"
                          : "hover:shadow-xl"
                      }`}
                      style={{ backgroundColor: option.color }}
                      onClick={() =>
                        setCorrectAnswer(
                          quizData.currentQuestionIndex,
                          optionIndex,
                        )
                      }
                    >
                      {/* Correct Answer Indicator */}
                      {option.isCorrect && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                          ✓
                        </div>
                      )}

                      {/* Option Text - Presentation style */}
                      <div
                        contentEditable
                        suppressContentEditableWarning={true}
                        onBlur={(e) => {
                          const newText = e.currentTarget.textContent || "";
                          updateOption(
                            quizData.currentQuestionIndex,
                            optionIndex,
                            "text",
                            newText,
                          );
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-white text-center font-bold text-2xl focus:outline-none cursor-text px-8 w-full"
                        style={{ minHeight: "1.5rem" }}
                      >
                        {option.text}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-deep-sea/60 mt-4 text-center">
                  Click on an answer to mark it as correct
                </p>
              </div>
            </div>
          </div>

          {/* Fixed Save Button Area at Bottom */}
          <div className="flex-shrink-0">
            <div className="flex justify-end p-4">
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-dark-royalty text-white rounded-lg shadow-md hover:bg-dark-royalty/90 transition-all text-sm font-semibold"
              >
                {(() => {
                  const existsInEvent = Array.isArray(_event?.timeline)
                    ? _event.timeline.some((s) => s?.id === segment.id)
                    : false;
                  return existsInEvent
                    ? "Save Changes"
                    : "Save Quiz to Event Program";
                })()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
