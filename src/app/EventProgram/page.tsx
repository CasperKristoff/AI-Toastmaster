"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Event, EventSegment } from "../../types/event";
import { eventService } from "../../services/eventService";
import AISegments from "./components/sections/AISegments";
import AddSegmentModal from "./components/sections/AddSegmentModal";
import PersonalFunfact from "./components/PersonalFunfact";
import AddGuestModal from "../newEvent/components/AddGuestModal";
import EventHeader from "./components/sections/EventHeader";
import { useEventHandlers } from "./components/sections/EventHandlers";
import { formatTime, formatDate, getEventTypeIcon, getEventTypeLabel, getToneLabel } from "./components/sections/EventUtils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Draggable Segment Component
function DraggableSegment({ 
  segment, 
  index, 
  handleEditSegment, 
  handleDeleteSegment, 
  openMenuId,
  setOpenMenuId
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
              {segment.description && segment.description !== "Guess who each fun fact belongs to!" && (
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

export default function TimelinePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showAISegmentsModal, setShowAISegmentsModal] = useState(false);

  // Use the event handlers hook
  const eventHandlers = useEventHandlers({ user, event, setEvent });

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Subscribe to user events when authenticated
  useEffect(() => {
    // Only redirect if auth is complete and user is null
    if (!loading && !user) {
      router.push('/');
      return;
    }

    // Only subscribe if user is authenticated
    if (!user) {
      return; // Still loading, don't do anything yet
    }

    // Reset loading state when starting new subscription
    setEventsLoading(true);

    const unsubscribe = eventService.subscribeToUserEvents(user.uid, (events) => {
      if (events.length > 0) {
        setEvent(events[0]);
      } else {
        setEvent(null);
      }
      setEventsLoading(false);
    });
    return unsubscribe;
  }, [user, loading, router]);

  const handleDragEnd = (dragEvent: DragEndEvent) => {
    if (!event) return;
    const { active, over } = dragEvent;

    if (active.id !== over?.id) {
      const oldIndex = event.timeline.findIndex(segment => segment.id === active.id);
      const newIndex = event.timeline.findIndex(segment => segment.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const updatedTimeline = arrayMove(event.timeline, oldIndex, newIndex);
        const updatedEvent: Event = {
          ...event,
          timeline: updatedTimeline
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
          <h2 className="text-2xl font-bold text-dark-royalty mb-2">No event selected</h2>
          <p className="text-deep-sea/70 mb-6">Create a new event to get started.</p>
          <button
            onClick={() => router.push('/newEvent?create=true')}
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
          <h2 className="text-2xl font-bold text-dark-royalty mb-2">Loading Event Timeline...</h2>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top Navigation Bar */}
          <EventHeader user={user} />

          {/* Page Content */}
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-dark-royalty">Event Program</h2>
                <p className="text-deep-sea/70 mt-2">Your event canvas - view and edit details</p>
              </div>
              <button 
                onClick={() => eventHandlers.setShowAddSegmentModal(true)}
                className="px-6 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 hover:scale-105 font-medium"
              >
                + Add Segment
              </button>
            </div>
            
            <div 
              className="relative min-h-[600px] bg-gradient-to-br from-deep-sea/10 via-white to-kimchi/10 rounded-3xl p-8 border-2 border-dashed border-dark-royalty/20 overflow-hidden"
              onClick={eventHandlers.handleClickOutside}
            >
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xl rounded-xl px-4 py-2 shadow-lg border border-dark-royalty/10">
                <div className="text-sm font-bold text-dark-royalty">{formatDate(event.date)}</div>
              </div>
              
              <div className="absolute top-4 left-4 text-6xl opacity-10 animate-bounce">🎉</div>
              <div className="absolute bottom-8 left-8 text-4xl opacity-10 animate-pulse">✨</div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl opacity-5 animate-spin" style={{animationDuration: '20s'}}>🎊</div>
              
              <div className="relative text-center mb-12">
                <div className="inline-block bg-white/90 backdrop-blur-xl rounded-2xl px-8 py-6 shadow-lg border border-dark-royalty/10">
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-dark-royalty to-deep-sea bg-clip-text text-transparent">
                    {event.name || "Your Event Name"}
                  </h1>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="group bg-white/90 backdrop-blur-xl rounded-2xl p-6 border-2 border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl animate-pulse">🎭</div>
                      <div>
                        <h3 className="text-lg font-bold text-dark-royalty mb-1">Event Tone</h3>
                        <p className="text-deep-sea/70 font-medium">{getToneLabel(event.tone)}</p>
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-gradient-to-r from-dark-royalty to-deep-sea text-white rounded-full text-sm font-bold shadow-lg">
                      {event.tone}
                    </div>
                  </div>
                </div>

                <div className="group bg-white/90 backdrop-blur-xl rounded-2xl p-6 border-2 border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl animate-bounce">{getEventTypeIcon(event.type)}</div>
                      <div>
                        <h3 className="text-lg font-bold text-dark-royalty mb-1">Event Type</h3>
                        <p className="text-deep-sea/70 font-medium">{getEventTypeLabel(event.type)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                {eventHandlers.editingKickoff ? (
                  <div className="space-y-2">
                    <input
                      type="time"
                      value={eventHandlers.editKickoffTime}
                      onChange={(e) => eventHandlers.setEditKickoffTime(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          eventHandlers.handleSaveKickoff();
                        } else if (e.key === 'Escape') {
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
                  items={event.timeline.map(segment => segment.id)}
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
                <div className="w-3 h-3 bg-kimchi/30 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <div className="w-3 h-3 bg-dark-royalty/30 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              </div>
            </div>
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
        </div>
      </div>
    </DndContext>
  );
} 