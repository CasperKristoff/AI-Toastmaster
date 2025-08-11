import { doc, updateDoc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../constants/firebaseConfig";

const POLLS_COLLECTION = "polls";

export interface PollData {
  question: string;
  options: string[];
  showResultsLive: boolean;
  allowMultipleSelections: boolean;
  sessionCode: string;
  votes: Record<string, number>;
  totalVotes: number;
}

export const pollService = {
  // Create or update a poll
  async setPoll(sessionCode: string, pollData: PollData): Promise<void> {
    try {
      const pollRef = doc(db, POLLS_COLLECTION, sessionCode);
      await setDoc(pollRef, pollData);
    } catch (error) {
      console.error("Error setting poll:", error);
      throw new Error("Failed to set poll");
    }
  },

  // Get a poll by session code
  async getPoll(sessionCode: string): Promise<PollData | null> {
    try {
      const pollRef = doc(db, POLLS_COLLECTION, sessionCode);
      const pollDoc = await getDoc(pollRef);

      if (!pollDoc.exists()) {
        return null;
      }

      return pollDoc.data() as PollData;
    } catch (error) {
      console.error("Error getting poll:", error);
      throw new Error("Failed to get poll");
    }
  },

  // Update votes for a poll
  async updateVotes(
    sessionCode: string,
    newVotes: Record<string, number>,
    totalVotes: number,
  ): Promise<void> {
    try {
      const pollRef = doc(db, POLLS_COLLECTION, sessionCode);
      await updateDoc(pollRef, {
        votes: newVotes,
        totalVotes: totalVotes,
      });
    } catch (error) {
      console.error("Error updating votes:", error);
      throw new Error("Failed to update votes");
    }
  },

  // Subscribe to real-time updates for a poll
  subscribeToPoll(
    sessionCode: string,
    callback: (poll: PollData) => void,
  ): () => void {
    const pollRef = doc(db, POLLS_COLLECTION, sessionCode);

    const unsubscribe = onSnapshot(
      pollRef,
      (doc) => {
        if (doc.exists()) {
          callback(doc.data() as PollData);
        }
      },
      (error) => {
        console.error("Error subscribing to poll:", error);
      },
    );

    return unsubscribe;
  },
};
