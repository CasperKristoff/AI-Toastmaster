// Event Types for AI Toastmaster

export type EventType = "event";

export type EventTone = "safe" | "wild" | "family-friendly" | "corporate";

export type SegmentType =
  | "welcome"
  | "introduction"
  | "activity"
  | "toast"
  | "game"
  | "break"
  | "closing"
  | "poll"
  | "quiz";

export interface Guest {
  id: string;
  name: string;
  age?: number;
  relationship: string;
  ageGroup?: "child" | "teen" | "adult" | "senior";
  funFact?: string;
  isVIP?: boolean;
}

export interface EventSegment {
  id: string;
  type: SegmentType;
  title: string;
  description: string;
  duration: number;
  content: string;
  order: number;
  isCustom?: boolean;
  guestsInvolved?: string[];
  notes?: string;
  personalFunFacts?: Record<string, string>; // guestId -> funFact
  data?: Record<string, unknown>; // Additional data for specific segment types (e.g., poll data)
}

export interface Event {
  id: string;
  userId: string;
  name: string;
  type: EventType;
  date: Date;
  startTime: string;
  duration: number;
  venue?: string;
  description?: string;
  tone: EventTone;
  guests: Guest[];
  timeline: EventSegment[];
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
