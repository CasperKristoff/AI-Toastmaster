import React, { useState } from "react";
import { Event } from "../../../types/event";
import { eventService } from "../../../services/eventService";

interface OverviewProps {
  event: Event;
}

const Overview: React.FC<OverviewProps> = ({ event }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToneChange = async (newTone: string) => {
    if (newTone === event.tone) return;

    setIsUpdating(true);
    try {
      await eventService.updateEvent(event.id, {
        tone: newTone as "safe" | "wild" | "family-friendly" | "corporate",
      });
    } catch (error) {
      console.error("Error updating event tone:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 w-full max-w-none">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-royalty/20 via-deep-sea/10 to-kimchi/15 p-8 border border-dark-royalty/20 w-full">
        <div className="absolute top-0 right-0 w-40 h-40 bg-deep-sea/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-kimchi/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/20 rounded-full blur-2xl"></div>

        <div className="relative text-center">
          <div className="text-9xl mb-6 animate-bounce">🎊</div>
          <h1 className="text-5xl font-bold text-dark-royalty mb-4 font-poppins break-words">
            {event.name}
          </h1>
        </div>
      </div>

      {/* Event Description */}
      {event.description && (
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10 w-full">
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-2xl">📝</div>
            <h3 className="text-lg font-bold text-dark-royalty">
              Event Description
            </h3>
          </div>
          <p className="text-deep-sea/80 leading-relaxed">
            {event.description}
          </p>
        </div>
      )}

      {/* Event Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        <div className="group bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
              👥
            </div>
            <div className="text-4xl font-bold text-dark-royalty group-hover:scale-110 transition-transform duration-300">
              {event.guests.length}
            </div>
          </div>
          <div className="text-sm text-deep-sea/60 font-medium mb-2">
            Guests Invited
          </div>
          <div className="text-xs text-deep-sea/40">Ready to party!</div>
        </div>

        <div className="group bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
              ⏰
            </div>
            <div className="text-4xl font-bold text-dark-royalty group-hover:scale-110 transition-transform duration-300">
              {event.timeline.length}
            </div>
          </div>
          <div className="text-sm text-deep-sea/60 font-medium mb-2">
            Timeline Items
          </div>
          <div className="text-xs text-deep-sea/40">Perfectly planned</div>
        </div>

        <div className="group bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
              🎭
            </div>
            <div className="text-sm">
              {isUpdating && (
                <span className="px-3 py-1 rounded-full border bg-blue-100 text-blue-800 border-blue-200 font-medium">
                  Updating...
                </span>
              )}
            </div>
          </div>
          <div className="text-sm text-deep-sea/60 font-medium mb-2">
            Event Tone
          </div>
          <select
            value={event.tone}
            onChange={(e) => handleToneChange(e.target.value)}
            disabled={isUpdating}
            className="w-full px-3 py-2 rounded-lg border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="safe">Safe - General-purpose light humor</option>
            <option value="wild">Wild - Edgy party-style humor</option>
            <option value="family-friendly">
              Family-Friendly - Kid-appropriate fun
            </option>
            <option value="corporate">
              Corporate - Clean, office-safe phrasing
            </option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Overview;
