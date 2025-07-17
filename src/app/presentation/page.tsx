"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Event, EventSegment } from "../../types/event";
import { eventService } from "../../services/eventService";
import { useAuth } from "../../hooks/useAuth";

interface SlideData {
  type: 'title' | 'segment' | 'closing' | 'funfact';
  title: string;
  subtitle?: string;
  description?: string;
  duration?: number;
  segmentType?: string;
  speakerNotes?: string;
  // Fun fact specific fields
  funFact?: string;
  guestName?: string;
  guestId?: string;
  showAnswer?: boolean;
}

export default function PresentationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showPresenterNotes, setShowPresenterNotes] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showFunFactAnswer, setShowFunFactAnswer] = useState(false);

  // Get event ID from URL parameters
  const eventId = searchParams.get('eventId');
  const startIndex = parseInt(searchParams.get('startIndex') || '0');

  // Load event data
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (!eventId || !user) return;

    const fetchEvent = async () => {
      try {
        // TEMPORARILY DISABLED FIRESTORE - Using localStorage data
        // const eventData = await eventService.getEvent(eventId);
        
        // Get event data from localStorage (set by newEvent page)
        const storedEventData = localStorage.getItem('currentEvent');
        let mockEventData: Event;
        
        if (storedEventData) {
          // Parse stored event data and convert date strings back to Date objects
          mockEventData = JSON.parse(storedEventData);
          mockEventData.date = new Date(mockEventData.date);
          mockEventData.createdAt = new Date(mockEventData.createdAt);
          mockEventData.updatedAt = new Date(mockEventData.updatedAt);
          console.log("Using stored event data:", mockEventData);
        } else {
          // Fallback to mock data if no stored data
          mockEventData = {
            id: eventId,
            userId: user.uid,
            name: "Test Event Presentation",
            type: "house",
            date: new Date(),
            startTime: "19:00",
            duration: 120,
            venue: "Test Venue",
            tone: "casual",
            guests: [
              { id: "1", name: "Alice", relationship: "Friend" },
              { id: "2", name: "Bob", relationship: "Colleague" }
            ],
            timeline: [
              {
                id: "1",
                type: "welcome",
                title: "Welcome & Greetings",
                description: "Warm welcome to all guests",
                duration: 15,
                content: "Welcome everyone to our event!",
                order: 1,
                isCustom: false
              },
              {
                id: "2", 
                type: "activity",
                title: "Ice Breaker Game",
                description: "Fun activity to get everyone talking",
                duration: 20,
                content: "Let's play Two Truths and a Lie!",
                order: 2,
                isCustom: false
              }
            ],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          console.log("Using fallback mock data:", mockEventData);
        }

        if (mockEventData) {
          setEvent(mockEventData);
          setCurrentSlideIndex(startIndex);
        } else {
          router.push('/newEvent');
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        router.push('/newEvent');
      }
    };

    fetchEvent();
  }, [eventId, user, loading, router, startIndex]);

  // Helper functions
  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEventTypeLabel = (type: string) => {
    const labels = {
      bachelor: "Bachelor(ette) Party",
      theme: "Theme Party",
      house: "House Party",
      roast: "Roast Night",
      prom: "Prom or Formal",
      trivia: "Trivia Night",
      glowup: "Glow-Up Party",
      breakup: "Breakup Bash"
    };
    return labels[type as keyof typeof labels] || "Event";
  };

  const getToneLabel = (tone: string) => {
    const labels = {
      formal: "Formal & Elegant",
      casual: "Casual & Relaxed",
      party: "High Energy Party",
      professional: "Professional",
      wholesome: "Family-Friendly",
      roast: "Playful & Humorous"
    };
    return labels[tone as keyof typeof labels] || tone;
  };

  const getSlideBackground = () => {
    if (!event) return "bg-gradient-to-br from-deep-sea/10 via-white to-kimchi/10";
    
    const toneGradients = {
      formal: "from-blue-50 via-white to-indigo-50",
      casual: "from-green-50 via-white to-emerald-50",
      party: "from-purple-50 via-white to-pink-50",
      professional: "from-gray-50 via-white to-slate-50",
      wholesome: "from-pink-50 via-white to-rose-50",
      roast: "from-orange-50 via-white to-red-50"
    };
    return `bg-gradient-to-br ${toneGradients[event.tone as keyof typeof toneGradients] || "from-deep-sea/10 via-white to-kimchi/10"}`;
  };

  // Generate slides from event data
  const generateSlides = (): SlideData[] => {
    if (!event) return [];
    
    const slides: SlideData[] = [];

    // Title slide
    slides.push({
      type: 'title',
      title: event.name,
      subtitle: `Kickoff: ${formatTime(event.startTime)}`,
      description: `${getEventTypeLabel(event.type)} • ${getToneLabel(event.tone)}`
    });

    // Segment slides
    event.timeline.forEach((segment, index) => {
      slides.push({
        type: 'segment',
        title: segment.title,
        subtitle: `${segment.duration} minutes`,
        description: segment.description,
        duration: segment.duration,
        segmentType: segment.type,
        speakerNotes: segment.content || `Notes for ${segment.title}`
      });

      // Add fun fact slides for segments that have personal fun facts
      if (segment.personalFunFacts && Object.keys(segment.personalFunFacts).length > 0) {
        Object.entries(segment.personalFunFacts).forEach(([guestId, funFact]) => {
          const guest = event.guests.find(g => g.id === guestId);
          if (guest && funFact) {
            slides.push({
              type: 'funfact',
              title: "Personal Fun Fact!",
              duration: 2, // 2 minutes for discussion
              funFact: funFact,
              guestName: guest.name,
              guestId: guestId,
              speakerNotes: `This fun fact belongs to ${guest.name}. Give guests time to discuss and guess before revealing the answer.`
            });
          }
        });
      }
    });

    // Closing slide
    slides.push({
      type: 'closing',
      title: "Thanks for Coming!",
      subtitle: "Event Complete",
      description: "Hope you had a great time! Don't forget to take photos and share memories."
    });

    return slides;
  };

  const slides = generateSlides();
  const currentSlide = slides[currentSlideIndex];

  // Keyboard navigation
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        goToPreviousSlide();
        break;
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
        e.preventDefault();
        goToNextSlide();
        break;
      case 'Escape':
        setShowExitModal(true);
        break;
      case 'n':
      case 'N':
        togglePresenterNotes();
        break;
      case 'r':
      case 'R':
        if (currentSlide?.type === 'funfact') {
          toggleFunFactAnswer();
        }
        break;
    }
  }, [currentSlideIndex, currentSlide?.type]);

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

  // Navigation functions
  const goToPreviousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
      setShowControls(true);
      setShowFunFactAnswer(false);
      setTimeout(() => setShowControls(false), 3000);
    }
  };

  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
      setShowControls(true);
      setShowFunFactAnswer(false);
      setTimeout(() => setShowControls(false), 3000);
    }
  };

  const togglePresenterNotes = () => {
    setShowPresenterNotes(!showPresenterNotes);
  };

  const toggleFunFactAnswer = () => {
    setShowFunFactAnswer(!showFunFactAnswer);
  };

  const handleExit = () => {
    router.push('/newEvent');
  };

  // Event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Auto-hide controls
  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [currentSlideIndex]);

  // Loading state
  if (loading || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎬</div>
          <h2 className="text-2xl font-bold text-dark-royalty mb-2">Loading Presentation...</h2>
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
          <h2 className="text-2xl font-bold text-dark-royalty mb-2">No Slides Available</h2>
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
    <div 
      className={`fixed inset-0 ${getSlideBackground()} transition-all duration-500`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => setShowControls(true)}
    >
      {/* Main Slide Content */}
      <div className="h-full flex flex-col items-center justify-center p-8 relative">
        {/* Slide Number Indicator */}
        <div className="absolute top-4 left-4 text-deep-sea/60 text-sm font-medium">
          {currentSlideIndex + 1} / {slides.length}
        </div>

        {/* Slide Content */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Title */}
          <h1 className="text-6xl font-bold text-dark-royalty mb-4 leading-tight">
            {currentSlide.title}
          </h1>

          {/* Description */}
          {currentSlide.description && (
            <p className="text-xl text-deep-sea/70 leading-relaxed max-w-2xl mx-auto">
              {currentSlide.description}
            </p>
          )}

          {/* Fun Fact specific content */}
          {currentSlide.type === 'funfact' && (
            <div className="mt-8 space-y-6">
              {/* Fun Fact Display */}
              <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-8 border border-dark-royalty/20">
                <p className="text-2xl text-dark-royalty font-medium leading-relaxed">
                  "{currentSlide.funFact}"
                </p>
              </div>

              {/* Answer Section */}
              {showFunFactAnswer ? (
                <div className="bg-green-50/80 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 animate-pulse">
                  <h3 className="text-3xl font-bold text-green-700 mb-2">{currentSlide.guestName}</h3>
                </div>
              ) : (
                <div className="bg-yellow-50/80 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30">
                  <h3 className="text-xl font-bold text-yellow-700 mb-2">Take Your Guess!</h3>
                  <p className="text-lg text-yellow-600">
                    Discuss with the group and try to guess who this fun fact belongs to!
                  </p>
                </div>
              )}

              {/* Controls */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={toggleFunFactAnswer}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 font-medium ${
                    showFunFactAnswer 
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {showFunFactAnswer ? 'Hide Answer' : 'Reveal Answer'} (R)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Presenter Notes Overlay */}
        {showPresenterNotes && currentSlide.speakerNotes && (
          <div className="absolute bottom-20 left-4 right-4 bg-black/80 text-white p-6 rounded-xl backdrop-blur-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold">Presenter Notes</h3>
              <button
                onClick={togglePresenterNotes}
                className="text-white/60 hover:text-white"
              >
                ×
              </button>
            </div>
            <p className="text-sm leading-relaxed">{currentSlide.speakerNotes}</p>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-dark-royalty/20 p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Previous Button */}
            <button
              onClick={goToPreviousSlide}
              disabled={currentSlideIndex === 0}
              className="px-6 py-3 bg-white/50 text-dark-royalty rounded-xl hover:bg-white/70 transition-all duration-300 font-medium border border-dark-royalty/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            {/* Progress Indicator */}
            <div className="flex space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlideIndex 
                      ? 'bg-dark-royalty' 
                      : 'bg-deep-sea/30 hover:bg-deep-sea/50'
                  }`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={goToNextSlide}
              disabled={currentSlideIndex === slides.length - 1}
              className="px-6 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>

          {/* Additional Controls */}
          <div className="flex justify-center space-x-4 mt-2">
            <button
              onClick={togglePresenterNotes}
              className="px-4 py-2 bg-white/50 text-dark-royalty rounded-lg hover:bg-white/70 transition-all duration-300 text-sm font-medium border border-dark-royalty/20"
            >
              {showPresenterNotes ? 'Hide' : 'Show'} Notes (N)
            </button>
            {currentSlide.type === 'funfact' && (
              <button
                onClick={toggleFunFactAnswer}
                className={`px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium border ${
                  showFunFactAnswer 
                    ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20' 
                    : 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20'
                }`}
              >
                {showFunFactAnswer ? 'Hide' : 'Reveal'} Answer (R)
              </button>
            )}
            <button
              onClick={() => setShowExitModal(true)}
              className="px-4 py-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition-all duration-300 text-sm font-medium border border-red-500/20"
            >
              Exit (Esc)
            </button>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-dark-royalty/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-dark-royalty mb-4">End Presentation?</h2>
            <p className="text-deep-sea/70 mb-6">
              You can resume from where you left off, or end the presentation and return to the event dashboard.
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
  );
} 