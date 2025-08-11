"use client";

import { useState } from "react";
import { Event, EventType, EventTone } from "../../../types/event";

interface EventCreationFormProps {
  onEventCreated?: (
    event: Omit<Event, "id" | "createdAt" | "updatedAt">,
  ) => void;
}

export default function EventCreationForm({
  onEventCreated,
}: EventCreationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tone: "safe" as EventTone,
    date: "",
    startTime: "18:00",
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create new event object without id, createdAt, updatedAt
    const newEvent: Omit<Event, "id" | "createdAt" | "updatedAt"> = {
      userId: "current-user", // will be set by the service
      name: formData.name,
      type: "event" as EventType,
      date: new Date(formData.date), // use selected date
      startTime: formData.startTime, // use selected time
      duration: 120, // default 2 hours
      venue: "", // empty venue
      description: formData.description, // use description field
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
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative">
          {/* Main content */}
          <div className="relative bg-white rounded-3xl shadow-xl border border-gray-200 p-8 sm:p-12">
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
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-deep-sea mb-2"
                  >
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

              {/* Event Description */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-deep-sea mb-2"
                  >
                    Event Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300 resize-none"
                    placeholder="Describe your event, what guests can expect, or any special details..."
                  />
                </div>
              </div>

              {/* Event Tone */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="tone"
                    className="block text-sm font-medium text-deep-sea mb-2"
                  >
                    Event Tone *
                  </label>
                  <select
                    id="tone"
                    value={formData.tone}
                    onChange={(e) => handleInputChange("tone", e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
                  >
                    <option value="">Select a tone...</option>
                    <option value="safe">
                      Safe - General-purpose light humor
                    </option>
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

              {/* Event Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-deep-sea mb-2"
                  >
                    Event Date *
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
                  />
                </div>
                <div>
                  <label
                    htmlFor="startTime"
                    className="block text-sm font-medium text-deep-sea mb-2"
                  >
                    Event Kickoff *
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      handleInputChange("startTime", e.target.value)
                    }
                    required
                    className="w-full px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>

              {/* Submit button */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={
                    !formData.name ||
                    !formData.tone ||
                    !formData.date ||
                    !formData.startTime
                  }
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
