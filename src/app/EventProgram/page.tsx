"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Event, EventSegment } from "../../types/event";
import { eventService } from "../../services/eventService";
import AISegments from "./components/sections/AISegments";
import AddSegmentModal from "./components/sections/AddSegmentModal";
import PersonalFunfact from "./components/PersonalFunfact";
import AddGuestModal from "../newEvent/components/AddGuestModal";
import Guests from "../newEvent/components/Guests";
import EventHeader from "./components/sections/EventHeader";
import { useEventHandlers } from "./components/sections/EventHandlers";
import { formatTime, formatDate } from "./components/sections/EventUtils";
import Modal from "../../components/Modal";
import LiveQuiz from "./components/LiveQuiz";
import SpinTheWheel from "./components/SpinTheWheel";
import SlideShow from "./components/SlideShow";
import Jeopardy from "./components/Jeopardy";
import Poll from "./components/Poll";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Draggable Segment Component
function DraggableSegment({
  segment,
  index,
  handleEditSegment,
  handleDeleteSegment,
  openMenuId,
  setOpenMenuId,
}: {
  segment: EventSegment;
  index: number;
  handleEditSegment: (id: string) => void;
  handleDeleteSegment: (id: string) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: segment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-6">
      <div className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-300 hover:shadow-lg hover:bg-white/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-2 text-deep-sea/60 hover:text-dark-royalty transition-colors rounded-lg hover:bg-deep-sea/10"
              title="Drag to reorder"
            >
              <span className="text-lg font-bold">...</span>
            </div>

            {/* Segment Number */}
            <div className="w-8 h-8 bg-gradient-to-br from-dark-royalty to-deep-sea text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              {index + 1}
            </div>

            {/* Segment Content */}
            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold text-dark-royalty">
                {segment.title} - {segment.duration}min
              </div>
              {segment.description &&
                segment.description !==
                  "Guess who each fun fact belongs to!" && (
                  <div className="text-deep-sea/70 mt-1">
                    {segment.description}
                  </div>
                )}
            </div>
          </div>

          {/* Action Menu */}
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              className="p-2 text-deep-sea/60 hover:text-dark-royalty transition-colors rounded-lg hover:bg-deep-sea/10"
              title="More options"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === segment.id ? null : segment.id);
              }}
            >
              <span className="text-lg font-bold">...</span>
            </button>

            {/* Dropdown Menu */}
            {openMenuId === segment.id && (
              <div className="absolute right-0 top-full mt-1 bg-white/95 backdrop-blur-xl rounded-xl border border-dark-royalty/20 shadow-lg z-10 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(null);
                    handleEditSegment(segment.id);
                  }}
                  className="w-full px-4 py-3 text-left text-deep-sea/80 hover:text-dark-royalty hover:bg-deep-sea/10 transition-colors rounded-t-xl"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(null);
                    handleDeleteSegment(segment.id);
                  }}
                  className="w-full px-4 py-3 text-left text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors rounded-b-xl"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type TabType = {
  id: "overview" | "guests" | "timeline" | "presentation";
  label: string;
  icon: string;
};

function SectionTabs({
  tabs,
  activeTab,
  setActiveTab,
  setLastTab,
}: {
  tabs: TabType[];
  activeTab: TabType["id"];
  setActiveTab: (id: TabType["id"]) => void;
  setLastTab: (id: TabType["id"]) => void;
}) {
  const activeIdx = tabs.findIndex((tab) => tab.id === activeTab);

  // Define completion logic for each section
  const getStepStatus = (tabId: TabType["id"]) => {
    const stepIndex = tabs.findIndex((tab) => tab.id === tabId);
    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (stepIndex < activeIndex) return "completed";
    if (stepIndex === activeIndex) return "current";
    return "upcoming";
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className="relative w-full flex items-center justify-between"
        style={{ minHeight: "80px" }}
      >
        {/* Progress line background */}
        <div
          className="absolute left-0 right-0 h-2 bg-gray-200 rounded-full"
          style={{ top: "40px", transform: "translateY(-50%)" }}
        />
        {/* Progress fill */}
        <div
          className="absolute h-2 bg-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{
            top: "40px",
            left: 0,
            width: `calc(${(100 / (tabs.length - 1)) * activeIdx}%)`,
            transform: "translateY(-50%)",
          }}
        />
        {/* Circles */}
        {tabs.map((tab) => {
          const status = getStepStatus(tab.id);
          const isCompleted = status === "completed";
          const isCurrent = status === "current";
          return (
            <div
              key={tab.id}
              className="flex flex-col items-center relative z-10"
              style={{ flex: 1 }}
            >
              <button
                onClick={() => {
                  setLastTab(activeTab);
                  setActiveTab(tab.id);
                }}
                className={`flex items-center justify-center w-20 h-20 rounded-full border-2 transition-all duration-300 shadow-sm bg-white cursor-pointer group
                  ${
                    isCompleted
                      ? "border-blue-500 bg-blue-500 hover:shadow-lg hover:scale-105"
                      : isCurrent
                        ? "border-blue-500 bg-white hover:shadow-lg hover:scale-105"
                        : "border-gray-300 bg-white hover:border-blue-300 hover:shadow-md hover:scale-105"
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                title={`Click to go to ${tab.label}`}
              >
                {isCompleted && (
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {/* Hover indicator for non-completed steps */}
                {!isCompleted && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
              <span
                className={`mt-3 text-base font-medium transition-all duration-300 text-center
                  ${
                    isCompleted
                      ? "text-blue-600"
                      : isCurrent
                        ? "text-blue-600 font-semibold"
                        : "text-gray-400 group-hover:text-gray-600"
                  }
                `}
              >
                {tab.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between w-full mt-6 px-4">
        <button
          onClick={() => {
            const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
            if (currentIndex > 0) {
              const prevTab = tabs[currentIndex - 1];
              setLastTab(activeTab);
              setActiveTab(prevTab.id);
            }
          }}
          disabled={activeIdx === 0}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
            ${
              activeIdx === 0
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
            }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Previous</span>
        </button>

        <button
          onClick={() => {
            const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
            if (currentIndex < tabs.length - 1) {
              const nextTab = tabs[currentIndex + 1];
              setLastTab(activeTab);
              setActiveTab(nextTab.id);
            }
          }}
          disabled={activeIdx === tabs.length - 1}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
            ${
              activeIdx === tabs.length - 1
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
            }`}
        >
          <span>Next</span>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function TimelinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showAISegmentsModal, setShowAISegmentsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "guests" | "timeline" | "presentation"
  >("timeline");
  const [, setLastTab] = useState<
    "overview" | "guests" | "timeline" | "presentation"
  >("timeline");

  // Use the event handlers hook
  const eventHandlers = useEventHandlers({ user, event, setEvent });

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Subscribe to user events when authenticated
  useEffect(() => {
    // Only redirect if auth is complete and user is null
    if (!loading && !user) {
      router.push("/");
      return;
    }

    // Only subscribe if user is authenticated
    if (!user) {
      return; // Still loading, don't do anything yet
    }

    // Reset loading state when starting new subscription
    setEventsLoading(true);

    const eventId = searchParams.get("eventId");

    const unsubscribe = eventService.subscribeToUserEvents(
      user.uid,
      (events) => {
        if (events.length > 0) {
          if (eventId) {
            // Find the specific event by ID
            const specificEvent = events.find((e) => e.id === eventId);
            if (specificEvent) {
              setEvent(specificEvent);
            } else {
              // If event not found, fall back to first event
              setEvent(events[0]);
            }
          } else {
            // No eventId in URL, use first event
            setEvent(events[0]);
          }
        } else {
          setEvent(null);
        }
        setEventsLoading(false);
      },
    );
    return unsubscribe;
  }, [user, loading, router, searchParams]);

  const tabs: TabType[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "guests", label: "Guests", icon: "👥" },
    { id: "timeline", label: "Event Program", icon: "⏰" },
    { id: "presentation", label: "Presentation", icon: "🎬" },
  ];

  const handleDragEnd = (dragEvent: DragEndEvent) => {
    if (!event) return;
    const { active, over } = dragEvent;

    if (active.id !== over?.id) {
      const oldIndex = event.timeline.findIndex(
        (segment) => segment.id === active.id,
      );
      const newIndex = event.timeline.findIndex(
        (segment) => segment.id === over?.id,
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const updatedTimeline = arrayMove(event.timeline, oldIndex, newIndex);
        const updatedEvent: Event = {
          ...event,
          timeline: updatedTimeline,
        };

        eventHandlers.handleEventUpdate(updatedEvent);
      }
    }
  };

  if (!user) {
    return null;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-dark-royalty mb-2">
            No event selected
          </h2>
          <p className="text-deep-sea/70 mb-6">
            Create a new event to get started.
          </p>
          <button
            onClick={() => router.push("/newEvent?create=true")}
            className="px-6 py-3 bg-dark-royalty text-white rounded-lg hover:bg-dark-royalty/90 transition-all duration-300 text-lg font-medium"
          >
            Create New Event
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading || eventsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎬</div>
          <h2 className="text-2xl font-bold text-dark-royalty mb-2">
            Loading Event Timeline...
          </h2>
          <p className="text-deep-sea/70">Getting your event program ready</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Top Navigation Bar */}
          <EventHeader user={user} />

          {/* Tab Navigation */}
          <div className="mb-8">
            <SectionTabs
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setLastTab={setLastTab}
            />
          </div>

          {/* Page Content */}
          <div className="space-y-8">
            {activeTab === "overview" && (
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-dark-royalty">
                    Event Overview
                  </h2>
                  <p className="text-deep-sea/70 mt-2">
                    View and edit your event details
                  </p>
                </div>
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-dark-royalty">
                    Event Program
                  </h2>
                  <p className="text-deep-sea/70 mt-2">
                    Your event canvas - view and edit details
                  </p>
                </div>
              </div>
            )}

            {/* Overview Tab Content */}
            {activeTab === "overview" && event && (
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 border border-dark-royalty/10 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-2xl font-bold text-dark-royalty mb-4">
                      Event Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-deep-sea/70 mb-1">
                          Event Name
                        </label>
                        <input
                          type="text"
                          value={event.name}
                          onChange={(e) => {
                            const updatedEvent = {
                              ...event,
                              name: e.target.value,
                            };
                            eventHandlers.handleEventUpdate(updatedEvent);
                          }}
                          className="w-full px-4 py-3 border border-dark-royalty/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-deep-sea/70 mb-1">
                          Description
                        </label>
                        <textarea
                          value={event.description || ""}
                          onChange={(e) => {
                            // Update local state for immediate UI feedback
                            const updatedEvent = {
                              ...event,
                              description: e.target.value,
                            };
                            setEvent(updatedEvent);
                          }}
                          onBlur={(e) => {
                            // Save to database when user exits the field
                            const updatedEvent = {
                              ...event,
                              description: e.target.value,
                            };
                            eventHandlers.handleEventUpdate(updatedEvent);
                          }}
                          placeholder="Enter event description..."
                          rows={3}
                          className="w-full px-4 py-3 border border-dark-royalty/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-deep-sea/70 mb-1">
                          Event Tone
                        </label>
                        <select
                          value={event.tone}
                          onChange={(e) => {
                            const updatedEvent = {
                              ...event,
                              tone: e.target.value as
                                | "safe"
                                | "wild"
                                | "family-friendly"
                                | "corporate",
                            };
                            eventHandlers.handleEventUpdate(updatedEvent);
                          }}
                          className="w-full px-4 py-3 border border-dark-royalty/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
                        >
                          <option value="safe">Safe</option>
                          <option value="wild">Wild</option>
                          <option value="family-friendly">
                            Family-friendly
                          </option>
                          <option value="corporate">Corporate</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-deep-sea/70 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={event.date.toISOString().split("T")[0]}
                          onChange={(e) => {
                            const updatedEvent = {
                              ...event,
                              date: new Date(e.target.value),
                            };
                            eventHandlers.handleEventUpdate(updatedEvent);
                          }}
                          className="w-full px-4 py-3 border border-dark-royalty/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-deep-sea/70 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={event.startTime}
                          onChange={(e) => {
                            const updatedEvent = {
                              ...event,
                              startTime: e.target.value,
                            };
                            eventHandlers.handleEventUpdate(updatedEvent);
                          }}
                          className="w-full px-4 py-3 border border-dark-royalty/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-dark-royalty mb-4">
                      Event Summary
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-deep-sea/10 rounded-xl p-4">
                        <div className="text-sm font-medium text-deep-sea/70">
                          Total Guests
                        </div>
                        <div className="text-2xl font-bold text-dark-royalty">
                          {event.guests.length}
                        </div>
                      </div>
                      <div className="bg-kimchi/10 rounded-xl p-4">
                        <div className="text-sm font-medium text-deep-sea/70">
                          Total Segments
                        </div>
                        <div className="text-2xl font-bold text-dark-royalty">
                          {event.timeline.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Guests Tab Content */}
            {activeTab === "guests" && event && (
              <Guests
                event={event}
                onEventUpdate={eventHandlers.handleEventUpdate}
                setShowAddGuestModal={eventHandlers.setShowAddGuestModal}
              />
            )}

            {/* Timeline Tab Content */}
            {activeTab === "timeline" && (
              <div
                className="relative min-h-[600px] bg-gradient-to-br from-deep-sea/10 via-white to-kimchi/10 rounded-3xl p-8 border-2 border-dashed border-dark-royalty/20 overflow-hidden"
                onClick={eventHandlers.handleClickOutside}
              >
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xl rounded-xl px-4 py-2 shadow-lg border border-dark-royalty/10">
                  <div className="text-sm font-bold text-dark-royalty">
                    {formatDate(event.date)}
                  </div>
                </div>

                <div className="absolute top-4 left-4 text-6xl opacity-10 animate-bounce">
                  🎉
                </div>
                <div className="absolute bottom-8 left-8 text-4xl opacity-10 animate-pulse">
                  ✨
                </div>
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl opacity-5 animate-spin"
                  style={{ animationDuration: "20s" }}
                >
                  🎊
                </div>

                <div className="relative text-center mb-12">
                  <div className="inline-block bg-white/90 backdrop-blur-xl rounded-2xl px-8 py-6 shadow-lg border border-dark-royalty/10">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-dark-royalty to-deep-sea bg-clip-text text-transparent">
                      {event.name || "Your Event Name"}
                    </h1>
                  </div>
                </div>

                <div className="mb-8">
                  {eventHandlers.editingKickoff ? (
                    <div className="space-y-2">
                      <input
                        type="time"
                        value={eventHandlers.editKickoffTime}
                        onChange={(e) =>
                          eventHandlers.setEditKickoffTime(e.target.value)
                        }
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            eventHandlers.handleSaveKickoff();
                          } else if (e.key === "Escape") {
                            eventHandlers.handleCancelKickoff();
                          }
                        }}
                        className="px-3 py-2 border border-dark-royalty/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300 text-lg font-bold text-dark-royalty"
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={eventHandlers.handleSaveKickoff}
                          className="px-3 py-1 bg-dark-royalty text-white rounded-lg hover:bg-dark-royalty/90 transition-all duration-300 text-sm font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={eventHandlers.handleCancelKickoff}
                          className="px-3 py-1 bg-white/50 text-dark-royalty rounded-lg hover:bg-white/70 transition-all duration-300 text-sm font-medium border border-dark-royalty/20"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-2xl font-bold text-dark-royalty cursor-pointer hover:text-deep-sea transition-colors"
                      onClick={eventHandlers.handleEditKickoff}
                      title="Click to edit kickoff time"
                    >
                      Kick Off - {formatTime(event.startTime)}
                    </div>
                  )}
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={event.timeline.map((segment) => segment.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {event.timeline.map((segment, index) => (
                      <DraggableSegment
                        key={segment.id}
                        segment={segment}
                        index={index}
                        handleEditSegment={eventHandlers.handleEditSegment}
                        handleDeleteSegment={eventHandlers.handleDeleteSegment}
                        openMenuId={eventHandlers.openMenuId}
                        setOpenMenuId={eventHandlers.setOpenMenuId}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                <div className="mb-8 space-y-4">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => eventHandlers.setShowAddSegmentModal(true)}
                      className="px-6 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 font-medium"
                    >
                      + Add Segment
                    </button>
                    <button
                      onClick={() => setShowAISegmentsModal(true)}
                      className="px-6 py-3 bg-gradient-to-r from-kimchi/80 to-deep-sea/80 text-white rounded-xl hover:from-kimchi/90 hover:to-deep-sea/90 transition-all duration-300 font-medium flex items-center space-x-2"
                    >
                      <span>🤖</span>
                      <span>AI Recommended Segments</span>
                    </button>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 flex space-x-2">
                  <div className="w-3 h-3 bg-deep-sea/30 rounded-full animate-pulse"></div>
                  <div
                    className="w-3 h-3 bg-kimchi/30 rounded-full animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-dark-royalty/30 rounded-full animate-pulse"
                    style={{ animationDelay: "1s" }}
                  ></div>
                </div>
              </div>
            )}

            {/* Presentation Tab Content */}
            {activeTab === "presentation" && event && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold text-dark-royalty">
                      Presentation Preview
                    </h2>
                    <p className="text-deep-sea/70 mt-2">
                      See how your presentation will look
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      router.push(`/presentation?eventId=${event.id}`)
                    }
                    className="px-8 py-4 bg-gradient-to-r from-dark-royalty to-deep-sea text-white rounded-xl text-lg font-semibold hover:from-dark-royalty/90 hover:to-deep-sea/90 transition-all duration-300 shadow-lg hover:scale-105 flex items-center space-x-3"
                  >
                    <span className="text-2xl">🎬</span>
                    <span>Start Presentation</span>
                  </button>
                </div>

                {/* Custom Presentation Preview without header */}
                <div className="relative w-full">
                  <div className="relative w-full aspect-video bg-gradient-to-br from-deep-sea/10 via-white to-kimchi/10 rounded-2xl border-2 border-dark-royalty/20 shadow-2xl overflow-hidden">
                    <div className="h-full flex flex-col items-center justify-center p-8 relative">
                      <div className="text-center max-w-3xl mx-auto w-full">
                        <h1 className="text-4xl font-bold text-dark-royalty mb-4 leading-tight break-words">
                          {event.name}
                        </h1>
                        <p className="text-lg text-deep-sea/70 leading-relaxed max-w-2xl mx-auto break-words">
                          Event Program Preview
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modals */}
          {/* Add Guest Modal */}
          {event && (
            <AddGuestModal
              isOpen={eventHandlers.showAddGuestModal}
              onClose={() => eventHandlers.setShowAddGuestModal(false)}
              event={event}
              onEventUpdate={eventHandlers.handleEventUpdate}
            />
          )}

          {/* Add Segment Modal */}
          <AddSegmentModal
            isOpen={eventHandlers.showAddSegmentModal}
            onClose={() => {
              eventHandlers.setShowAddSegmentModal(false);
              eventHandlers.setSegmentToEdit(null);
            }}
            newSegment={eventHandlers.newSegment}
            setNewSegment={eventHandlers.setNewSegment}
            onAddSegment={eventHandlers.handleAddSegment}
            isEditing={!!eventHandlers.segmentToEdit}
            segmentToEdit={eventHandlers.segmentToEdit}
            onSaveEdit={eventHandlers.handleSaveSegmentEdit}
          />

          {/* Personal Fun Facts Modal */}
          <PersonalFunfact
            isModal={true}
            isOpen={eventHandlers.showPersonalFunfactModal}
            onClose={() => eventHandlers.setShowPersonalFunfactModal(false)}
            guests={event?.guests || []}
            funFacts={eventHandlers.newSegment.personalFunFacts}
            onFunFactsChange={eventHandlers.handleSavePersonalFunfacts}
          />

          {/* AISegments Modal */}
          <AISegments
            event={event}
            isOpen={showAISegmentsModal}
            onClose={() => setShowAISegmentsModal(false)}
            onAddSegment={eventHandlers.handleAddSegmentFromAI}
          />

          {/* Personal Fun Facts Edit Modal */}
          <PersonalFunfact
            isModal={true}
            isOpen={eventHandlers.showPersonalFunfactEditModal}
            onClose={() => {
              eventHandlers.setShowPersonalFunfactEditModal(false);
              eventHandlers.setSegmentToEdit(null);
            }}
            guests={event?.guests || []}
            funFacts={eventHandlers.segmentToEdit?.personalFunFacts || {}}
            onFunFactsChange={eventHandlers.handleSavePersonalFunfactsEdit}
            isEditable={true}
          />

          {/* Spin The Wheel Edit Modal */}
          <SpinTheWheel
            guests={event?.guests || []}
            isOpen={eventHandlers.showSpinTheWheelEditModal}
            onClose={() => {
              eventHandlers.setShowSpinTheWheelEditModal(false);
              eventHandlers.setSegmentToEdit(null);
            }}
            onSave={eventHandlers.handleSaveSpinTheWheelEdit}
            initialChallenge={eventHandlers.segmentToEdit?.description || ""}
          />

          {/* Slide Show Edit Modal */}
          <SlideShow
            event={event}
            isOpen={eventHandlers.showSlideShowEditModal}
            onClose={() => {
              eventHandlers.setShowSlideShowEditModal(false);
              eventHandlers.setSegmentToEdit(null);
            }}
            onSave={eventHandlers.handleSaveSlideShowEdit}
            initialSegment={eventHandlers.segmentToEdit || undefined}
          />

          {/* Jeopardy Edit Modal */}
          <Jeopardy
            event={event}
            isOpen={eventHandlers.showJeopardyEditModal}
            onClose={() => {
              eventHandlers.setShowJeopardyEditModal(false);
              eventHandlers.setSegmentToEdit(null);
            }}
            onSave={eventHandlers.handleSaveJeopardyEdit}
            initialSegment={eventHandlers.segmentToEdit || undefined}
          />

          {/* Poll Edit Modal */}
          <Modal
            isOpen={eventHandlers.showPollEditModal}
            onClose={() => {
              eventHandlers.setShowPollEditModal(false);
              eventHandlers.setSegmentToEdit(null);
            }}
            title="Edit Live Poll"
            maxWidth="max-w-4xl"
            minHeight="min-h-[600px]"
            saveDisabled={true}
            disableEnterSave={true}
          >
            <Poll
              segment={
                eventHandlers.segmentToEdit || {
                  id: "",
                  title: "Live Poll",
                  type: "poll",
                  description: "",
                  duration: 10,
                  content: "",
                  order: 0,
                  data: {
                    question: "Who should take a shot?",
                    options: ["Option 1", "Option 2", "Option 3"],
                    showResultsLive: true,
                    allowMultipleSelections: false,
                    sessionCode: Math.random()
                      .toString(36)
                      .substring(2, 8)
                      .toUpperCase(),
                    votes: {},
                    totalVotes: 0,
                  },
                }
              }
              event={event}
              isEditMode={true}
              onUpdate={eventHandlers.handleSavePollEdit}
            />
          </Modal>

          {/* LiveQuiz Edit Modal */}
          <Modal
            isOpen={eventHandlers.showLiveQuizEditModal}
            onClose={() => {
              eventHandlers.setShowLiveQuizEditModal(false);
              eventHandlers.setSegmentToEdit(null);
            }}
            title="Edit Live Quiz"
            maxWidth="max-w-4xl"
            minHeight="min-h-[600px]"
            saveDisabled={true}
            disableEnterSave={true}
          >
            <LiveQuiz
              segment={
                eventHandlers.segmentToEdit || {
                  id: "",
                  title: "Live Quiz",
                  type: "quiz",
                  description: "",
                  duration: 15,
                  content: "",
                  order: 0,
                  data: {
                    quizData: {
                      sessionCode: Math.random()
                        .toString(36)
                        .substring(2, 8)
                        .toUpperCase(),
                      questions: [],
                      currentQuestionIndex: 0,
                      isActive: false,
                      responses: {},
                      scores: {},
                    },
                  },
                }
              }
              event={event}
              isEditMode={true}
              isPresentation={false}
              onUpdate={eventHandlers.handleSaveLiveQuizEdit}
            />
          </Modal>
        </div>
      </div>
    </DndContext>
  );
}
