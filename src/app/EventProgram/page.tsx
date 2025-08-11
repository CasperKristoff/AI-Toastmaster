"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Event } from "../../types/event";
import { eventService } from "../../services/eventService";
import EventProgram from "./components/sections/EventProgram";
import EventHeader from "./components/sections/EventHeader";
import AddSegmentModal from "./components/sections/AddSegmentModal";
import StepperProgress from "../newEvent/components/sections/StepperProgress";
import Guests from "../newEvent/components/Guests";
import AddGuestModal from "../newEvent/components/AddGuestModal";
import { useEventHandlers } from "./components/sections/EventHandlers";
import PersonalFunfact from "./components/PersonalFunfact";
import SpinTheWheel from "./components/SpinTheWheel";
import SlideShow from "./components/SlideShow";
import Jeopardy from "./components/Jeopardy";

import { DragEndEvent, PointerSensor, KeyboardSensor } from "@dnd-kit/core";

function EventProgramPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [currentStep, setCurrentStep] = useState("segments");
  const [activeTab, setActiveTab] = useState<
    "overview" | "guests" | "segments" | "preview"
  >("segments");

  // Use EventHandlers for consistent segment editing
  const eventHandlers = useEventHandlers({
    user,
    event,
    setEvent,
    onNavigate: (url: string) => router.push(url),
  });

  // Get event ID from URL parameters
  const eventId = searchParams.get("eventId");

  // DnD sensors
  const sensors = [
    {
      sensor: PointerSensor,
      options: {
        activationConstraint: {
          distance: 8,
        },
      },
    },
    {
      sensor: KeyboardSensor,
      options: {},
    },
  ];

  // Subscribe to user events when authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }

    if (!user) {
      return;
    }

    setEventsLoading(true);

    const unsubscribe = eventService.subscribeToUserEvents(
      user.uid,
      (events) => {
        if (events.length > 0) {
          if (eventId) {
            const specificEvent = events.find((e) => e.id === eventId);
            if (specificEvent) {
              setEvent(specificEvent);
            } else {
              setEvent(events[0]);
            }
          } else {
            setEvent(events[0]);
          }
        } else {
          setEvent(null);
        }
        setEventsLoading(false);
      },
    );
    return unsubscribe;
  }, [user, loading, router, eventId]);

  // Removed handleClickOutside - now using EventHandlers

  const handleDragEnd = (dragEvent: DragEndEvent) => {
    const { active, over } = dragEvent;

    if (active.id !== over?.id && event && over) {
      const oldIndex = event.timeline.findIndex(
        (segment) => segment.id === active.id,
      );
      const newIndex = event.timeline.findIndex(
        (segment) => segment.id === over.id,
      );

      const newTimeline = [...event.timeline];
      const [movedSegment] = newTimeline.splice(oldIndex, 1);
      newTimeline.splice(newIndex, 0, movedSegment);

      const updatedEvent: Event = {
        ...event,
        timeline: newTimeline,
      };

      eventService.updateEvent(updatedEvent.id, updatedEvent);
    }
  };

  // Removed custom handlers - now using EventHandlers for consistency

  // Removed custom kickoff handlers - now using EventHandlers

  const formatTime = (time: string) => {
    return time;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Removed onAddSegment - now using EventHandlers

  const handleEventUpdate = (updatedEvent: Event) => {
    eventService.updateEvent(updatedEvent.id, updatedEvent);
    setEvent(updatedEvent);
  };

  const handleStepChange = (step: string) => {
    setCurrentStep(step);
    setActiveTab(step as "overview" | "guests" | "segments" | "preview");

    // Handle step changes within the same page context
    switch (step) {
      case "overview":
        // Show overview content
        break;
      case "guests":
        // Show guests content
        break;
      case "segments":
        // Show segments content (already shown)
        break;
      case "preview":
        // Navigate to presentation page but maintain event context
        if (event?.id) {
          router.push(`/presentation?eventId=${event.id}`);
        }
        break;
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
            Please select an event to view its program.
          </p>
          <button
            onClick={() => router.push("/ProfilePage")}
            className="px-6 py-3 bg-dark-royalty text-white rounded-lg hover:bg-dark-royalty/90 transition-all duration-300 text-lg font-medium"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  if (loading || eventsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎊</div>
          <h2 className="text-2xl font-bold text-dark-royalty mb-2">
            Loading Event Program...
          </h2>
          <p className="text-deep-sea/70">Getting your event ready</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <EventHeader user={user} />

        {/* Stepper Progress Bar */}
        <StepperProgress
          steps={[
            { id: "overview", label: "Overview" },
            { id: "guests", label: "Guests" },
            { id: "segments", label: "Event Program" },
            { id: "preview", label: "Presentation" },
          ]}
          currentStep={currentStep}
          onStepChange={handleStepChange}
          className="mb-8"
        />

        {/* Content based on active tab */}
        {activeTab === "overview" && (
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 border border-dark-royalty/10">
            <h2 className="text-3xl font-bold text-dark-royalty mb-6">
              Event Overview
            </h2>
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
                        const updatedEvent = { ...event, name: e.target.value };
                        eventService.updateEvent(updatedEvent.id, updatedEvent);
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
                        const updatedEvent = {
                          ...event,
                          description: e.target.value,
                        };
                        eventService.updateEvent(updatedEvent.id, updatedEvent);
                      }}
                      rows={3}
                      className="w-full px-4 py-3 border border-dark-royalty/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300 resize-none"
                    />
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
                        eventService.updateEvent(updatedEvent.id, updatedEvent);
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
                        eventService.updateEvent(updatedEvent.id, updatedEvent);
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

        {activeTab === "guests" && (
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 border border-dark-royalty/10">
            <Guests
              event={event}
              onEventUpdate={handleEventUpdate}
              setShowAddGuestModal={setShowAddGuestModal}
            />
          </div>
        )}

        {activeTab === "segments" && (
          <EventProgram
            event={event}
            setShowAddSegmentModal={eventHandlers.setShowAddSegmentModal}
            editingKickoff={eventHandlers.editingKickoff}
            setEditingKickoff={eventHandlers.setEditingKickoff}
            editKickoffTime={eventHandlers.editKickoffTime}
            setEditKickoffTime={eventHandlers.setEditKickoffTime}
            handleEditKickoff={eventHandlers.handleEditKickoff}
            handleSaveKickoff={eventHandlers.handleSaveKickoff}
            handleCancelKickoff={eventHandlers.handleCancelKickoff}
            formatTime={formatTime}
            formatDate={formatDate}
            handleClickOutside={eventHandlers.handleClickOutside}
            sensors={sensors}
            handleDragEnd={handleDragEnd}
            editingSegment={eventHandlers.editingSegment}
            editSegment={eventHandlers.editSegment}
            setEditSegment={eventHandlers.setEditSegment}
            handleEditSegment={(id: string) => {
              // Fallback inline editing for regular segments
              const segment = event.timeline.find((s) => s.id === id);
              if (!segment) return;

              eventHandlers.setEditingSegment(id);
              eventHandlers.setEditSegment({
                title: segment.title,
                description: segment.description || "",
                duration: segment.duration.toString(),
                type: segment.type,
                personalFunFacts: segment.personalFunFacts || {},
              });
            }}
            handleSaveSegmentEdit={eventHandlers.handleSaveSegmentEdit}
            handleCancelSegmentEdit={eventHandlers.handleCancelSegmentEdit}
            handleDeleteSegment={eventHandlers.handleDeleteSegment}
            openMenuId={eventHandlers.openMenuId}
            setOpenMenuId={eventHandlers.setOpenMenuId}
            handleOpenPersonalFunfactModal={
              eventHandlers.handleOpenPersonalFunfactModal
            }
            onAddSegment={eventHandlers.handleAddSegmentFromAI}
            handleSpecializedEdit={eventHandlers.handleEditSegment}
            onNavigate={(url: string) => router.push(url)}
          />
        )}

        {/* Add Segment Modal */}
        <AddSegmentModal
          isOpen={eventHandlers.showAddSegmentModal}
          onClose={() => eventHandlers.setShowAddSegmentModal(false)}
          newSegment={eventHandlers.newSegment}
          setNewSegment={eventHandlers.setNewSegment}
          onAddSegment={eventHandlers.handleAddSegment}
        />

        {/* Add Guest Modal */}
        {event && (
          <AddGuestModal
            isOpen={showAddGuestModal}
            onClose={() => setShowAddGuestModal(false)}
            event={event}
            onEventUpdate={handleEventUpdate}
          />
        )}

        {/* Specialized Editing Modals */}
        {event && (
          <>
            {/* Personal Fun Facts Modal */}
            <PersonalFunfact
              isModal={true}
              isOpen={eventHandlers.showPersonalFunfactModal}
              onClose={() => eventHandlers.setShowPersonalFunfactModal(false)}
              guests={event.guests || []}
              funFacts={eventHandlers.newSegment.personalFunFacts}
              onFunFactsChange={eventHandlers.handleSavePersonalFunfacts}
            />

            {/* Specialized Edit Modals */}
            <PersonalFunfact
              isModal={true}
              isOpen={eventHandlers.showPersonalFunfactEditModal}
              onClose={() => {
                eventHandlers.setShowPersonalFunfactEditModal(false);
                eventHandlers.setSegmentToEdit(null);
              }}
              guests={event.guests || []}
              funFacts={eventHandlers.segmentToEdit?.personalFunFacts || {}}
              onFunFactsChange={eventHandlers.handleSavePersonalFunfactsEdit}
            />

            <SpinTheWheel
              guests={event.guests || []}
              isOpen={eventHandlers.showSpinTheWheelEditModal}
              onClose={() => {
                eventHandlers.setShowSpinTheWheelEditModal(false);
                eventHandlers.setSegmentToEdit(null);
              }}
              onSave={eventHandlers.handleSaveSpinTheWheelEdit}
              initialChallenge={eventHandlers.segmentToEdit?.description || ""}
            />

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

            {/* AISegments Modal - This is handled by the EventProgram component itself */}
          </>
        )}
      </div>
    </div>
  );
}

export default function EventProgramPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🎊</div>
            <h2 className="text-2xl font-bold text-dark-royalty mb-2">
              Loading Event Program...
            </h2>
            <p className="text-deep-sea/70">Getting your event ready</p>
          </div>
        </div>
      }
    >
      <EventProgramPageContent />
    </Suspense>
  );
}
