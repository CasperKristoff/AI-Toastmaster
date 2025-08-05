import React, { useState } from "react";
import { Event } from "../../../types/event";
import { useRouter } from "next/navigation";

interface PresentationPreviewProps {
  event: Event;
}

interface SlideData {
  type: "title" | "segment" | "closing" | "funfact";
  title: string;
  subtitle?: string;
  description?: string;
  duration?: number;
  segmentType?: string;
  speakerNotes?: string;
  funFact?: string;
  guestName?: string;
  guestId?: string;
  showAnswer?: boolean;
}

export default function PresentationPreview({
  event,
}: PresentationPreviewProps) {
  const router = useRouter();
  const [currentPreviewSlide, setCurrentPreviewSlide] = useState(0);

  // Helper functions
  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getEventTypeLabel = () => {
    return "Event";
  };

  const getToneLabel = () => {
    return "Event";
  };

  const getSlideBackground = () => {
    return "bg-gradient-to-br from-deep-sea/10 via-white to-kimchi/10";
  };

  // Generate slides from event data
  const generateSlides = (): SlideData[] => {
    const slides: SlideData[] = [];

    // Title slide
    slides.push({
      type: "title",
      title: event.name,
      subtitle: `Kickoff: ${formatTime(event.startTime)}`,
      description: `${getEventTypeLabel()} • ${getToneLabel()}`,
    });

    // Segment slides
    event.timeline.forEach((segment) => {
      slides.push({
        type: "segment",
        title: segment.title,
        subtitle: `${segment.duration} minutes`,
        description: segment.description,
        duration: segment.duration,
        segmentType: segment.type,
        speakerNotes: segment.content || `Notes for ${segment.title}`,
      });

      // Add fun fact slides for segments that have personal fun facts
      if (
        segment.personalFunFacts &&
        Object.keys(segment.personalFunFacts).length > 0
      ) {
        Object.entries(segment.personalFunFacts).forEach(
          ([guestId, funFact]) => {
            const guest = event.guests.find((g) => g.id === guestId);
            if (guest && funFact) {
              slides.push({
                type: "funfact",
                title: "Personal Fun Fact!",
                duration: 2,
                funFact: funFact,
                guestName: guest.name,
                guestId: guestId,
                speakerNotes: `This fun fact belongs to ${guest.name}. Give guests time to discuss and guess before revealing the answer.`,
              });
            }
          },
        );
      }
    });

    // Closing slide
    slides.push({
      type: "closing",
      title: "Thanks for Coming!",
      subtitle: "Event Complete",
      description:
        "Hope you had a great time! Don't forget to take photos and share memories.",
    });

    return slides;
  };

  const slides = generateSlides();
  const currentSlide = slides[currentPreviewSlide];

  // Auto-advance preview slides
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPreviewSlide((prev) => (prev + 1) % slides.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  const handleStartPresentation = () => {
    router.push(`/presentation?eventId=${event.id}&startIndex=0`);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-dark-royalty">
            Presentation Preview
          </h2>
          <p className="text-deep-sea/70 mt-2">
            See how your presentation will look
          </p>
        </div>
        <button
          onClick={handleStartPresentation}
          className="px-8 py-4 bg-gradient-to-r from-dark-royalty to-deep-sea text-white rounded-xl text-lg font-semibold hover:from-dark-royalty/90 hover:to-deep-sea/90 transition-all duration-300 shadow-lg hover:scale-105 flex items-center space-x-3"
        >
          <span className="text-2xl">🎬</span>
          <span>Presentation</span>
        </button>
      </div>

      {/* Preview Container */}
      <div className="relative">
        {/* Preview Window */}
        <div
          className={`relative w-full max-w-4xl mx-auto aspect-video ${getSlideBackground()} rounded-2xl border-2 border-dark-royalty/20 shadow-2xl overflow-hidden`}
        >
          {/* Slide Content */}
          <div className="h-full flex flex-col items-center justify-center p-8 relative">
            {/* Slide Number Indicator */}
            <div className="absolute top-4 left-4 text-deep-sea/60 text-sm font-medium">
              {currentPreviewSlide + 1} / {slides.length}
            </div>

            {/* Slide Content */}
            <div className="text-center max-w-3xl mx-auto">
              {/* Title */}
              <h1 className="text-4xl font-bold text-dark-royalty mb-4 leading-tight">
                {currentSlide.title}
              </h1>

              {/* Description */}
              {currentSlide.description && (
                <p className="text-lg text-deep-sea/70 leading-relaxed max-w-2xl mx-auto">
                  {currentSlide.description}
                </p>
              )}

              {/* Fun Fact specific content */}
              {currentSlide.type === "funfact" && (
                <div className="mt-6 space-y-4">
                  <div className="bg-white/30 backdrop-blur-sm rounded-xl p-6 border border-dark-royalty/20">
                    <p className="text-lg text-dark-royalty font-medium leading-relaxed">
                      &quot;{currentSlide.funFact}&quot;
                    </p>
                  </div>
                  <div className="bg-yellow-50/80 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30">
                    <h3 className="text-lg font-bold text-yellow-700 mb-1">
                      Take Your Guess!
                    </h3>
                    <p className="text-sm text-yellow-600">
                      Discuss with the group and try to guess who this fun fact
                      belongs to!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Overlay */}
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-sm text-dark-royalty font-medium">
                  Preview Mode
                </p>
                <p className="text-xs text-deep-sea/60">
                  Slides auto-advance every 3 seconds
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Controls */}
        <div className="flex justify-center mt-6 space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPreviewSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentPreviewSlide
                  ? "bg-dark-royalty"
                  : "bg-deep-sea/30 hover:bg-deep-sea/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Presentation Info */}
      <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10">
        <h3 className="text-xl font-bold text-dark-royalty mb-4">
          Presentation Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-deep-sea/60">Total Slides:</span>
            <span className="ml-2 font-medium text-dark-royalty">
              {slides.length}
            </span>
          </div>
        </div>
        <div className="mt-4 p-4 bg-deep-sea/10 rounded-xl">
          <p className="text-sm text-deep-sea/70">
            💡 <strong>Tip:</strong> Use arrow keys or spacebar to navigate
            during the presentation. Press &apos;N&apos; to toggle presenter
            notes, and &apos;R&apos; to reveal fun fact answers.
          </p>
        </div>
      </div>
    </div>
  );
}
