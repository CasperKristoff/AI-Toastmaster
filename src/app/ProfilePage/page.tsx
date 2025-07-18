"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import EventCreationForm from "../newEvent/components/EventCreationForm";
import { Event } from "../../types/event";
import { eventService } from "../../services/eventService";
import { getAuth, signOut } from "firebase/auth";
import { FaTrash } from 'react-icons/fa';
import { FaEllipsisH } from 'react-icons/fa';

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isCreateMode = searchParams.get('create') === 'true';

  useEffect(() => {
    if (!user) {
      setUserEvents([]);
      setEventsLoading(false);
      return;
    }
    // Subscribe to Firestore events for this user
    setEventsLoading(true);
    const unsubscribe = eventService.subscribeToUserEvents(user.uid, (events) => {
      setUserEvents(events);
      setEventsLoading(false);
    });
    return unsubscribe;
  }, [user]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Handle click outside delete confirmation menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside any delete confirmation menu
      const deleteMenus = document.querySelectorAll('[data-delete-menu]');
      let clickedInside = false;
      
      deleteMenus.forEach(menu => {
        if (menu.contains(target)) {
          clickedInside = true;
        }
      });
      
      if (!clickedInside) {
        setShowConfirm(null);
      }
    };

    if (showConfirm) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showConfirm]);

  const handleEventCreated = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    try {
      await eventService.createEvent(eventData, user.uid);
      router.push('/newEvent');
    } catch {
      alert("Failed to create event. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-deep-sea">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-deep-sea/10 via-white to-kimchi/10">
        <header className="mb-12">
          <h1 className="text-5xl font-bold text-dark-royalty mb-4">AI Toastmaster</h1>
        </header>
        <main className="text-center max-w-3xl px-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-dark-royalty/20">
            <p className="text-lg text-deep-sea/90 mb-6 leading-relaxed">
              AI Toastmaster is a digital event companion designed to help organizers plan and execute unforgettable events using the power of generative AI. The platform supports everything from initial planning (guest list, tone, and event type) to real-time guidance during the event itself. It generates customized toasts, programs, games, and speech content based on user inputs, ensuring a smooth, entertaining, and personalized experience for guests.
            </p>
            <p className="text-lg text-deep-sea/90 mb-8 leading-relaxed">
              Whether you&apos;re planning a wedding, birthday, corporate party, or surprise celebration, AI Toastmaster uses structured data, tone presets, and contextual guest profiles to build a unique flow for each event. During the event, the app transitions into a live mode—presenting content, leading activities, and acting as a virtual MC to guide the host and guests through each segment of the evening.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="px-8 py-4 bg-dark-royalty text-white rounded-xl text-xl font-semibold hover:bg-dark-royalty/90 transition-all duration-300 shadow-lg hover:scale-105"
            >
              Login
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (isCreateMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-dark-royalty font-poppins">Create New Event</h1>
              <p className="text-deep-sea/70 text-lg">Set up your event details</p>
            </div>
            <button
              onClick={() => router.push('/ProfilePage')}
              className="px-6 py-3 bg-white/70 backdrop-blur-xl text-dark-royalty rounded-xl border border-dark-royalty/20 hover:border-dark-royalty/40 hover:bg-white/90 transition-all duration-300 hover:scale-105 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-8 border border-dark-royalty/10">
            <EventCreationForm onEventCreated={handleEventCreated} />
          </div>
        </div>
      </div>
    );
  }

  if (eventsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎬</div>
          <h2 className="text-2xl font-bold text-dark-royalty mb-2">Loading Dashboard...</h2>
          <p className="text-deep-sea/70">Getting your events ready</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5">
      {/* Top Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-dark-royalty/10 px-6 py-4 relative">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-dark-royalty">AI Toastmaster</h1>
          </div>
          <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="w-10 h-10 bg-gradient-to-br from-dark-royalty to-deep-sea rounded-full flex items-center justify-center text-white font-semibold hover:scale-110 transition-all duration-300 shadow-lg"
              title="Profile"
            >
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-dark-royalty/10 z-50">
                <button
                  onClick={async () => {
                    setShowDropdown(false);
                    const auth = getAuth();
                    await signOut(auth);
                    router.push("/");
                  }}
                  className="w-full text-left px-4 py-3 text-dark-royalty hover:bg-deep-sea/10 rounded-xl transition-colors"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-dark-royalty mb-2">Welcome back, {user.email}</h2>
        </div>

        {/* Events List */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-dark-royalty">Your Events</h3>
          {userEvents.length > 0 ? (
            <>
              <div className="space-y-4 max-w-2xl">
                {userEvents.map((event) => {
                  return (
                  <div
                    key={event.id}
                    className="bg-white/90 backdrop-blur-xl rounded-xl border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-dark-royalty/30 relative group cursor-pointer"
                    style={{padding: '1rem 1.5rem'}}
                    onClick={() => router.push('/newEvent')}
                  >
                    {/* Delete Icon Button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setShowConfirm(event.id);
                      }}
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors z-20 p-1.5 rounded-full hover:bg-gray-100 opacity-60 group-hover:opacity-100"
                      title="More options"
                    >
                      <FaEllipsisH size={16} />
                    </button>
                    {/* Inline Confirm Delete */}
                    {showConfirm === event.id && (
                      <div 
                        className="absolute top-10 right-3 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-[120px]"
                        data-delete-menu
                      >
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete "${event.name}"?`)) {
                              try {
                                await eventService.deleteEvent(event.id);
                                setShowConfirm(null);
                              } catch {
                                alert('Failed to delete event.');
                              }
                            } else {
                              setShowConfirm(null);
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 text-sm font-medium flex items-center space-x-2"
                        >
                          <FaTrash size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                    {/* Card Content */}
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                          {event.type === 'house' ? '🍻' : 
                           event.type === 'bachelor' ? '🕺' : 
                           event.type === 'theme' ? '🎭' : 
                           event.type === 'roast' ? '🎂' : 
                           event.type === 'prom' ? '👑' : 
                           event.type === 'trivia' ? '🧠' : 
                           event.type === 'glowup' ? '🔥' : 
                           event.type === 'breakup' ? '💔' : '🎊'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-dark-royalty truncate">{event.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-deep-sea/70">
                          <span>{event.date.toLocaleDateString()} at {event.startTime}</span>
                          <span>•</span>
                          <span>{event.guests.length} guests</span>
                          <span>•</span>
                          <span>{event.timeline.length} segments</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
              {/* Create New Event Button below events */}
              <div className="mt-8">
                <button
                  onClick={() => router.push('/ProfilePage?create=true')}
                  className="px-8 py-4 bg-gradient-to-r from-dark-royalty to-deep-sea text-white rounded-xl text-lg font-semibold hover:from-dark-royalty/90 hover:to-deep-sea/90 transition-all duration-300 shadow-lg hover:scale-105 flex items-center space-x-3"
                >
                  <span className="text-2xl">+</span>
                  <span>Create New Event</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-dark-royalty mb-2">No events yet</h3>
              <p className="text-deep-sea/70 mb-6">Create your first event to get started!</p>
              <button
                onClick={() => router.push('/ProfilePage?create=true')}
                className="px-6 py-3 bg-dark-royalty text-white rounded-lg hover:bg-dark-royalty/90 transition-all duration-300 font-medium"
              >
                Create Your First Event
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎬</div>
          <h2 className="text-2xl font-bold text-dark-royalty mb-2">Loading...</h2>
          <p className="text-deep-sea/70">Getting your profile ready</p>
        </div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}