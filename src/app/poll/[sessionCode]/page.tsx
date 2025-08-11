"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { pollService, PollData } from "../../../services/pollService";

// PollData interface is now imported from pollService

const PollVotingPage: React.FC = () => {
  const params = useParams();
  const sessionCode = params.sessionCode as string;

  const [pollData, setPollData] = useState<PollData | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionCode) {
      setError("No session code provided");
      setIsLoading(false);
      return;
    }

    // Get poll data and subscribe to updates
    const loadPoll = async () => {
      try {
        // Get initial poll data
        const initialPollData = await pollService.getPoll(sessionCode);
        if (!initialPollData) {
          setError("Poll not found");
          setIsLoading(false);
          return;
        }

        setPollData(initialPollData);
        setIsLoading(false);

        // Subscribe to real-time updates
        const unsubscribe = pollService.subscribeToPoll(
          sessionCode,
          (updatedPoll) => {
            setPollData(updatedPoll);
          },
        );

        return unsubscribe;
      } catch {
        setError("Failed to load poll");
        setIsLoading(false);
      }
    };

    const unsubscribe = loadPoll();
    return () => {
      unsubscribe?.then((unsub) => unsub?.());
    };
  }, [sessionCode]);

  const handleOptionToggle = (option: string) => {
    if (hasVoted) return;

    if (pollData?.allowMultipleSelections) {
      setSelectedOptions((prev) =>
        prev.includes(option)
          ? prev.filter((o) => o !== option)
          : [...prev, option],
      );
    } else {
      setSelectedOptions([option]);
    }
  };

  const handleVote = async () => {
    if (!pollData || selectedOptions.length === 0 || hasVoted) return;

    try {
      // Update votes in Firestore
      const newVotes = { ...pollData.votes };
      selectedOptions.forEach((option) => {
        newVotes[option] = (newVotes[option] || 0) + 1;
      });

      const newTotalVotes = pollData.totalVotes + selectedOptions.length;

      // Update votes in Firestore
      await pollService.updateVotes(sessionCode, newVotes, newTotalVotes);
      setHasVoted(true);
    } catch {
      setError("Failed to submit vote");
    }
  };

  // Removed unused getOptionPercentage function

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-royalty/10 via-deep-sea/5 to-kimchi/10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-xl font-bold text-dark-royalty">
            Loading poll...
          </div>
        </div>
      </div>
    );
  }

  if (error || !pollData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-royalty/10 via-deep-sea/5 to-kimchi/10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-xl font-bold text-dark-royalty">
            Poll not found
          </div>
          <div className="text-deep-sea/60 mt-2">
            The poll you&apos;re looking for doesn&apos;t exist or has expired.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-royalty/10 via-deep-sea/5 to-kimchi/10 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">📊</div>
          <h1
            className="text-2xl font-bold text-dark-royalty mb-2"
            style={{ marginTop: "-75px" }}
          >
            Live Poll
          </h1>
          <div className="text-sm text-deep-sea/60">Session: {sessionCode}</div>
        </div>

        {/* Poll Question */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10 mb-6">
          <h2 className="text-xl font-bold text-dark-royalty text-center mb-4">
            {pollData.question}
          </h2>

          {!hasVoted ? (
            /* Voting Interface */
            <div className="space-y-3">
              {pollData.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionToggle(option)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedOptions.includes(option)
                      ? "border-dark-royalty bg-dark-royalty/10"
                      : "border-dark-royalty/20 hover:border-dark-royalty/40"
                  }`}
                >
                  <div className="font-medium text-dark-royalty">{option}</div>
                </button>
              ))}

              <button
                onClick={handleVote}
                disabled={selectedOptions.length === 0}
                className="w-full mt-6 px-6 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Vote
              </button>
            </div>
          ) : (
            /* Thank You Message */
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✨</div>
              <h2 className="text-2xl font-bold text-dark-royalty mb-2">
                Thank you for your answer!
              </h2>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-deep-sea/60">
          Powered by AI Toastmaster
        </div>
      </div>
    </div>
  );
};

export default PollVotingPage;
