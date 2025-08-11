import React, { useState, useEffect, useRef } from "react";
import { Event, EventSegment } from "../../../types/event";
import { QRCodeSVG } from "qrcode.react";
import { pollService } from "../../../services/pollService";

interface PollProps {
  segment: EventSegment;
  event: Event;
  isEditMode?: boolean;
  onUpdate?: (updatedSegment: EventSegment) => void;
}

interface PollData {
  question: string;
  options: string[];
  showResultsLive: boolean;
  allowMultipleSelections: boolean;
  sessionCode: string;
  votes: Record<string, number>;
  totalVotes: number;
}

const Poll: React.FC<PollProps> = ({
  segment,
  isEditMode = false,
  onUpdate,
}) => {
  const [pollData, setPollData] = useState<PollData>({
    question: (segment.data?.question as string) || "Who should take a shot?",
    options: (segment.data?.options as string[]) || [
      "Option 1",
      "Option 2",
      "Option 3",
    ],
    showResultsLive: (segment.data?.showResultsLive as boolean) ?? true,
    allowMultipleSelections:
      (segment.data?.allowMultipleSelections as boolean) ?? false,
    sessionCode: (segment.data?.sessionCode as string) || generateSessionCode(),
    votes: (segment.data?.votes as Record<string, number>) || {},
    totalVotes: (segment.data?.totalVotes as number) || 0,
  });

  // Store initial poll data in a ref
  const initialPollDataRef = useRef(pollData);

  // Save initial poll data to Firestore
  useEffect(() => {
    if (!isEditMode) {
      pollService.setPoll(
        initialPollDataRef.current.sessionCode,
        initialPollDataRef.current,
      );
    }
  }, [isEditMode]); // Run only once when component mounts in presentation mode

  // Subscribe to real-time poll updates in presentation mode
  useEffect(() => {
    if (!isEditMode && pollData.sessionCode) {
      // Subscribe to real-time updates
      const unsubscribe = pollService.subscribeToPoll(
        pollData.sessionCode,
        (updatedPoll) => {
          setPollData(updatedPoll);
        },
      );

      return () => unsubscribe();
    }
  }, [isEditMode, pollData.sessionCode]); // Only re-run if session code changes

  // Generate unique session code
  function generateSessionCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Update poll data and save to segment
  const updatePollData = async (updates: Partial<PollData>) => {
    const newData = { ...pollData, ...updates };
    setPollData(newData);

    if (onUpdate) {
      const updatedSegment = {
        ...segment,
        data: newData,
      };
      onUpdate(updatedSegment);
    }
  };

  // Add new option
  const addOption = () => {
    const newOption = `Option ${pollData.options.length + 1}`;
    updatePollData({ options: [...pollData.options, newOption] });
  };

  // Remove option
  const removeOption = (index: number) => {
    if (pollData.options.length > 2) {
      const newOptions = pollData.options.filter((_, i) => i !== index);
      updatePollData({ options: newOptions });
    }
  };

  // Update option text
  const updateOption = (index: number, value: string) => {
    const newOptions = [...pollData.options];
    newOptions[index] = value;
    updatePollData({ options: newOptions });
  };

  // Calculate percentage for each option
  const getOptionPercentage = (option: string): number => {
    if (pollData.totalVotes === 0) return 0;
    return Math.round(
      ((pollData.votes[option] || 0) / pollData.totalVotes) * 100,
    );
  };

  // Get QR code URL - using the QR code as the session code
  const getQRCodeURL = (): string => {
    // Get the local IP address or hostname from window.location
    const host =
      window.location.hostname === "localhost"
        ? window.location.hostname
        : window.location.host;
    const protocol = window.location.protocol;
    const port = window.location.port;

    // Construct the URL using the host's IP or domain
    return `${protocol}//${host}${port ? `:${port}` : ""}/poll/${pollData.sessionCode}`;
  };

  if (isEditMode) {
    return (
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10 w-full">
        <div className="flex items-center space-x-3 mb-6">
          <div className="text-3xl">📊</div>
          <div>
            <h3
              className="text-xl font-bold text-dark-royalty"
              style={{ marginTop: "-37.8px" }}
            >
              Live Poll
            </h3>
          </div>
        </div>

        {/* Poll Question */}
        <div className="space-y-4 mb-6">
          <label className="block text-sm font-medium text-deep-sea">
            Poll Question *
          </label>
          <input
            type="text"
            value={pollData.question}
            onChange={(e) => updatePollData({ question: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
            placeholder="Enter your poll question..."
          />
        </div>

        {/* Poll Options */}
        <div className="space-y-4 mb-6">
          <label className="block text-sm font-medium text-deep-sea">
            Poll Options *
          </label>
          {pollData.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-3">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
                placeholder={`Option ${index + 1}`}
              />
              {pollData.options.length > 2 && (
                <button
                  onClick={() => removeOption(index)}
                  className="px-3 py-3 text-red-500 hover:text-red-700 transition-colors duration-200"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addOption}
            className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-dark-royalty/30 text-dark-royalty/60 hover:border-dark-royalty/50 hover:text-dark-royalty/80 transition-all duration-300"
          >
            + Add Option
          </button>
        </div>

        {/* Poll Settings */}
        <div className="space-y-4 mb-6">
          <label className="block text-sm font-medium text-deep-sea">
            Poll Settings
          </label>

          {/* Show Results Live */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-dark-royalty/20 bg-white/30">
            <div>
              <div className="font-medium text-dark-royalty">
                Show Results Live
              </div>
              <div className="text-sm text-deep-sea/60">
                Display votes in real-time
              </div>
            </div>
            <button
              onClick={() =>
                updatePollData({ showResultsLive: !pollData.showResultsLive })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                pollData.showResultsLive ? "bg-dark-royalty" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  pollData.showResultsLive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Allow Multiple Selections */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-dark-royalty/20 bg-white/30">
            <div>
              <div className="font-medium text-dark-royalty">
                Allow Multiple Selections
              </div>
              <div className="text-sm text-deep-sea/60">
                Guests can vote for multiple options
              </div>
            </div>
            <button
              onClick={() =>
                updatePollData({
                  allowMultipleSelections: !pollData.allowMultipleSelections,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                pollData.allowMultipleSelections
                  ? "bg-dark-royalty"
                  : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  pollData.allowMultipleSelections
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-dark-royalty/20">
          <button
            onClick={() => {
              if (onUpdate) {
                const updatedSegment = {
                  ...segment,
                  data: pollData as unknown as Record<string, unknown>,
                };
                onUpdate(updatedSegment);
                // Close the modal or return to event program
                // The parent component should handle the modal closing
              }
            }}
            className="w-full px-6 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 font-medium"
          >
            Save Poll
          </button>
        </div>
      </div>
    );
  }

  // Presentation Mode
  return (
    <div
      className="w-full h-full"
      style={{
        background:
          "linear-gradient(135deg, rgba(240, 240, 255, 0.1), transparent, rgba(255, 240, 240, 0.1))",
      }}
    >
      {/* Navigation Arrow */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-2xl">
        ‹
      </div>

      {/* QR Code and Join Instructions - Top Right */}
      <div className="fixed top-24 right-24 z-50 flex flex-col items-center">
        <div className="flex justify-center mb-2">
          <QRCodeSVG value={getQRCodeURL()} size={180} />
        </div>
        <div className="text-center">
          <div className="text-sm text-deep-sea/70">Join at:</div>
          <div className="font-mono text-sm font-medium text-black">
            {getQRCodeURL()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center h-full px-16">
        {/* Question Text */}
        <div className="mt-24 mb-32">
          <h2 className="text-5xl font-bold text-black text-center">
            {pollData.question}
          </h2>
        </div>

        {/* Live Results - Horizontal Layout */}
        <div className="grid grid-cols-3 gap-16 w-full max-w-5xl mb-24">
          {pollData.options.map((option, index) => {
            const votes = pollData.votes[option] || 0;
            const percentage = getOptionPercentage(option);

            return (
              <div key={index} className="text-center space-y-6">
                {/* Vote Count */}
                <div className="text-6xl font-bold text-dark-royalty">
                  {votes}
                </div>

                {/* Progress Bar - Thin black line */}
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full transition-all duration-500 ease-out bg-dark-royalty"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>

                {/* Option Label */}
                <div className="font-medium text-dark-royalty text-2xl">
                  {option}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Votes - Bottom Left */}
        <div className="fixed bottom-24 left-24 text-center">
          <div className="text-base text-deep-sea/70 mb-1">Total Votes</div>
          <div className="text-3xl font-bold text-black">
            {pollData.totalVotes}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Poll;
