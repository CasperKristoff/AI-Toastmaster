"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Event, EventSegment } from "../../types/event";
import { eventService } from "../../services/eventService";
import QuizEditor from "./components/QuizEditor";

function QuizPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [segmentToEdit, setSegmentToEdit] = useState<EventSegment | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [_isSaving, setIsSaving] = useState(false);

  // Debounced save mechanism
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSegmentRef = useRef<EventSegment | null>(null);

  // Remove very large/transient fields before saving to Firestore (1MB doc limit)
  const sanitizeSegmentForSave = useCallback(
    (segment: EventSegment): EventSegment => {
      const cloned: EventSegment = JSON.parse(JSON.stringify(segment));
      if (cloned.type === "quiz" && cloned.data && cloned.data.quizData) {
        try {
          const quizData = cloned.data.quizData;
          if (typeof quizData === "object" && quizData !== null) {
            // Type assertion for quiz data sanitization
            const sanitizableQuizData = quizData as Record<string, unknown>;
            sanitizableQuizData.responses = sanitizableQuizData.responses || {};
            sanitizableQuizData.scores = sanitizableQuizData.scores || {};
            sanitizableQuizData.questions = (
              (sanitizableQuizData.questions as unknown[]) || []
            ).map((q: unknown) => {
              const newQ = { ...(q as Record<string, unknown>) };
              if (
                newQ.media &&
                typeof newQ.media === "object" &&
                newQ.media !== null
              ) {
                const media = newQ.media as Record<string, unknown>;
                // Remove any File object reference
                if ("file" in media) delete media.file;
                // Prevent storing base64 data URLs in Firestore (too large). Require upload elsewhere.
                if (
                  typeof media.url === "string" &&
                  media.url.startsWith("data:")
                ) {
                  delete newQ.media; // strip large inline payloads
                }
              }
              return newQ;
            });
          }
        } catch {
          // no-op
        }
      }
      return cloned;
    },
    [],
  );

  // Get parameters from URL
  const eventId = searchParams.get("eventId");
  const segmentId = searchParams.get("segmentId");
  const createSegment = searchParams.get("createSegment") === "true";
  const segmentTitle = searchParams.get("title") || "Live Quiz";

  // Load event and segment
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
      return;
    }

    if (!user || !eventId) return;

    const unsubscribe = eventService.subscribeToUserEvents(
      user.uid,
      (events) => {
        const targetEvent = events.find((e) => e.id === eventId);
        if (targetEvent) {
          setEvent(targetEvent);
          setIsLoading(false);
        }
      },
    );

    return unsubscribe;
  }, [user, loading, router, eventId]);

  // Separate useEffect for segment handling to prevent loops
  useEffect(() => {
    if (!event || isLoading || showQuizModal) return;

    if (createSegment && segmentId) {
      // Create new segment
      const existingSegment = event.timeline.find((s) => s.id === segmentId);
      if (!existingSegment) {
        const newQuizSegment: EventSegment = {
          id: segmentId,
          title: segmentTitle,
          type: "quiz",
          description: "Interactive quiz with real-time responses",
          duration: 15,
          content: "Guests can join via QR code and answer questions",
          order: event.timeline.length,
          data: {
            quizData: {
              sessionCode: Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase(),
              questions: [
                {
                  id: Math.random().toString(36).substring(2, 15),
                  question: "",
                  options: [
                    {
                      id: "a",
                      text: "",
                      isCorrect: true,
                      color: "#E53E3E",
                      icon: "▲",
                    },
                    {
                      id: "b",
                      text: "",
                      isCorrect: false,
                      color: "#3182CE",
                      icon: "◆",
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
            },
          },
        };

        setSegmentToEdit(newQuizSegment);
        setShowQuizModal(true);

        // Clean URL (we keep this to avoid accidental re-creation on refresh)
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("createSegment");
        newUrl.searchParams.delete("title");
        newUrl.searchParams.delete("type");
        window.history.replaceState({}, "", newUrl.toString());
      } else {
        setSegmentToEdit(existingSegment);
        setShowQuizModal(true);
      }
    } else if (segmentId && !segmentToEdit) {
      // Edit existing segment
      const segment = event.timeline.find((s) => s.id === segmentId);
      if (segment && segment.type === "quiz") {
        setSegmentToEdit(segment);
        setShowQuizModal(true);
      }
    }
  }, [
    event,
    isLoading,
    createSegment,
    segmentId,
    segmentTitle,
    showQuizModal,
    segmentToEdit,
  ]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Debounced save function to prevent quota exhaustion
  const debouncedSave = useCallback(
    (segment: EventSegment, currentEvent: Event) => {
      const existingIndex = currentEvent.timeline.findIndex(
        (s) => s.id === segment.id,
      );
      let updatedTimeline;

      if (existingIndex >= 0) {
        updatedTimeline = currentEvent.timeline.map((s) =>
          s.id === segment.id
            ? sanitizeSegmentForSave(segment)
            : sanitizeSegmentForSave(s),
        );
      } else {
        updatedTimeline = [
          ...currentEvent.timeline.map(sanitizeSegmentForSave),
          sanitizeSegmentForSave(segment),
        ];
      }

      const updatedEvent: Event = {
        ...currentEvent,
        timeline: updatedTimeline,
      };

      console.log("Saving to database (debounced):", segment.id);
      setIsSaving(true);
      eventService
        .updateEvent(updatedEvent.id, { timeline: updatedEvent.timeline })
        .then(() => {
          console.log("Save successful:", segment.id);
          setIsSaving(false);
        })
        .catch((error) => {
          console.error("Error saving segment:", error);
          setIsSaving(false);
        });
    },
    [sanitizeSegmentForSave],
  );

  const handleSaveQuiz = useCallback(
    (updatedSegment: EventSegment) => {
      if (!event) return;

      // Immediate optimistic update for better UX
      setEvent((prevEvent) => {
        if (!prevEvent) return prevEvent;

        const existingIndex = prevEvent.timeline.findIndex(
          (s) => s.id === updatedSegment.id,
        );
        let updatedTimeline;

        if (existingIndex >= 0) {
          updatedTimeline = prevEvent.timeline.map((segment) =>
            segment.id === updatedSegment.id ? updatedSegment : segment,
          );
        } else {
          // Only append on explicit save
          updatedTimeline = [...prevEvent.timeline, updatedSegment];
        }

        return { ...prevEvent, timeline: updatedTimeline };
      });

      // Store the pending segment and current event
      pendingSegmentRef.current = updatedSegment;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce database save (wait 2 seconds after last change)
      saveTimeoutRef.current = setTimeout(() => {
        if (pendingSegmentRef.current && event) {
          debouncedSave(pendingSegmentRef.current, event);
          pendingSegmentRef.current = null;
        }
      }, 2000); // 2 second debounce
    },
    [event, debouncedSave],
  );

  // Close without implicit save. Changes are persisted only via explicit save handler.
  const handleCloseQuizEditor = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      pendingSegmentRef.current = null;
    }
    setShowQuizModal(false);
    setSegmentToEdit(null);
    if (event) {
      router.replace(`/EventProgram?eventId=${event.id}`);
    }
  }, [event, router]);

  const handleCreateNewQuiz = useCallback(() => {
    if (!event) return;

    const newQuizSegment: EventSegment = {
      id: Math.random().toString(36).substring(2, 15),
      title: "Live Quiz",
      type: "quiz",
      description: "",
      duration: 15,
      content: "",
      order: event.timeline.length,
      data: {
        quizData: {
          sessionCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          questions: [
            {
              id: Math.random().toString(36).substring(2, 15),
              question: "",
              options: [
                {
                  id: "a",
                  text: "",
                  isCorrect: true,
                  color: "#E53E3E",
                  icon: "▲",
                },
                {
                  id: "b",
                  text: "",
                  isCorrect: false,
                  color: "#3182CE",
                  icon: "◆",
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
        },
      },
    };

    setSegmentToEdit(newQuizSegment);
    setShowQuizModal(true);
  }, [event]);

  const handleAddSegment = useCallback(
    (segmentType: string) => {
      if (!event) return;

      const newSegmentId = Math.random().toString(36).substring(2, 15);
      let newSegment: EventSegment;

      switch (segmentType) {
        case "quiz":
          newSegment = {
            id: newSegmentId,
            title: "New Quiz",
            type: "quiz",
            description: "Interactive quiz",
            duration: 15,
            content: "",
            order: event.timeline.length,
            data: {
              quizData: {
                sessionCode: Math.random()
                  .toString(36)
                  .substring(2, 8)
                  .toUpperCase(),
                questions: [
                  {
                    id: Math.random().toString(36).substring(2, 15),
                    question: "",
                    options: [
                      {
                        id: "a",
                        text: "",
                        isCorrect: true,
                        color: "#E53E3E",
                        icon: "▲",
                      },
                      {
                        id: "b",
                        text: "",
                        isCorrect: false,
                        color: "#3182CE",
                        icon: "◆",
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
              },
            },
          };
          break;
        case "poll":
          newSegment = {
            id: newSegmentId,
            title: "New Poll",
            type: "poll",
            description: "Interactive poll",
            duration: 10,
            content: "",
            order: event.timeline.length,
            data: {},
          };
          break;
        case "activity":
          newSegment = {
            id: newSegmentId,
            title: "New Activity",
            type: "activity",
            description: "Interactive activity",
            duration: 20,
            content: "",
            order: event.timeline.length,
            data: {},
          };
          break;
        default:
          newSegment = {
            id: newSegmentId,
            title: "New Game",
            type: "game",
            description: "",
            duration: 10,
            content: "",
            order: event.timeline.length,
            data: {},
          };
      }

      // Add segment to event (optimistic update)
      setEvent((prevEvent) => {
        if (!prevEvent) return prevEvent;
        return {
          ...prevEvent,
          timeline: [...prevEvent.timeline, newSegment],
        };
      });

      // Save to database with debouncing
      setTimeout(() => {
        if (event) {
          const updatedEvent = {
            ...event,
            timeline: [...event.timeline, newSegment],
          };
          console.log("Saving new segment to database:", newSegment.id);
          eventService
            .updateEvent(updatedEvent.id, updatedEvent)
            .catch((error) => {
              console.error("Error saving new segment:", error);
            });
        }
      }, 500); // Small delay to batch with other changes

      // If it's a quiz, edit it immediately
      if (segmentType === "quiz") {
        setSegmentToEdit(newSegment);
        setShowQuizModal(true);
      }
    },
    [event],
  );

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎯</div>
          <h2 className="text-2xl font-bold text-dark-royalty mb-2">
            Loading Quiz Editor...
          </h2>
          <p className="text-deep-sea/70">Getting your quiz ready</p>
        </div>
      </div>
    );
  }

  if (!user || !event || !segmentToEdit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-dark-royalty mb-2">
            Quiz Editor
          </h2>
          <p className="text-deep-sea/70 mb-6">Unable to load quiz data</p>
          <button
            onClick={() => router.replace("/ProfilePage")}
            className="px-6 py-3 bg-dark-royalty text-white rounded-lg hover:bg-dark-royalty/90 transition-all duration-300 text-lg font-medium"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-dark-royalty">
                Quiz Editor
              </h1>
              <p className="text-deep-sea/70 mt-2">
                Create and edit quizzes for: {event.name}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() =>
                  router.replace(`/EventProgram?eventId=${event.id}`)
                }
                className="px-6 py-3 bg-deep-sea text-white rounded-xl hover:bg-deep-sea/90 transition-all duration-300 font-medium"
              >
                Back to Event
              </button>
              <button
                onClick={handleCreateNewQuiz}
                className="px-6 py-3 bg-gradient-to-r from-dark-royalty to-deep-sea text-white rounded-xl hover:from-dark-royalty/90 hover:to-deep-sea/90 transition-all duration-300 font-medium"
              >
                + Create New Quiz
              </button>
            </div>
          </div>
        </div>

        {/* Quiz List */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 border border-dark-royalty/10">
          <h2 className="text-2xl font-bold text-dark-royalty mb-6">
            Existing Quizzes
          </h2>

          {event.timeline.filter((segment) => segment.type === "quiz")
            .length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-dark-royalty mb-2">
                No quizzes yet
              </h3>
              <p className="text-deep-sea/70 mb-6">
                Create your first quiz to get started!
              </p>
              <button
                onClick={handleCreateNewQuiz}
                className="px-8 py-4 bg-gradient-to-r from-dark-royalty to-deep-sea text-white rounded-xl text-lg font-semibold hover:from-dark-royalty/90 hover:to-deep-sea/90 transition-all duration-300 shadow-lg hover:scale-105"
              >
                Create First Quiz
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {event.timeline
                .filter((segment) => segment.type === "quiz")
                .map((segment, index) => (
                  <div
                    key={segment.id}
                    className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-300 hover:shadow-lg hover:bg-white/90"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-dark-royalty to-deep-sea text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-dark-royalty">
                            {segment.title}
                          </h3>
                          <p className="text-deep-sea/70">
                            Duration: {segment.duration} minutes
                          </p>
                          {(
                            segment.data as {
                              quizData?: { sessionCode: string };
                            }
                          )?.quizData && (
                            <p className="text-sm text-deep-sea/50">
                              Session:{" "}
                              {
                                (
                                  segment.data as {
                                    quizData?: { sessionCode: string };
                                  }
                                ).quizData?.sessionCode
                              }
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSegmentToEdit(segment);
                          setShowQuizModal(true);
                        }}
                        className="px-4 py-2 bg-dark-royalty text-white rounded-lg hover:bg-dark-royalty/90 transition-all duration-300 font-medium"
                      >
                        Edit Quiz
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Add Segment Section */}
        <div className="mt-8 flex justify-center">
          <div className="relative group">
            <button className="px-8 py-4 bg-gradient-to-r from-kimchi to-dark-royalty text-white rounded-xl hover:from-kimchi/90 hover:to-dark-royalty/90 transition-all duration-300 font-medium text-lg shadow-lg hover:shadow-xl">
              + Add Segment
            </button>
            <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-lg shadow-xl border border-dark-royalty/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-2">
                <button
                  onClick={() => handleAddSegment("quiz")}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-dark-royalty/10 transition-colors text-dark-royalty font-medium"
                >
                  🎯 Quiz
                </button>
                <button
                  onClick={() => handleAddSegment("poll")}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-dark-royalty/10 transition-colors text-dark-royalty font-medium"
                >
                  📊 Poll
                </button>
                <button
                  onClick={() => handleAddSegment("activity")}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-dark-royalty/10 transition-colors text-dark-royalty font-medium"
                >
                  🎪 Activity
                </button>
                <button
                  onClick={() => handleAddSegment("game")}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-dark-royalty/10 transition-colors text-dark-royalty font-medium"
                >
                  🎮 Game
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Editor - Direct Rendering */}
      {showQuizModal && segmentToEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="max-w-7xl min-h-[800px] w-full">
            <QuizEditor
              segment={segmentToEdit}
              event={event}
              onUpdate={handleSaveQuiz}
              onClose={handleCloseQuizEditor}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🎯</div>
            <h2 className="text-2xl font-bold text-dark-royalty mb-2">
              Loading Quiz...
            </h2>
            <p className="text-deep-sea/70">Setting up your quiz</p>
          </div>
        </div>
      }
    >
      <QuizPageContent />
    </Suspense>
  );
}
