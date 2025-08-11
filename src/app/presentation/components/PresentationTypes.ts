import { Guest } from "../../../types/event";

export interface SlideData {
  type:
    | "title"
    | "segment"
    | "closing"
    | "funfact"
    | "spinthewheel"
    | "slideshow"
    | "jeopardy"
    | "poll"
    | "quiz";
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
  // Spin the wheel specific fields
  challenge?: string;
  guests?: Guest[];
  // Slide show specific fields
  photoUrls?: string[];
  // Jeopardy specific fields
  jeopardyCategories?: JeopardyCategory[];
  // Poll specific fields
  pollData?: {
    question: string;
    options: string[];
    showResultsLive: boolean;
    allowMultipleSelections: boolean;
    sessionCode: string;
    votes: Record<string, number>;
    totalVotes: number;
  };
  // Quiz specific fields
  quizData?: {
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
}

export interface TileState {
  [key: string]: "hidden" | "question" | "answer" | "completed";
}

export interface TileOriginalState {
  [key: string]: boolean; // true if originally completed
}

export interface JeopardyCategory {
  id: string;
  name: string;
  questions: JeopardyQuestion[];
}

export interface JeopardyQuestion {
  id: string;
  answer: string;
  question: string;
  points: number;
}
