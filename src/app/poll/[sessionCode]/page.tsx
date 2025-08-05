"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface PollData {
  question: string;
  options: string[];
  showResultsLive: boolean;
  allowMultipleSelections: boolean;
  sessionCode: string;
  votes: Record<string, number>;
  totalVotes: number;
}

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

    // Find the poll with this session code
    const findPoll = async () => {
      try {
        // For now, we'll simulate finding the poll
        // In a real implementation, you'd query for events with poll segments containing this session code
        const mockPollData: PollData = {
          question: "Who should take a shot?",
          options: ["Option 1", "Option 2", "Option 3"],
          showResultsLive: true,
          allowMultipleSelections: false,
          sessionCode: sessionCode,
          votes: { "Option 1": 5, "Option 2": 3, "Option 3": 2 },
          totalVotes: 10,
        };

        setPollData(mockPollData);
        setIsLoading(false);
      } catch {
        setError("Failed to load poll");
        setIsLoading(false);
      }
    };

    findPoll();
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

      const updatedPollData = {
        ...pollData,
        votes: newVotes,
        totalVotes: pollData.totalVotes + selectedOptions.length,
      };

      // In a real implementation, you'd update the specific poll in Firestore
      // For now, we'll just update the local state
      setPollData(updatedPollData);
      setHasVoted(true);
    } catch {
      setError("Failed to submit vote");
    }
  };

  const getOptionPercentage = (option: string): number => {
    if (!pollData || pollData.totalVotes === 0) return 0;
    return Math.round(
      ((pollData.votes[option] || 0) / pollData.totalVotes) * 100,
    );
  };

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
          <h1 className="text-2xl font-bold text-dark-royalty mb-2">
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
            /* Results Display */
            <div className="space-y-4">
              {pollData.options.map((option, index) => {
                const votes = pollData.votes[option] || 0;
                const percentage = getOptionPercentage(option);
                const colors = [
                  "#3B82F6",
                  "#EF4444",
                  "#10B981",
                  "#F59E0B",
                  "#8B5CF6",
                ];

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-dark-royalty">
                        {option}
                      </span>
                      <span className="text-lg font-bold text-dark-royalty">
                        {votes}
                      </span>
                    </div>
                    <div className="relative h-6 bg-gray-200 rounded-lg overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 ease-out"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: colors[index % colors.length],
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="text-center mt-6 pt-4 border-t border-dark-royalty/20">
                <div className="text-sm text-deep-sea/60">Total Votes</div>
                <div className="text-xl font-bold text-dark-royalty">
                  {pollData.totalVotes}
                </div>
              </div>
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
