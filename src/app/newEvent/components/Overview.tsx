import React from 'react';
import { Event } from '../../../types/event';

interface OverviewProps {
  event: Event;
}

const Overview: React.FC<OverviewProps> = ({ event }) => {
  const getEventTypeIcon = (type: string) => {
    const icons = {
      bachelor: "🕺",
      theme: "🎭",
      house: "🍻",
      roast: "🎂",
      prom: "👑",
      trivia: "🧠",
      glowup: "🔥",
      breakup: "💔"
    };
    return icons[type as keyof typeof icons] || "🎊";
  };

  const getEventTypeLabel = (type: string) => {
    const labels = {
      bachelor: "Bachelor(ette) Party",
      theme: "Theme Party",
      house: "House Party",
      roast: "Roast Night",
      prom: "Prom or Formal",
      trivia: "Trivia Night",
      glowup: "Glow-Up Party",
      breakup: "Breakup Bash"
    };
    return labels[type as keyof typeof labels] || "Event";
  };

  const getToneColor = (tone: string) => {
    const colors = {
      formal: "bg-blue-100 text-blue-800 border-blue-200",
      casual: "bg-green-100 text-green-800 border-green-200",
      party: "bg-purple-100 text-purple-800 border-purple-200",
      professional: "bg-gray-100 text-gray-800 border-gray-200",
      wholesome: "bg-pink-100 text-pink-800 border-pink-200",
      roast: "bg-orange-100 text-orange-800 border-orange-200"
    };
    return colors[tone as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getToneLabel = (tone: string) => {
    const labels = {
      formal: "Formal & Elegant",
      casual: "Casual & Relaxed",
      party: "High Energy Party",
      professional: "Professional",
      wholesome: "Family-Friendly",
      roast: "Playful & Humorous"
    };
    return labels[tone as keyof typeof labels] || tone;
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-royalty/20 via-deep-sea/10 to-kimchi/15 p-8 border border-dark-royalty/20">
        <div className="absolute top-0 right-0 w-40 h-40 bg-deep-sea/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-kimchi/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/20 rounded-full blur-2xl"></div>
        
        <div className="relative text-center">
          <div className="text-9xl mb-6 animate-bounce">{getEventTypeIcon(event.type)}</div>
          <h1 className="text-5xl font-bold text-dark-royalty mb-4 font-poppins">{event.name}</h1>
          
          {event.venue && (
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <span className="text-xl">📍</span>
              <span className="font-semibold text-deep-sea/80">{event.venue}</span>
            </div>
          )}
        </div>
      </div>

      {/* Event Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl group-hover:scale-110 transition-transform duration-300">👥</div>
            <div className="text-4xl font-bold text-dark-royalty group-hover:scale-110 transition-transform duration-300">
              {event.guests.length}
            </div>
          </div>
          <div className="text-sm text-deep-sea/60 font-medium mb-2">Guests Invited</div>
          <div className="text-xs text-deep-sea/40">Ready to party!</div>
        </div>
        
        <div className="group bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl group-hover:scale-110 transition-transform duration-300">⏰</div>
            <div className="text-4xl font-bold text-dark-royalty group-hover:scale-110 transition-transform duration-300">
              {event.timeline.length}
            </div>
          </div>
          <div className="text-sm text-deep-sea/60 font-medium mb-2">Timeline Items</div>
          <div className="text-xs text-deep-sea/40">Perfectly planned</div>
        </div>
        
        <div className="group bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl group-hover:scale-110 transition-transform duration-300">🎭</div>
            <div className="text-sm">
              <span className={`px-3 py-1 rounded-full border ${getToneColor(event.tone)} font-medium capitalize`}>
                {event.tone}
              </span>
            </div>
          </div>
          <div className="text-sm text-deep-sea/60 font-medium mb-2">Event Tone</div>
          <div className="text-xs text-deep-sea/40">{getToneLabel(event.tone)}</div>
        </div>

        <div className="group bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl group-hover:scale-110 transition-transform duration-300">🎊</div>
            <div className="text-2xl font-bold text-dark-royalty group-hover:scale-110 transition-transform duration-300">
              {getEventTypeIcon(event.type)}
            </div>
          </div>
          <div className="text-sm text-deep-sea/60 font-medium mb-2">Event Type</div>
          <div className="text-xs text-deep-sea/40">{getEventTypeLabel(event.type)}</div>
        </div>
      </div>
    </div>
  );
};

export default Overview; 