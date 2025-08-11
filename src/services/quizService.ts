import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../constants/firebaseConfig";

export interface QuizQuestion {
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
    | {
        url: string;
        type: "image" | "video";
      }
    | string;
}

export interface QuizParticipant {
  username: string;
  responses: Record<string, string>; // questionId -> optionId
  scores: Record<string, number>; // questionId -> points earned
  totalScore: number;
  joinedAt: Timestamp;
}

export interface QuizData {
  sessionCode: string;
  title: string;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  isActive: boolean;
  showResults: boolean;
  participants: Record<string, QuizParticipant>; // participantId -> participant data
  responses: Record<string, Record<string, string[]>>; // questionId -> optionId -> participantIds[]
  isComplete: boolean;
  createdAt: Timestamp;
}

class QuizService {
  private getQuizRef(sessionCode: string) {
    return doc(db, "quizzes", sessionCode);
  }

  async createQuiz(quizData: Omit<QuizData, "createdAt">): Promise<void> {
    const quizRef = this.getQuizRef(quizData.sessionCode);
    await setDoc(quizRef, {
      ...quizData,
      createdAt: Timestamp.now(),
    });
  }

  async getQuiz(sessionCode: string): Promise<QuizData | null> {
    const quizRef = this.getQuizRef(sessionCode);
    const quizSnap = await getDoc(quizRef);

    if (quizSnap.exists()) {
      return quizSnap.data() as QuizData;
    }
    return null;
  }

  async updateQuiz(
    sessionCode: string,
    updates: Partial<QuizData>,
  ): Promise<void> {
    console.log("QuizService: Updating quiz", sessionCode, "with:", updates);
    const quizRef = this.getQuizRef(sessionCode);
    await updateDoc(quizRef, updates);
    console.log("QuizService: Quiz updated successfully");
  }

  async joinQuiz(
    sessionCode: string,
    participantId: string,
    username: string,
  ): Promise<boolean> {
    try {
      const quizRef = this.getQuizRef(sessionCode);
      const quizSnap = await getDoc(quizRef);

      if (!quizSnap.exists()) {
        return false;
      }

      const _quizData = quizSnap.data() as QuizData;
      const newParticipant: QuizParticipant = {
        username,
        responses: {},
        scores: {},
        totalScore: 0,
        joinedAt: Timestamp.now(),
      };

      await updateDoc(quizRef, {
        [`participants.${participantId}`]: newParticipant,
      });

      return true;
    } catch (error) {
      console.error("Error joining quiz:", error);
      return false;
    }
  }

  async submitAnswer(
    sessionCode: string,
    participantId: string,
    questionId: string,
    optionId: string,
  ): Promise<boolean> {
    try {
      console.log("QuizService: submitAnswer called with:", {
        sessionCode,
        participantId,
        questionId,
        optionId,
      });

      const quizRef = this.getQuizRef(sessionCode);
      const quizSnap = await getDoc(quizRef);

      if (!quizSnap.exists()) {
        console.error(
          "QuizService: Quiz document does not exist for session:",
          sessionCode,
        );
        return false;
      }

      const quizData = quizSnap.data() as QuizData;
      console.log("QuizService: Found quiz data:", {
        totalQuestions: quizData.questions.length,
        currentQuestionIndex: quizData.currentQuestionIndex,
        isActive: quizData.isActive,
        participantsCount: Object.keys(quizData.participants || {}).length,
        availableParticipantIds: Object.keys(quizData.participants || {}),
      });

      // ROBUST QUESTION FINDING: Multiple strategies
      let question = null;

      // Strategy 1: Find by exact question ID
      question = quizData.questions.find((q) => q.id === questionId);
      if (question) {
        console.log("QuizService: Question found by exact ID:", questionId);
      }

      // Strategy 2: Find by current question index
      if (
        !question &&
        quizData.currentQuestionIndex < quizData.questions.length
      ) {
        question = quizData.questions[quizData.currentQuestionIndex];
        console.log("QuizService: Question found by current index:", {
          requestedId: questionId,
          foundQuestionId: question?.id,
          currentIndex: quizData.currentQuestionIndex,
        });
      }

      // Strategy 3: Find by question text similarity (fuzzy matching)
      if (!question) {
        const requestedQuestionText = questionId.toLowerCase();
        question = quizData.questions.find(
          (q) =>
            q.question.toLowerCase().includes(requestedQuestionText) ||
            requestedQuestionText.includes(q.question.toLowerCase()),
        );
        if (question) {
          console.log("QuizService: Question found by text similarity:", {
            requestedId: questionId,
            foundQuestionId: question.id,
          });
        }
      }

      if (!question) {
        console.error("QuizService: Question not found with any strategy:", {
          requestedId: questionId,
          availableIds: quizData.questions.map((q) => q.id),
          currentIndex: quizData.currentQuestionIndex,
          availableQuestions: quizData.questions.map((q) => q.question),
        });
        return false;
      }

      // ROBUST OPTION FINDING: Multiple strategies
      let selectedOption = question.options.find((opt) => opt.id === optionId);

      // If option not found by ID, try to find by text or position
      if (!selectedOption) {
        // Try to find by text content
        selectedOption = question.options.find(
          (opt) => opt.text.toLowerCase() === optionId.toLowerCase(),
        );

        // If still not found, try to find by position (assuming optionId is a position like "0", "1", etc.)
        if (!selectedOption && !isNaN(Number(optionId))) {
          const position = parseInt(optionId);
          if (position >= 0 && position < question.options.length) {
            selectedOption = question.options[position];
            console.log("QuizService: Option found by position:", {
              requestedId: optionId,
              foundOption: selectedOption,
            });
          }
        }
      }

      if (!selectedOption) {
        console.error("QuizService: Option not found with any strategy:", {
          questionId: question.id,
          requestedOptionId: optionId,
          availableOptionIds: question.options.map((o) => o.id),
          availableOptionTexts: question.options.map((o) => o.text),
        });
        return false;
      }

      // Calculate points based on question type and correctness
      let points = 0;
      if (selectedOption.isCorrect) {
        switch (question.pointType) {
          case "standard":
            points = 100;
            break;
          case "double":
            points = 200;
            break;
          case "none":
            points = 0;
            break;
        }
      }

      // Update participant's response and score
      const participantPath = `participants.${participantId}`;
      const responsePath = `${participantPath}.responses.${questionId}`;
      const scorePath = `${participantPath}.scores.${questionId}`;

      // Update responses tracking - handle the nested structure correctly
      const currentResponses = quizData.responses[questionId] || {};
      const currentOptionResponses = currentResponses[optionId] || [];

      // Remove participant from other options for this question
      Object.keys(currentResponses).forEach((otherOptionId) => {
        if (otherOptionId !== optionId) {
          currentResponses[otherOptionId] = currentResponses[
            otherOptionId
          ].filter((pid) => pid !== participantId);
        }
      });

      // Add participant to selected option
      currentResponses[optionId] = [
        ...currentOptionResponses.filter((pid) => pid !== participantId),
        participantId,
      ];

      // ROBUST PARTICIPANT VALIDATION: Multiple strategies
      let participant = quizData.participants[participantId];

      // If participant not found, try to auto-join them
      if (!participant) {
        console.log(
          "QuizService: Participant not found, attempting auto-join:",
          {
            participantId,
            availableParticipants: Object.keys(quizData.participants || {}),
          },
        );

        try {
          // Try to auto-join the participant
          const autoJoinSuccess = await this.joinQuiz(
            sessionCode,
            participantId,
            `Participant-${participantId.substring(0, 4)}`,
          );

          if (autoJoinSuccess) {
            // Refresh quiz data to get the new participant
            const refreshedSnap = await getDoc(quizRef);
            if (refreshedSnap.exists()) {
              const refreshedData = refreshedSnap.data() as QuizData;
              participant = refreshedData.participants[participantId];
              console.log(
                "QuizService: Auto-join successful, participant found:",
                !!participant,
              );
            }
          }
        } catch (autoJoinError) {
          console.log("QuizService: Auto-join failed:", autoJoinError);
        }
      }

      if (!participant) {
        console.error(
          "QuizService: Participant not found even after auto-join:",
          {
            participantId,
            availableParticipants: Object.keys(quizData.participants || {}),
          },
        );
        return false;
      }

      const newScores = { ...participant.scores, [questionId]: points };
      const newTotalScore = Object.values(newScores).reduce(
        (sum, score) => sum + score,
        0,
      );

      console.log("QuizService: Updating participant data:", {
        participantId,
        questionId,
        optionId,
        points,
        newTotalScore,
      });

      try {
        await updateDoc(quizRef, {
          [responsePath]: optionId,
          [scorePath]: points,
          [`${participantPath}.totalScore`]: newTotalScore,
          [`responses.${questionId}`]: currentResponses,
        });

        console.log("QuizService: Answer submitted successfully");
        return true;
      } catch (updateError) {
        console.error("QuizService: Error updating document:", updateError);
        return false;
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      return false;
    }
  }

  async nextQuestion(sessionCode: string): Promise<boolean> {
    try {
      const quizData = await this.getQuiz(sessionCode);
      if (!quizData) return false;

      const nextIndex = quizData.currentQuestionIndex + 1;
      if (nextIndex >= quizData.questions.length) {
        // Quiz is complete
        await this.updateQuiz(sessionCode, {
          isComplete: true,
          showResults: true,
        });
      } else {
        await this.updateQuiz(sessionCode, {
          currentQuestionIndex: nextIndex,
          showResults: false,
        });
      }

      return true;
    } catch (error) {
      console.error("Error moving to next question:", error);
      return false;
    }
  }

  async showResults(sessionCode: string, show: boolean): Promise<void> {
    await this.updateQuiz(sessionCode, { showResults: show });
  }

  subscribeToQuiz(
    sessionCode: string,
    callback: (quiz: QuizData | null) => void,
  ): () => void {
    console.log(
      "QuizService: Subscribing to quiz updates for session:",
      sessionCode,
    );
    const quizRef = this.getQuizRef(sessionCode);

    return onSnapshot(
      quizRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as QuizData;
          console.log(
            "QuizService: Received quiz update for session",
            sessionCode,
            ":",
            data,
          );
          callback(data);
        } else {
          console.log(
            "QuizService: Quiz document does not exist for session:",
            sessionCode,
          );
          callback(null);
        }
      },
      (error) => {
        console.error("Error listening to quiz updates:", error);
        callback(null);
      },
    );
  }

  getLeaderboard(quizData: QuizData): QuizParticipant[] {
    return Object.values(quizData.participants)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 3);
  }

  getQuestionStats(quizData: QuizData, questionId: string) {
    const responses = quizData.responses[questionId] || {};
    const totalResponses = Object.values(responses).reduce(
      (sum, participantIds) => sum + participantIds.length,
      0,
    );

    const question = quizData.questions.find((q) => q.id === questionId);
    if (!question) return null;

    return question.options.map((option) => {
      const optionResponses = responses[option.id] || [];
      const count = optionResponses.length;
      const percentage =
        totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;

      return {
        ...option,
        count,
        percentage,
      };
    });
  }
}

export const quizService = new QuizService();
