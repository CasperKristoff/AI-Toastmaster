"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Event } from "../../types/event";
import { eventService } from "../../services/eventService";
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
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import EventCreationForm from "./components/EventCreationForm";
import Overview from "./components/Overview";
import Guests from "./components/Guests";
import AddGuestModal from "./components/AddGuestModal";
import PresentationPreview from "../presentation/components/PresentationPreview";
import EventProgram from "../EventProgram/components/sections/EventProgram";
import { formatTime, formatDate, getEventTypeIcon, getEventTypeLabel, getToneLabel } from "../EventProgram/components/sections/EventUtils";
import { useEventHandlers } from "../EventProgram/components/sections/EventHandlers";
import AddSegmentModal from "../EventProgram/components/sections/AddSegmentModal";
import PersonalFunfact from "../EventProgram/components/PersonalFunfact";
import AISegments from "../EventProgram/components/sections/AISegments";
import SpinTheWheel from "../EventProgram/components/SpinTheWheel";
import SlideShow from "../EventProgram/components/SlideShow";
import Jeopardy from "../EventProgram/components/Jeopardy";

type TabType = { id: 'overview' | 'guests' | 'timeline' | 'presentation'; label: string; icon: string };

function SectionTabs({ tabs, activeTab, setActiveTab, setLastTab }: {
  tabs: TabType[];
  activeTab: TabType['id'];
  setActiveTab: (id: TabType['id']) => void;
  setLastTab: (id: TabType['id']) => void;
}) {
  const activeIdx = tabs.findIndex(tab => tab.id === activeTab);

  // Define completion logic for each section
  const getStepStatus = (tabId: TabType['id']) => {
    const stepIndex = tabs.findIndex(tab => tab.id === tabId);
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (stepIndex < activeIndex) return 'completed';
    if (stepIndex === activeIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full flex items-center justify-between" style={{ minHeight: '80px' }}>
        {/* Progress line background */}
        <div className="absolute left-0 right-0 h-2 bg-gray-200 rounded-full" style={{ top: '40px', transform: 'translateY(-50%)' }} />
        {/* Progress fill */}
        <div
          className="absolute h-2 bg-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{
            top: '40px',
            left: 0,
            width: `calc(${(100 / (tabs.length - 1)) * activeIdx}%)`,
            transform: 'translateY(-50%)',
          }}
        />
        {/* Circles */}
        {tabs.map((tab) => {
          const status = getStepStatus(tab.id);
          const isCompleted = status === 'completed';
          const isCurrent = status === 'current';
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
                  ${isCompleted ? 'border-blue-500 bg-blue-500 hover:shadow-lg hover:scale-105' :
                    isCurrent ? 'border-blue-500 bg-white hover:shadow-lg hover:scale-105' :
                    'border-gray-300 bg-white hover:border-blue-300 hover:shadow-md hover:scale-105'}
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                title={`Click to go to ${tab.label}`}
              >
                {isCompleted && (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {/* Hover indicator for non-completed steps */}
                {!isCompleted && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
              <span
                className={`mt-3 text-base font-medium transition-all duration-300 text-center
                  ${isCompleted ? 'text-blue-600' :
                    isCurrent ? 'text-blue-600 font-semibold' :
                    'text-gray-400 group-hover:text-gray-600'}
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
            const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
            if (currentIndex > 0) {
              const prevTab = tabs[currentIndex - 1];
              setLastTab(activeTab);
              setActiveTab(prevTab.id);
            }
          }}
          disabled={activeIdx === 0}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
            ${activeIdx === 0 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer'
            }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Previous</span>
        </button>
        
        <button
          onClick={() => {
            const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
            if (currentIndex < tabs.length - 1) {
              const nextTab = tabs[currentIndex + 1];
              setLastTab(activeTab);
              setActiveTab(nextTab.id);
            }
          }}
          disabled={activeIdx === tabs.length - 1}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
            ${activeIdx === tabs.length - 1 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer'
            }`}
        >
          <span>Next</span>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function NewEventPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'timeline' | 'presentation'>('overview');
  const [, setLastTab] = useState<'overview' | 'guests' | 'timeline' | 'presentation'>('overview');
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Use the consolidated EventHandlers hook
  const eventHandlers = useEventHandlers({ user, event, setEvent });

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

  const tabs: TabType[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'guests', label: 'Guests', icon: '👥' },
    { id: 'timeline', label: 'Event Program', icon: '⏰' },
    { id: 'presentation', label: 'Presentation', icon: '🎬' }
  ];

  const handleEventCreated = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      const eventId = await eventService.createEvent(eventData, user.uid);
      console.log("Event created with ID:", eventId);
      
      // Redirect back to the dashboard (without create parameter)
      router.push('/newEvent');
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. Please try again.");
    }
  };

  // Check if we're in create mode
  const isCreateMode = searchParams.get('create') === 'true';

  if (!user) {
    // This will be null on initial load, and after auth check if user is not logged in.
    // The useEffect hook will redirect to '/' if user is not logged in after loading is complete.
    return null; 
  }

  // Show EventCreationForm if in create mode
  if (isCreateMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-dark-royalty font-poppins">Create New Event</h1>
              <p className="text-deep-sea/70 text-lg">Set up your event details</p>
            </div>
            <button
              onClick={() => router.push('/newEvent')}
              className="px-6 py-3 bg-white/70 backdrop-blur-xl text-dark-royalty rounded-xl border border-dark-royalty/20 hover:border-dark-royalty/40 hover:bg-white/90 transition-all duration-300 hover:scale-105 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* EventCreationForm */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-8 border border-dark-royalty/10">
            <EventCreationForm onEventCreated={handleEventCreated} />
          </div>
        </div>
      </div>
    );
  }

  // Show dashboard (existing logic)
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
          <h2 className="text-2xl font-bold text-dark-royalty mb-2">Loading Event Dashboard...</h2>
          <p className="text-deep-sea/70">Getting your events ready</p>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Navigation Bar */}
        <nav className="bg-white/80 backdrop-blur-xl border-b border-dark-royalty/10 px-6 py-4 relative mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/ProfilePage')}
              className="text-2xl font-bold text-dark-royalty hover:text-deep-sea transition-colors duration-300 cursor-pointer"
            >
              AI Toastmaster
            </button>
          </div>
        </div>
      </nav>

          {/* Tab Navigation */}
          <div className="mb-8">
            <SectionTabs
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab as (id: TabType['id']) => void}
              setLastTab={setLastTab as (id: TabType['id']) => void}
            />
          </div>

          {/* Tab Content */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-8 border border-dark-royalty/10">
            {activeTab === 'overview' && event && (
              <Overview event={event} />
            )}
            {activeTab === 'guests' && event && (
              <Guests
                event={event}
                onEventUpdate={(updatedEvent) => {
                  setEvent(updatedEvent);
                }}
                setShowAddGuestModal={eventHandlers.setShowAddGuestModal}
              />
            )}
            {activeTab === 'timeline' && event && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
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
                  getEventTypeIcon={getEventTypeIcon}
                  getEventTypeLabel={getEventTypeLabel}
                  getToneLabel={getToneLabel}
                  handleClickOutside={eventHandlers.handleClickOutside}
                  sensors={sensors}
                  handleDragEnd={handleDragEnd}
                  handleEditSegment={eventHandlers.handleEditSegment}
                  handleDeleteSegment={eventHandlers.handleDeleteSegment}
                  openMenuId={eventHandlers.openMenuId}
                  setOpenMenuId={eventHandlers.setOpenMenuId}
                  onAddSegment={eventHandlers.handleAddSegmentFromAI}
                />
              </DndContext>
            )}
            {activeTab === 'presentation' && event && (
              <PresentationPreview event={event} />
            )}
          </div>
        </div>

        {/* Add Guest Modal */}
        {event && (
          <AddGuestModal
            isOpen={eventHandlers.showAddGuestModal}
            onClose={() => eventHandlers.setShowAddGuestModal(false)}
            event={event}
          onEventUpdate={(updatedEvent) => setEvent(updatedEvent)}
          />
        )}
        
      {/* EventProgram Modals */}
      {event && (
        <>
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

          {/* Specialized Edit Modals */}
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
          />

          <SpinTheWheel
            guests={event?.guests || []}
            isOpen={eventHandlers.showSpinTheWheelEditModal}
            onClose={() => {
              eventHandlers.setShowSpinTheWheelEditModal(false);
              eventHandlers.setSegmentToEdit(null);
            }}
            onSave={eventHandlers.handleSaveSpinTheWheelEdit}
            initialChallenge={eventHandlers.segmentToEdit?.description || ''}
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

          {/* AISegments Modal */}
          <AISegments
            event={event}
            isOpen={false}
            onClose={() => {}}
            onAddSegment={eventHandlers.handleAddSegmentFromAI}
          />

          {/* Jeopardy Modal */}
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
        </>
      )}
    </div>
  );
}

export default function NewEventPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎬</div>
          <h2 className="text-2xl font-bold text-dark-royalty mb-2">Loading Event Dashboard...</h2>
          <p className="text-deep-sea/70">Getting your events ready</p>
        </div>
      </div>
    }>
      <NewEventPageContent />
    </Suspense>
  );
} 