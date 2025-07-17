// Event Types for AI Toastmaster

export type EventType = 'bachelor' | 'theme' | 'house' | 'roast' | 'prom' | 'trivia' | 'glowup' | 'breakup';

export type EventTone = 'formal' | 'casual' | 'party' | 'professional' | 'wholesome' | 'roast';

export type SegmentType = 'welcome' | 'introduction' | 'activity' | 'toast' | 'game' | 'break' | 'closing';

export interface Guest {
  id: string;
  name: string;
  age?: number;
  relationship: string;
  ageGroup?: 'child' | 'teen' | 'adult' | 'senior';
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
  tone: EventTone;
  guests: Guest[];
  timeline: EventSegment[];
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
