"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Event } from "../../types/event";
import { eventService } from "../../services/eventService";
import { useAuth } from "../../hooks/useAuth";
import { SpinTheWheelPresentation } from "../EventProgram/components/SpinTheWheel";
import SlideShowPresentation from "../EventProgram/components/SlideShowPresentation";
import JeopardyPresentation from "../EventProgram/components/JeopardyPresentation";
import Poll from "../EventProgram/components/Poll";
import QuizPresentation from "../QuizApp/components/QuizPresentation";
import QuizPresentationPreview from "../QuizApp/components/QuizPresentationPreview";
import {
  TileState,
  TileOriginalState,
  JeopardyCategory,
  JeopardyQuestion,
} from "./components/PresentationTypes";
import { generateSlides } from "./components/SlideGenerator";
import { useFullScreenManager } from "./components/FullScreenManager";

function PresentationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showPresenterNotes, setShowPresenterNotes] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showFunFactAnswer, setShowFunFactAnswer] = useState(false);
  const [quizMode, setQuizMode] = useState<"preview" | "active" | "complete">(
    "active",
  ); // Start directly in active mode for testing
  const {
    isFullScreen,
    showFullScreenPrompt,
    setShowFullScreenPrompt,
    enterFullScreen,
    exitFullScreen,
  } = useFullScreenManager();

  // Jeopardy state persistence
  const [jeopardyTileStates, setJeopardyTileStates] = useState<TileState>({});
  const [jeopardyOriginalCompletedStates, setJeopardyOriginalCompletedStates] =
    useState<TileOriginalState>({});
  const [jeopardyInitialized, setJeopardyInitialized] = useState(false);

  // Get event ID from URL parameters
  const eventId = searchParams.get("eventId");
  const startIndex = parseInt(searchParams.get("startIndex") || "0");

  // Initialize Jeopardy state from localStorage or create new
  const initializeJeopardyState = useCallback(
    (categories: JeopardyCategory[]) => {
      if (!eventId) return;

      const storageKey = `jeopardy-state-${eventId}`;
      const savedState = localStorage.getItem(storageKey);

      // For presentation mode, we want to start fresh by default
      // but allow loading previous state if it exists and is recent
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          const timestamp = parsedState.timestamp || 0;
          const now = Date.now();
          const hoursSinceLastSave = (now - timestamp) / (1000 * 60 * 60);

          // If the saved state is from the same session (within 1 hour), load it
          // Otherwise, start fresh for presentation mode
          if (hoursSinceLastSave < 1) {
            setJeopardyTileStates(parsedState.tileStates || {});
            setJeopardyOriginalCompletedStates(
              parsedState.originalCompletedStates || {},
            );
          } else {
            // Start fresh for presentation mode
            const initialStates: TileState = {};
            const initialCompletedStates: TileOriginalState = {};
            categories.forEach((category) => {
              category.questions.forEach((question: JeopardyQuestion) => {
                initialStates[question.id] = "hidden";
                initialCompletedStates[question.id] = false;
              });
            });
            setJeopardyTileStates(initialStates);
            setJeopardyOriginalCompletedStates(initialCompletedStates);
          }
        } catch (error) {
          console.error("Error parsing saved Jeopardy state:", error);
          // Fallback to fresh state
          const initialStates: TileState = {};
          const initialCompletedStates: TileOriginalState = {};
          categories.forEach((category) => {
            category.questions.forEach((question: JeopardyQuestion) => {
              initialStates[question.id] = "hidden";
              initialCompletedStates[question.id] = false;
            });
          });
          setJeopardyTileStates(initialStates);
          setJeopardyOriginalCompletedStates(initialCompletedStates);
        }
      } else {
        // Create fresh state
        const initialStates: TileState = {};
        const initialCompletedStates: TileOriginalState = {};
        categories.forEach((category) => {
          category.questions.forEach((question: JeopardyQuestion) => {
            initialStates[question.id] = "hidden";
            initialCompletedStates[question.id] = false;
          });
        });
        setJeopardyTileStates(initialStates);
        setJeopardyOriginalCompletedStates(initialCompletedStates);
      }
    },
    [eventId],
  );

  // Save Jeopardy state to localStorage
  const saveJeopardyState = useCallback(
    (tileStates: TileState, originalCompletedStates: TileOriginalState) => {
      if (!eventId) return;

      const storageKey = `jeopardy-state-${eventId}`;
      const stateToSave = {
        tileStates,
        originalCompletedStates,
        timestamp: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    },
    [eventId],
  );

  // Reset Jeopardy state to fresh
  const _resetJeopardyState = useCallback(
    (categories: JeopardyCategory[]) => {
      if (!eventId) return;

      const initialStates: TileState = {};
      const initialCompletedStates: TileOriginalState = {};
      categories.forEach((category) => {
        category.questions.forEach((question: JeopardyQuestion) => {
          initialStates[question.id] = "hidden";
          initialCompletedStates[question.id] = false;
        });
      });
      setJeopardyTileStates(initialStates);
      setJeopardyOriginalCompletedStates(initialCompletedStates);

      // Save the reset state
      saveJeopardyState(initialStates, initialCompletedStates);
    },
    [eventId, saveJeopardyState],
  );

  // Auto-enter full screen after a short delay
  useEffect(() => {
    if (event && !isFullScreen) {
      const timer = setTimeout(() => {
        setShowFullScreenPrompt(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [event, isFullScreen, setShowFullScreenPrompt]);

  // Load event data
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }

    if (!eventId || !user) return;

    const fetchEvent = async () => {
      try {
        // Get event data from Firestore
        const eventData = await eventService.getEvent(eventId);

        if (eventData) {
          setEvent(eventData);
          setCurrentSlideIndex(startIndex);
        } else {
          // Redirect back to EventProgram if we have an eventId, otherwise to newEvent
          if (eventId) {
            router.push(`/EventProgram?eventId=${eventId}`);
          } else {
            router.push("/newEvent");
          }
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        // Redirect back to EventProgram if we have an eventId, otherwise to newEvent
        if (eventId) {
          router.push(`/EventProgram?eventId=${eventId}`);
        } else {
          router.push("/newEvent");
        }
      }
    };

    fetchEvent();
  }, [eventId, user, loading, router, startIndex]);

  // Initialize Jeopardy state when event is loaded
  useEffect(() => {
    if (event && !jeopardyInitialized) {
      // Find Jeopardy segments and initialize state
      const jeopardySegments = event.timeline.filter(
        (segment) => segment.type === "game" && segment.title === "Jeopardy",
      );

      if (jeopardySegments.length > 0) {
        try {
          const jeopardyData = JSON.parse(jeopardySegments[0].content);
          const categories = jeopardyData.categories || [];
          if (categories.length > 0) {
            initializeJeopardyState(categories);
            setJeopardyInitialized(true);
          }
        } catch (error) {
          console.error(
            "Error parsing Jeopardy data for initialization:",
            error,
          );
        }
      }
    }
  }, [event, jeopardyInitialized, initializeJeopardyState]);

  // Helper functions
  const getSlideBackground = () => {
    return "bg-gradient-to-br from-deep-sea/10 via-white to-kimchi/10";
  };

  // Generate slides from event data
  const slides = event ? generateSlides(event) : [];
  const currentSlide = slides[currentSlideIndex];

  // Navigation functions
  const goToPreviousSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
      setShowFunFactAnswer(false);
      setQuizMode("preview"); // Reset quiz mode when navigating
    }
  }, [currentSlideIndex]);

  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
      setShowFunFactAnswer(false);
      setQuizMode("preview"); // Reset quiz mode when navigating
    }
  }, [currentSlideIndex, slides.length]);

  // Quiz state handlers
  const handleStartQuiz = useCallback(() => {
    setQuizMode("active");
  }, []);

  const handleQuizComplete = useCallback(() => {
    setQuizMode("complete");
  }, []);

  const togglePresenterNotes = useCallback(() => {
    setShowPresenterNotes(!showPresenterNotes);
  }, [showPresenterNotes]);

  const toggleFunFactAnswer = useCallback(() => {
    setShowFunFactAnswer(!showFunFactAnswer);
  }, [showFunFactAnswer]);

  // Set document title based on slide type
  useEffect(() => {
    if (currentSlide) {
      document.title = `AI Toastmaster - ${currentSlide.title}`;
    }
  }, [currentSlide]);

  // Keyboard navigation
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          goToPreviousSlide();
          break;
        case "ArrowRight":
        case "ArrowDown":
        case " ":
          e.preventDefault();
          goToNextSlide();
          break;
        case "Escape":
          if (isFullScreen) {
            exitFullScreen();
          } else {
            setShowExitModal(true);
          }
          break;
        case "f":
        case "F":
          if (isFullScreen) {
            exitFullScreen();
          } else {
            enterFullScreen();
          }
          break;
        case "n":
        case "N":
          togglePresenterNotes();
          break;
        case "r":
        case "R":
          if (currentSlide?.type === "funfact") {
            toggleFunFactAnswer();
          }
          break;
        case "s":
        case "S":
          if (currentSlide?.type === "spinthewheel") {
            // Trigger spin from parent component
            const spinButton = document.querySelector(
              "[data-spin-wheel]",
            ) as HTMLButtonElement;
            if (spinButton && !spinButton.disabled) {
              spinButton.click();
            }
          }
          break;
        case "j":
        case "J":
          if (currentSlide?.type === "jeopardy") {
            // Trigger Jeopardy tile click (first available hidden tile)
            const hiddenTile = document.querySelector(
              '[data-jeopardy-tile="hidden"]',
            ) as HTMLButtonElement;
            if (hiddenTile && !hiddenTile.disabled) {
              hiddenTile.click();
            }
          }
          break;
        case "q":
        case "Q":
          if (currentSlide?.type === "quiz" && quizMode === "active") {
            // Trigger quiz navigation (Next/Previous)
            const nextButton = document.querySelector(
              "[data-quiz-next]",
            ) as HTMLButtonElement;
            if (nextButton && !nextButton.disabled) {
              nextButton.click();
            }
          }
          break;
      }
    },
    [
      currentSlide?.type,
      goToNextSlide,
      goToPreviousSlide,
      toggleFunFactAnswer,
      togglePresenterNotes,
      isFullScreen,
      enterFullScreen,
      exitFullScreen,
      quizMode,
    ],
  );

  // Touch/swipe navigation
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNextSlide();
    } else if (isRightSwipe) {
      goToPreviousSlide();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleExit = () => {
    if (isFullScreen) {
      exitFullScreen();
    }
    // Redirect back to the EventProgram page for the same event
    if (eventId) {
      router.push(`/EventProgram?eventId=${eventId}`);
    } else {
      router.push("/newEvent");
    }
  };

  // Event listeners
  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // Loading state
  if (loading || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎬</div>
          <h2 className="text-2xl font-bold text-dark-royalty mb-2">
            Loading Presentation...
          </h2>
          <p className="text-deep-sea/70">Getting your event ready</p>
        </div>
      </div>
    );
  }

  if (!currentSlide) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-dark-royalty mb-2">
            No Slides Available
          </h2>
          <p className="text-deep-sea/70">Please check your event setup</p>
          <button
            onClick={handleExit}
            className="mt-4 px-6 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Full Screen Prompt */}
      {showFullScreenPrompt && !isFullScreen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-dark-royalty/20 shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">🖥️</div>
              <h2 className="text-2xl font-bold text-dark-royalty mb-4">
                Enter Full Screen Mode
              </h2>
              <p className="text-deep-sea/70 mb-6">
                For the best presentation experience, we recommend viewing in
                full screen mode.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowFullScreenPrompt(false)}
                  className="flex-1 px-6 py-3 bg-white/50 text-dark-royalty rounded-xl hover:bg-white/70 transition-all duration-300 font-medium border border-dark-royalty/20"
                >
                  Skip
                </button>
                <button
                  onClick={enterFullScreen}
                  className="flex-1 px-6 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 font-medium"
                >
                  Enter Full Screen
                </button>
              </div>
              <p className="text-xs text-deep-sea/50 mt-4">
                Press F to toggle full screen anytime • Press ESC to exit •
                Press Q during quiz for navigation
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quiz specific content - Rendered at root level for full control */}
      {currentSlide.type === "quiz" && (
        <>
          {quizMode === "preview" && (
            <div className="absolute inset-0 z-10">
              <QuizPresentationPreview
                segment={{
                  id: "presentation-quiz",
                  title: "Live Quiz",
                  type: "quiz",
                  description: currentSlide.description || "",
                  duration: currentSlide.duration || 10,
                  content: "",
                  order: 0,
                  data: { quizData: currentSlide.quizData || null },
                }}
                event={event}
                onStartQuiz={handleStartQuiz}
              />
            </div>
          )}
          {quizMode === "active" && (
            <div className="absolute inset-0 z-10">
              <QuizPresentation
                segment={{
                  id: "presentation-quiz",
                  title: "Live Quiz",
                  type: "quiz",
                  description: currentSlide.description || "",
                  duration: currentSlide.duration || 10,
                  content: "",
                  order: 0,
                  data: { quizData: currentSlide.quizData || null },
                }}
                event={event}
                onQuizComplete={handleQuizComplete}
              />
            </div>
          )}
          {quizMode === "complete" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
              <h2 className="text-7xl font-bold text-dark-royalty mb-8 leading-tight tracking-tight text-center">
                Quiz Complete
              </h2>
              <p className="text-2xl text-deep-sea/70 text-center">
                Thanks for participating!
              </p>
            </div>
          )}
        </>
      )}

      {/* Main Presentation - Only show when not in active quiz mode */}
      {!(currentSlide.type === "quiz" && quizMode === "active") && (
        <div
          className={`fixed inset-0 ${getSlideBackground()} transition-all duration-500`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Full Screen Indicator */}
          {!isFullScreen && (
            <div className="absolute top-4 right-16 pointer-events-none">
              <div className="bg-black/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                Press F for full screen
              </div>
            </div>
          )}

          {/* Main Slide Content */}
          <div className="h-full flex flex-col items-center justify-center p-12 relative">
            {/* Slide Number Indicator */}
            <div className="absolute top-6 left-6 text-deep-sea/60 text-sm font-medium">
              {currentSlideIndex + 1} / {slides.length}
            </div>

            {/* Slide Content - Only for non-quiz slides */}
            {currentSlide.type !== "quiz" && (
              <div className="text-center w-full max-w-6xl mx-auto px-4">
                {/* Title - Show for all slides */}
                {currentSlide.type === "title" ? (
                  <h1 className="text-7xl font-bold text-dark-royalty mb-8 leading-tight tracking-tight">
                    {currentSlide.title}
                  </h1>
                ) : (
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
                    {currentSlide.title}
                  </h1>
                )}

                {/* Description */}
                {currentSlide.description && (
                  <p className="text-2xl text-deep-sea/70 leading-relaxed max-w-3xl mx-auto mb-12">
                    {currentSlide.description}
                  </p>
                )}

                {/* Fun Fact specific content */}
                {currentSlide.type === "funfact" && (
                  <div className="mt-12 space-y-10 max-w-4xl mx-auto">
                    {/* Fun Fact Display */}
                    <div className="bg-white/30 backdrop-blur-sm rounded-3xl p-10 border-2 border-dark-royalty/20 shadow-lg">
                      <p className="text-3xl text-dark-royalty font-medium leading-relaxed">
                        &quot;{currentSlide.funFact}&quot;
                      </p>
                    </div>

                    {/* Answer Section */}
                    {showFunFactAnswer ? (
                      <div className="bg-green-50/80 backdrop-blur-sm rounded-3xl p-8 border-2 border-green-500/30 animate-pulse shadow-lg">
                        <h3 className="text-4xl font-bold text-green-700 mb-2">
                          {currentSlide.guestName}
                        </h3>
                      </div>
                    ) : (
                      <div className="bg-yellow-50/80 backdrop-blur-sm rounded-3xl p-8 border-2 border-yellow-500/30 shadow-lg">
                        <h3 className="text-2xl font-bold text-yellow-700 mb-4">
                          Take Your Guess!
                        </h3>
                        <p className="text-xl text-yellow-600">
                          Discuss with the group and try to guess who this fun
                          fact belongs to!
                        </p>
                      </div>
                    )}

                    {/* Controls */}
                    <div className="flex justify-center space-x-6 mt-8">
                      <button
                        onClick={toggleFunFactAnswer}
                        className={`px-8 py-4 rounded-2xl transition-all duration-300 font-medium text-lg shadow-lg ${
                          showFunFactAnswer
                            ? "bg-yellow-500 text-white hover:bg-yellow-600"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                      >
                        {showFunFactAnswer ? "Hide Answer" : "Reveal Answer"}{" "}
                        (R)
                      </button>
                    </div>
                  </div>
                )}

                {/* Spin The Wheel specific content */}
                {currentSlide.type === "spinthewheel" && (
                  <SpinTheWheelPresentation
                    challenge={currentSlide.challenge || ""}
                    guests={currentSlide.guests || []}
                  />
                )}

                {/* Slide Show specific content */}
                {currentSlide.type === "slideshow" && (
                  <SlideShowPresentation
                    photoUrls={currentSlide.photoUrls || []}
                  />
                )}

                {/* Jeopardy specific content */}
                {currentSlide.type === "jeopardy" && (
                  <JeopardyPresentation
                    categories={currentSlide.jeopardyCategories || []}
                    tileStates={jeopardyTileStates}
                    setTileStates={setJeopardyTileStates}
                    originalCompletedStates={jeopardyOriginalCompletedStates}
                    setOriginalCompletedStates={
                      setJeopardyOriginalCompletedStates
                    }
                    onStateChange={saveJeopardyState}
                  />
                )}

                {/* Poll specific content */}
                {currentSlide.type === "poll" && currentSlide.pollData && (
                  <Poll
                    segment={{
                      id: "presentation-poll",
                      title: "Live Poll",
                      type: "poll",
                      description: currentSlide.description || "",
                      duration: currentSlide.duration || 10,
                      content: "",
                      order: 0,
                      data: currentSlide.pollData,
                    }}
                    event={event}
                    isEditMode={false}
                  />
                )}
              </div>
            )}

            {/* Presenter Notes Overlay */}
            {showPresenterNotes && currentSlide.speakerNotes && (
              <div className="absolute bottom-24 left-8 right-8 bg-black/85 text-white p-8 rounded-2xl backdrop-blur-md shadow-2xl border border-white/10">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold tracking-wide">
                    Presenter Notes
                  </h3>
                  <button
                    onClick={togglePresenterNotes}
                    className="text-white/60 hover:text-white text-2xl transition-colors duration-200"
                  >
                    ×
                  </button>
                </div>
                <p className="text-base leading-relaxed tracking-wide">
                  {currentSlide.speakerNotes}
                </p>
              </div>
            )}
          </div>

          {/* Slick Navigation Arrows */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Previous Arrow */}
            <button
              onClick={goToPreviousSlide}
              disabled={currentSlideIndex === 0}
              className={`absolute left-8 top-1/2 transform -translate-y-1/2 pointer-events-auto transition-all duration-300 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-4 rounded-2xl shadow-lg ${
                currentSlideIndex === 0
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:scale-110"
              }`}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-dark-royalty"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* Next Arrow */}
            <button
              onClick={goToNextSlide}
              disabled={currentSlideIndex === slides.length - 1}
              className={`absolute right-8 top-1/2 transform -translate-y-1/2 pointer-events-auto transition-all duration-300 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-4 rounded-2xl shadow-lg ${
                currentSlideIndex === slides.length - 1
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:scale-110"
              }`}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-dark-royalty"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Exit Button */}
            <button
              onClick={() => setShowExitModal(true)}
              className="absolute top-6 right-6 pointer-events-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-110"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-dark-royalty"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Exit Confirmation Modal */}
          {showExitModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-dark-royalty/20 shadow-2xl">
                <h2 className="text-2xl font-bold text-dark-royalty mb-4">
                  End Presentation?
                </h2>
                <p className="text-deep-sea/70 mb-6">
                  You can resume from where you left off, or end the
                  presentation and return to the event dashboard.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowExitModal(false)}
                    className="flex-1 px-6 py-3 bg-white/50 text-dark-royalty rounded-xl hover:bg-white/70 transition-all duration-300 font-medium border border-dark-royalty/20"
                  >
                    Resume
                  </button>
                  <button
                    onClick={handleExit}
                    className="flex-1 px-6 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 font-medium"
                  >
                    End & Return
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function PresentationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🎬</div>
            <h2 className="text-2xl font-bold text-dark-royalty mb-2">
              Loading Presentation...
            </h2>
            <p className="text-deep-sea/70">Getting your slides ready</p>
          </div>
        </div>
      }
    >
      <PresentationPageContent />
    </Suspense>
  );
}
