import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { db } from "../constants/firebaseConfig";
import type { Event } from "../types/event";

const EVENTS_COLLECTION = "events";

// Helper to safely convert Firestore Timestamp, JS Date, or string to JS Date
function toDateSafe(val: any): Date {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (typeof val.toDate === 'function') return val.toDate();
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return new Date();
}

export interface EventService {
  createEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>, userId: string) => Promise<string>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  getUserEvents: (userId: string) => Promise<Event[]>;
  subscribeToUserEvents: (userId: string, callback: (events: Event[]) => void) => () => void;
  getEvent: (eventId: string) => Promise<Event | null>;
}

export const eventService: EventService = {
  // Create a new event
  async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
    try {
      const eventToSave = {
        ...eventData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, EVENTS_COLLECTION), eventToSave);
      return docRef.id;
    } catch (error) {
      console.error("Error creating event:", error);
      throw new Error("Failed to create event");
    }
  },

  // Update an existing event
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    try {
      const eventRef = doc(db, EVENTS_COLLECTION, eventId);
      await updateDoc(eventRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating event:", error);
      throw new Error("Failed to update event");
    }
  },

  // Delete an event
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const eventRef = doc(db, EVENTS_COLLECTION, eventId);
      await deleteDoc(eventRef);
    } catch (error) {
      console.error("Error deleting event:", error);
      throw new Error("Failed to delete event");
    }
  },

  // Get all events for a user
  async getUserEvents(userId: string): Promise<Event[]> {
    try {
      const q = query(
        collection(db, EVENTS_COLLECTION),
        where("userId", "==", userId)
        // Removed orderBy to avoid composite index requirement
      );
      
      const querySnapshot = await getDocs(q);
      const events: Event[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        events.push({
          id: doc.id,
          ...data,
          createdAt: toDateSafe(data.createdAt),
          updatedAt: toDateSafe(data.updatedAt),
          date: toDateSafe(data.date),
        } as Event);
      });
      
      // Sort in JavaScript instead of Firestore
      return events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error("Error getting user events:", error);
      throw new Error("Failed to get user events");
    }
  },

  // Subscribe to real-time updates for user events
  subscribeToUserEvents(userId: string, callback: (events: Event[]) => void): () => void {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where("userId", "==", userId)
      // Removed orderBy to avoid composite index requirement
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const events: Event[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        events.push({
          id: doc.id,
          ...data,
          createdAt: toDateSafe(data.createdAt),
          updatedAt: toDateSafe(data.updatedAt),
          date: toDateSafe(data.date),
        } as Event);
      });
      
      // Sort in JavaScript instead of Firestore
      const sortedEvents = events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      callback(sortedEvents);
    }, (error) => {
      console.error("Error subscribing to events:", error);
    });

    return unsubscribe;
  },

  // Get a specific event by ID
  async getEvent(eventId: string): Promise<Event | null> {
    try {
      const eventDoc = await getDocs(query(collection(db, EVENTS_COLLECTION), where("__name__", "==", eventId)));
      
      if (eventDoc.empty) {
        return null;
      }

      const data = eventDoc.docs[0].data();
      return {
        id: eventDoc.docs[0].id,
        ...data,
        createdAt: toDateSafe(data.createdAt),
        updatedAt: toDateSafe(data.updatedAt),
        date: toDateSafe(data.date),
      } as Event;
    } catch (error) {
      console.error("Error getting event:", error);
      throw new Error("Failed to get event");
    }
  },
}; 