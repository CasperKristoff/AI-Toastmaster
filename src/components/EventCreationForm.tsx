"use client";

import { useState } from "react";
import { Event, EventType, EventTone } from "../types/event";

interface EventCreationFormProps {
  onEventCreated?: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export default function EventCreationForm({ onEventCreated }: EventCreationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "" as EventType,
    tone: "" as EventTone,
    date: "",
    startTime: "18:00",
  });

  const eventTypes: { value: EventType; label: string; description: string }[] = [
    { value: "bachelor", label: "🕺 Bachelor(ette) Party", description: "Pre-wedding chaos and bonding." },
    { value: "theme", label: "🎭 Theme Party", description: "From 1920s speakeasy to Y2K rave – full immersion recommended." },
    { value: "house", label: "🍻 House Party", description: "Your place, your rules – AI helps keep things (slightly) under control." },
    { value: "roast", label: "🎂 Roast Night", description: "One guest, all the heat. AI writes the jokes." },
    { value: "prom", label: "👑 Prom or Formal", description: "Elegance, drama, and awkward dancing encouraged." },
    { value: "trivia", label: "🧠 Trivia Night", description: "Full of quizzes, points, and petty competition." },
    { value: "glowup", label: "🔥 Glow-Up Party", description: "Celebrating a transformation – birthdays, breakups, or bold life changes." },
    { value: "breakup", label: "💔 Breakup Bash", description: "Closure, cocktails, and controlled chaos." },
  ];

  const eventTones: { value: EventTone; label: string; description: string }[] = [
    { value: "formal", label: "Formal", description: "Elegant and sophisticated" },
    { value: "casual", label: "Casual", description: "Relaxed and friendly" },
    { value: "party", label: "Party", description: "High energy and fun" },
    { value: "professional", label: "Professional", description: "Business appropriate" },
    { value: "wholesome", label: "Wholesome", description: "Family-friendly and warm" },
    { value: "roast", label: "Roast", description: "Playful and humorous" },
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new event object without id, createdAt, updatedAt
    const newEvent: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: "current-user", // will be set by the service
      name: formData.name,
      type: formData.type as EventType,
      date: new Date(formData.date), // use selected date
      startTime: formData.startTime, // use selected time
      duration: 120, // default 2 hours
      venue: "", // empty venue
      tone: formData.tone as EventTone,
      guests: [],
      timeline: [],
    };

    console.log("Creating event:", newEvent);
    
    if (onEventCreated) {
      onEventCreated(newEvent);
    }
  };



  return (
    <div className="relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="relative">
          {/* Decorative elements */}
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-deep-sea/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-kimchi/5 rounded-full blur-3xl"></div>
          
          {/* Main content */}
          <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-md ring-1 ring-black/5 p-8 sm:p-12">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl font-poppins font-bold bg-gradient-to-r from-dark-royalty to-deep-sea bg-clip-text text-transparent pb-1">
                Create Your Event
              </h1>
              <p className="text-lg text-deep-sea/80 font-poppins mt-4">
                Let AI Toastmaster help you plan the perfect event
              </p>
            </div>

            {/* Form content */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Event Name */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-deep-sea mb-2">
                    Event Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
                    placeholder="e.g., Sarah's 30th Birthday Party"
                  />
                </div>
              </div>

              {/* Event Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-deep-sea mb-2">
                    Event Date *
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
                  />
                </div>
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-deep-sea mb-2">
                    Event Kickoff *
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange("startTime", e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>

              {/* Event Type */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-deep-sea mb-4">
                  Event Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {eventTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleInputChange("type", type.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                        formData.type === type.value
                          ? "border-dark-royalty bg-dark-royalty/10"
                          : "border-dark-royalty/20 hover:border-dark-royalty/40"
                      }`}
                    >
                      <div className="font-medium text-dark-royalty">{type.label}</div>
                      <div className="text-sm text-deep-sea/60">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Tone */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-deep-sea mb-4">
                  Event Tone *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {eventTones.map((tone) => (
                    <button
                      key={tone.value}
                      type="button"
                      onClick={() => handleInputChange("tone", tone.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                        formData.tone === tone.value
                          ? "border-dark-royalty bg-dark-royalty/10"
                          : "border-dark-royalty/20 hover:border-dark-royalty/40"
                      }`}
                    >
                      <div className="font-medium text-dark-royalty">{tone.label}</div>
                      <div className="text-sm text-deep-sea/60">{tone.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit button */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={!formData.name || !formData.type || !formData.tone || !formData.date || !formData.startTime}
                  className="px-8 py-3 rounded-xl bg-dark-royalty text-white hover:bg-dark-royalty/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
