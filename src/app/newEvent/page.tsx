"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User } from "firebase/auth";
import { useAuth } from "../../hooks/useAuth";
import { Event, Guest, EventSegment, SegmentType } from "../../types/event";
import { eventService } from "../../services/eventService";
import EventCreationForm from "./components/EventCreationForm";
import PersonalFunfact from "./sections/PersonalFunfact";
import Overview from "./components/Overview";
import Guests from "./components/Guests";
import EventProgram from "./components/EventProgram";
import AddGuestModal from "./components/AddGuestModal"; 
import AddSegmentModal from "./sections/AddSegmentModal";
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type TabType = { id: 'overview' | 'guests' | 'timeline' | 'presentation'; label: string; icon: string };

function SectionProgress({ event, activeTab }: { event: any, activeTab: string }) {
  // Define completion logic for each section
  const sections = [
    { id: 'overview', label: 'Overview', complete: !!event?.name },
    { id: 'guests', label: 'Guests', complete: event?.guests?.length > 0 },
    { id: 'timeline', label: 'Event Program', complete: event?.timeline?.length > 0 },
    { id: 'presentation', label: 'Start Presentation', complete: event?.timeline?.length > 0 },
  ];
  const completedCount = sections.filter(s => s.complete).length;
  return (
    <div className="flex items-center justify-center mb-4">
      <span className="text-deep-sea/70 text-sm font-medium bg-white/60 px-4 py-2 rounded-full shadow border border-dark-royalty/10">
        {completedCount} of {sections.length} sections completed
      </span>
    </div>
  );
}

function SectionTabs({ tabs, activeTab, setActiveTab, lastTab, setLastTab, event, router }: {
  tabs: TabType[];
  activeTab: TabType['id'];
  setActiveTab: (id: TabType['id']) => void;
  lastTab: TabType['id'];
  setLastTab: (id: TabType['id']) => void;
  event: any;
  router: any;
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
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id;
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
                  if (tab.id === 'presentation') {
                    if (event) {
                      router.push(`/presentation?eventId=${event.id}&startIndex=0`);
                    }
                  } else {
                    setLastTab(activeTab);
                    setActiveTab(tab.id);
                  }
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
              if (nextTab.id === 'presentation') {
                if (event) {
                  router.push(`/presentation?eventId=${event.id}&startIndex=0`);
                }
              } else {
                setLastTab(activeTab);
                setActiveTab(nextTab.id);
              }
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

export default function NewEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'timeline' | 'presentation'>('overview');
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [editingKickoff, setEditingKickoff] = useState(false);
  const [editKickoffTime, setEditKickoffTime] = useState("");
  const [showAddSegmentModal, setShowAddSegmentModal] = useState(false);
  const [showPersonalFunfactModal, setShowPersonalFunfactModal] = useState(false);
  const [newSegment, setNewSegment] = useState({
    title: "",
    description: "",
    duration: "",
    type: "activity" as SegmentType,
    personalFunFacts: {} as Record<string, string>
  });
  const [editingSegment, setEditingSegment] = useState<string | null>(null);
  const [editSegment, setEditSegment] = useState<{
    title: string;
    description: string;
    duration: string;
    type: SegmentType;
    personalFunFacts: Record<string, string>;
  }>({
    title: "",
    description: "",
    duration: "",
    type: "activity",
    personalFunFacts: {}
  });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [lastTab, setLastTab] = useState<'overview' | 'guests' | 'timeline' | 'presentation'>('overview');

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

    // TEMPORARILY DISABLED FIRESTORE - Using mock data
    // const unsubscribe = eventService.subscribeToUserEvents(user.uid, (events) => {
    //   setUserEvents(events);
    //   // Set the first event as the current event, or create a new one
    //   if (events.length > 0) {
    //     setEvent(events[0]);
    //   }
    //   setEventsLoading(false); // Events have loaded (whether empty or not)
    // });

    // Mock event data for testing
    const mockEvent: Event = {
      id: "mock-event-1",
      userId: user.uid,
      name: "Test Event",
      type: "house",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      startTime: "19:00",
      duration: 120,
      venue: "Test Venue",
      tone: "casual",
      guests: [
        { id: "1", name: "Alice", relationship: "Friend" },
        { id: "2", name: "Bob", relationship: "Colleague" }
      ],
      timeline: [
        {
          id: "1",
          type: "welcome",
          title: "Welcome & Greetings",
          description: "Warm welcome to all guests",
          duration: 15,
          content: "Welcome everyone!",
          order: 1,
          isCustom: false
        },
        {
          id: "2", 
          type: "activity",
          title: "Ice Breaker Game",
          description: "Fun activity to get everyone talking",
          duration: 20,
          content: "Two truths and a lie",
          order: 2,
          isCustom: false
        }
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log("Mock event guests:", mockEvent.guests);
    setUserEvents([mockEvent]);
    setEvent(mockEvent);
    setEventsLoading(false);

    // Return empty cleanup function
    return () => {};
  }, [user, loading, router]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

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

  // Utility function to remove undefined values from objects
  const cleanUndefinedValues = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj; // Preserve Date objects
    if (Array.isArray(obj)) return obj.map(cleanUndefinedValues);
    
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefinedValues(value);
      }
    }
    return cleaned;
  };

  const handleEventUpdate = async (updatedEvent: Event) => {
    if (!user) return;

    try {
      // TEMPORARILY DISABLED FIRESTORE - Just update local state
      // Clean undefined values before updating
      const cleanedEvent = cleanUndefinedValues(updatedEvent);
      
      // await eventService.updateEvent(cleanedEvent.id, cleanedEvent);
      
      // Store event data in localStorage for presentation page to access
      localStorage.setItem('currentEvent', JSON.stringify(cleanedEvent));
      
      setEvent(cleanedEvent);
      console.log("Event updated successfully (mock mode)");
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  // Store initial event data in localStorage
  useEffect(() => {
    if (event) {
      localStorage.setItem('currentEvent', JSON.stringify(event));
    }
  }, [event]);

  const handleEditKickoff = () => {
    if (!event) return;
    setEditingKickoff(true);
    setEditKickoffTime(event.startTime);
  };

  const handleSaveKickoff = () => {
    if (editKickoffTime && event) {
      const updatedEvent: Event = {
        ...event,
        startTime: editKickoffTime
      };
      
      handleEventUpdate(updatedEvent);
      
      setEditingKickoff(false);
      setEditKickoffTime("");
    }
  };

  const handleCancelKickoff = () => {
    setEditingKickoff(false);
    setEditKickoffTime("");
  };

  const handleAddSegment = () => {
    if (!event || !newSegment.title || !newSegment.duration || isNaN(Number(newSegment.duration)) || Number(newSegment.duration) <= 0) {
      return;
    }

    const isPersonalFunFactsSegment = newSegment.title.toLowerCase().includes('personal fun fact') || 
                                     newSegment.title.toLowerCase().includes('fun fact');
    
    let segmentsToAdd: EventSegment[] = [];
    
    if (isPersonalFunFactsSegment && Object.keys(newSegment.personalFunFacts).length > 0) {
      const validFunFacts = Object.entries(newSegment.personalFunFacts).filter(([guestId, funFact]) => {
        const guest = event.guests.find(g => g.id === guestId);
        return guest && funFact && funFact.trim() !== "";
      });
      
      if (validFunFacts.length > 0) {
        const totalDuration = validFunFacts.length * 2;
        
        const segment: EventSegment = {
          id: Date.now().toString(),
          type: "game" as SegmentType,
          title: "Personal Fun Facts",
          description: `Guess who each fun fact belongs to!`,
          duration: totalDuration,
          content: `Each fun fact will be shown individually. Give guests time to discuss and guess before revealing each answer.`,
          order: event.timeline.length + 1,
          isCustom: true,
          personalFunFacts: newSegment.personalFunFacts
        };
        segmentsToAdd.push(segment);
      }
    } else {
      const segment: EventSegment = {
        id: Date.now().toString(),
        type: newSegment.type,
        title: newSegment.title,
        description: newSegment.description || "",
        duration: Number(newSegment.duration),
        content: "",
        order: event.timeline.length + 1,
        isCustom: true,
        ...(Object.keys(newSegment.personalFunFacts).length > 0 && { personalFunFacts: newSegment.personalFunFacts })
      };
      segmentsToAdd.push(segment);
    }
    
    const updatedEvent: Event = {
      ...event,
      timeline: [...event.timeline, ...segmentsToAdd]
    };
    
    handleEventUpdate(updatedEvent);
    
    setNewSegment({
      title: "",
      description: "",
      duration: "",
      type: "activity",
      personalFunFacts: {}
    });
    
    setShowAddSegmentModal(false);
  };

  const handleEditSegment = (segmentId: string) => {
    if (!event) return;
    const segment = event.timeline.find(s => s.id === segmentId);
    if (segment) {
      setEditingSegment(segmentId);
      setEditSegment({
        title: segment.title,
        description: segment.description,
        duration: segment.duration.toString(),
        type: segment.type,
        personalFunFacts: segment.personalFunFacts || {}
      });
    }
  };

  const handleSaveSegmentEdit = (segmentId: string) => {
    if (!event || !editSegment.title || !editSegment.duration || isNaN(Number(editSegment.duration)) || Number(editSegment.duration) <= 0) {
      return;
    }

    const updatedEvent: Event = {
      ...event,
      timeline: event.timeline.map(segment => 
        segment.id === segmentId 
          ? { 
              ...segment, 
              title: editSegment.title,
              description: editSegment.description || "",
              duration: Number(editSegment.duration),
              type: editSegment.type,
              ...(Object.keys(editSegment.personalFunFacts).length > 0 && { personalFunFacts: editSegment.personalFunFacts })
            }
          : segment
      )
    };
    
    handleEventUpdate(updatedEvent);
    
    setEditingSegment(null);
    setEditSegment({
      title: "",
      description: "",
      duration: "",
      type: "activity",
      personalFunFacts: {}
    });
  };

  const handleCancelSegmentEdit = () => {
    setEditingSegment(null);
    setEditSegment({
      title: "",
      description: "",
      duration: "",
      type: "activity",
      personalFunFacts: {}
    });
  };

  const handleOpenPersonalFunfactModal = () => {
    setShowPersonalFunfactModal(true);
  };

  const handleSavePersonalFunfacts = (funFacts: Record<string, string>) => {
    if (!event || Object.keys(funFacts).length === 0) {
      return;
    }

    const validFunFacts = Object.entries(funFacts).filter(([guestId, funFact]) => {
      const guest = event.guests.find(g => g.id === guestId);
      return guest && funFact && funFact.trim() !== "";
    });
    
    if (validFunFacts.length > 0) {
      const totalDuration = validFunFacts.length * 2;
      
      const segment: EventSegment = {
        id: Date.now().toString(),
        type: "game" as SegmentType,
        title: "Personal Fun Facts",
        description: `Guess who each fun fact belongs to!`,
        duration: totalDuration,
        content: `Each fun fact will be shown individually. Give guests time to discuss and guess before revealing each answer.`,
        order: event.timeline.length + 1,
        isCustom: true,
        personalFunFacts: funFacts
      };
      
      const updatedEvent: Event = {
        ...event,
        timeline: [...event.timeline, segment]
      };
      
      handleEventUpdate(updatedEvent);
    }
  };

  const handleDeleteSegment = (segmentId: string) => {
    if (!event) return;
    const updatedEvent: Event = {
      ...event,
      timeline: event.timeline.filter(segment => segment.id !== segmentId)
    };
    
    handleEventUpdate(updatedEvent);
  };

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
        
        handleEventUpdate(updatedEvent);
      }
    }
  };

  const handleClickOutside = () => {
    setOpenMenuId(null);
  };

  const tabs: TabType[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'guests', label: 'Guests', icon: '👥' },
    { id: 'timeline', label: 'Event Program', icon: '⏰' },
    { id: 'presentation', label: 'Start Presentation', icon: '🎬' }
  ];

  const handleCreateNewEvent = () => {
    // Logic to create a new event (e.g., clear out the form, generate a new ID)
    if (!user) return;
    const newEvent: Event = {
      id: `evt-${Date.now()}`,
      userId: user.uid,
      name: "New Awesome Event",
      type: "house",
      date: new Date(),
      startTime: "18:00",
      duration: 180,
      venue: "My Place",
      tone: "casual",
      guests: [],
      timeline: [
        {
          id: "kickoff",
          type: "welcome",
          title: "Kick-off",
          description: "Event starts",
          duration: 0,
          content: "Let the fun begin!",
          order: 0,
          isCustom: false,
        },
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setUserEvents(prev => [...prev, newEvent]);
    setEvent(newEvent);
    setActiveTab('overview');
  };

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-end items-center mb-8">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-white/70 backdrop-blur-xl text-dark-royalty rounded-xl border border-dark-royalty/20 hover:border-dark-royalty/40 hover:bg-white/90 transition-all duration-300 hover:scale-105 font-medium"
            >
              ← Back to Home
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <SectionTabs
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab as (id: TabType['id']) => void}
              lastTab={lastTab}
              setLastTab={setLastTab as (id: TabType['id']) => void}
              event={event}
              router={router}
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
                onEventUpdate={handleEventUpdate}
                setShowAddGuestModal={setShowAddGuestModal}
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
                  setShowAddSegmentModal={setShowAddSegmentModal}
                  editingKickoff={editingKickoff}
                  setEditingKickoff={setEditingKickoff}
                  editKickoffTime={editKickoffTime}
                  setEditKickoffTime={setEditKickoffTime}
                  handleEditKickoff={handleEditKickoff}
                  handleSaveKickoff={handleSaveKickoff}
                  handleCancelKickoff={handleCancelKickoff}
                  formatTime={formatTime}
                  formatDate={formatDate}
                  getEventTypeIcon={getEventTypeIcon}
                  getEventTypeLabel={getEventTypeLabel}
                  getToneLabel={getToneLabel}
                  handleClickOutside={handleClickOutside}
                  sensors={sensors}
                  handleDragEnd={handleDragEnd}
                  editingSegment={editingSegment}
                  editSegment={editSegment}
                  setEditSegment={setEditSegment}
                  handleEditSegment={handleEditSegment}
                  handleSaveSegmentEdit={handleSaveSegmentEdit}
                  handleCancelSegmentEdit={handleCancelSegmentEdit}
                  handleDeleteSegment={handleDeleteSegment}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  handleOpenPersonalFunfactModal={handleOpenPersonalFunfactModal}
                />
              </DndContext>
            )}
            {activeTab === 'presentation' && null}
          </div>
        </div>

        {/* Add Guest Modal */}
        {event && (
          <AddGuestModal
            isOpen={showAddGuestModal}
            onClose={() => setShowAddGuestModal(false)}
            event={event}
            onEventUpdate={handleEventUpdate}
          />
        )}
        
        {/* Add Segment Modal */}
        <AddSegmentModal
          isOpen={showAddSegmentModal}
          onClose={() => setShowAddSegmentModal(false)}
          newSegment={newSegment}
          setNewSegment={setNewSegment}
          onAddSegment={handleAddSegment}
        />

        {/* Personal Fun Facts Modal */}
        <PersonalFunfact
          isModal={true}
          isOpen={showPersonalFunfactModal}
          onClose={() => setShowPersonalFunfactModal(false)}
          guests={event?.guests || []}
          funFacts={newSegment.personalFunFacts}
          onFunFactsChange={handleSavePersonalFunfacts}
        />
      </div>
    </DndContext>
  );
} 