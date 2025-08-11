import { Event } from "../../../types/event";
import { SlideData } from "./PresentationTypes";

export const formatTime = (time: string) => {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const getEventTypeLabel = () => {
  return "Event";
};

export const getToneLabel = () => {
  return "Event";
};

export const generateSlides = (event: Event): SlideData[] => {
  if (!event) return [];

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
    // Special handling for Spin The Wheel segments
    if (segment.type === "game" && segment.title === "Spin The Wheel") {
      slides.push({
        type: "spinthewheel",
        title: "Spin The Wheel!",
        subtitle: `${segment.duration} minutes`,
        description: segment.description,
        duration: segment.duration,
        challenge: segment.description,
        guests: event.guests,
        speakerNotes: `Challenge: ${segment.description}. Spin the wheel to randomly select a guest who must complete the challenge.`,
      });
    }
    // Special handling for Jeopardy segments
    else if (segment.type === "game" && segment.title === "Jeopardy") {
      try {
        // Only try to parse if content exists and looks like JSON
        if (segment.content && segment.content.trim().startsWith("{")) {
          const jeopardyData = JSON.parse(segment.content);
          const categories = jeopardyData.categories || [];

          slides.push({
            type: "jeopardy",
            title: "Jeopardy!",
            subtitle: `${segment.duration} minutes`,
            description: segment.description,
            duration: segment.duration,
            jeopardyCategories: categories,
            speakerNotes: `Click on any tile to reveal the question. Click again to show the answer. Mark as complete when done.`,
          });
        } else {
          // Fallback to generic segment if content is not JSON
          slides.push({
            type: "segment",
            title: segment.title,
            subtitle: `${segment.duration} minutes`,
            description: segment.description,
            duration: segment.duration,
            segmentType: segment.type,
            speakerNotes: segment.content || `Notes for ${segment.title}`,
          });
        }
      } catch (error) {
        console.error("Error parsing Jeopardy data:", error);
        slides.push({
          type: "segment",
          title: segment.title,
          subtitle: `${segment.duration} minutes`,
          description: segment.description,
          duration: segment.duration,
          segmentType: segment.type,
          speakerNotes: segment.content || `Notes for ${segment.title}`,
        });
      }
    }
    // Special handling for Slide Show segments
    else if (segment.type === "activity" && segment.title === "Slide Show") {
      try {
        // Only try to parse if content exists and looks like JSON
        if (segment.content && segment.content.trim().startsWith("{")) {
          const slideShowData = JSON.parse(segment.content);
          slides.push({
            type: "slideshow",
            title: "Photo Show!",
            subtitle: `${segment.duration} minutes`,
            description: segment.description,
            duration: segment.duration,
            photoUrls: slideShowData.photoUrls || [],
            speakerNotes: `Enjoy the slideshow! Photos will auto-advance every 3 seconds. Use arrow keys or click to navigate manually.`,
          });
        } else {
          // Fallback to generic segment if content is not JSON
          slides.push({
            type: "segment",
            title: segment.title,
            subtitle: `${segment.duration} minutes`,
            description: segment.description,
            duration: segment.duration,
            segmentType: segment.type,
            speakerNotes: segment.content || `Notes for ${segment.title}`,
          });
        }
      } catch (error) {
        console.error("Error parsing slideshow data:", error);
        slides.push({
          type: "segment",
          title: segment.title,
          subtitle: `${segment.duration} minutes`,
          description: segment.description,
          duration: segment.duration,
          segmentType: segment.type,
          speakerNotes: segment.content || `Notes for ${segment.title}`,
        });
      }
    }
    // Special handling for Poll segments
    else if (segment.type === "poll") {
      try {
        const pollData = segment.data as {
          question: string;
          options: string[];
          showResultsLive: boolean;
          allowMultipleSelections: boolean;
          sessionCode: string;
          votes: Record<string, number>;
          totalVotes: number;
        };

        slides.push({
          type: "poll",
          title: "Live Poll!",
          subtitle: `${segment.duration} minutes`,
          description: "",
          duration: segment.duration,
          pollData: pollData,
          speakerNotes: `Guests can scan the QR code to vote. Results will update in real-time.`,
        });
      } catch (error) {
        console.error("Error parsing poll data:", error);
        slides.push({
          type: "segment",
          title: segment.title,
          subtitle: `${segment.duration} minutes`,
          description: segment.description,
          duration: segment.duration,
          segmentType: segment.type,
          speakerNotes: segment.content || `Notes for ${segment.title}`,
        });
      }
    }
    // Special handling for Quiz segments
    else if (segment.type === "quiz") {
      try {
        const quizData = segment.data?.quizData as {
          sessionCode: string;
          questions: {
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
            media?:
              | string
              | {
                  url: string;
                  type: "image" | "video";
                };
          }[];
          currentQuestionIndex: number;
          isActive: boolean;
          responses: Record<string, Record<string, string>>;
          scores: Record<string, number>;
        };

        // Always create a quiz slide for quiz segments, even if empty
        slides.push({
          type: "quiz",
          title: "Quiz Time!",
          subtitle: `${segment.duration} minutes`,
          description: "",
          duration: segment.duration,
          quizData: quizData || {
            sessionCode: Math.random()
              .toString(36)
              .substring(2, 8)
              .toUpperCase(),
            questions: [],
            currentQuestionIndex: 0,
            isActive: true,
            responses: {},
            scores: {},
          },
          speakerNotes: `Guests can scan the QR code to join the quiz. Questions will be displayed with a timer.`,
        });
      } catch (error) {
        console.error("Error parsing quiz data:", error);
        slides.push({
          type: "segment",
          title: segment.title,
          subtitle: `${segment.duration} minutes`,
          description: segment.description,
          duration: segment.duration,
          segmentType: segment.type,
          speakerNotes: segment.content || `Notes for ${segment.title}`,
        });
      }
    } else {
      slides.push({
        type: "segment",
        title: segment.title,
        subtitle: `${segment.duration} minutes`,
        description: segment.description,
        duration: segment.duration,
        segmentType: segment.type,
        speakerNotes: segment.content || `Notes for ${segment.title}`,
      });
    }

    // Add fun fact slides for segments that have personal fun facts
    if (
      segment.personalFunFacts &&
      Object.keys(segment.personalFunFacts).length > 0
    ) {
      Object.entries(segment.personalFunFacts).forEach(([guestId, funFact]) => {
        const guest = event.guests.find((g) => g.id === guestId);
        if (guest && funFact) {
          slides.push({
            type: "funfact",
            title: "Personal Fun Fact!",
            duration: 2, // 2 minutes for discussion
            funFact: funFact as string,
            guestName: guest.name,
            guestId: guestId,
            speakerNotes: `This fun fact belongs to ${guest.name}. Give guests time to discuss and guess before revealing the answer.`,
          });
        }
      });
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
