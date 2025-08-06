"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import EventCreationForm from "../newEvent/components/EventCreationForm";
import { Event } from "../../types/event";
import { eventService } from "../../services/eventService";
import { getAuth, signOut } from "firebase/auth";
import { FaTrash } from "react-icons/fa";
import { FaEllipsisH } from "react-icons/fa";
import Image from "next/image";

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isCreateMode = searchParams.get("create") === "true";

  useEffect(() => {
    if (!user) {
      setUserEvents([]);
      setEventsLoading(false);
      return;
    }
    // Subscribe to Firestore events for this user
    setEventsLoading(true);
    const unsubscribe = eventService.subscribeToUserEvents(
      user.uid,
      (events) => {
        setUserEvents(events);
        setEventsLoading(false);
      },
    );
    return unsubscribe;
  }, [user]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Handle click outside delete confirmation menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside any delete confirmation menu
      const deleteMenus = document.querySelectorAll("[data-delete-menu]");
      let clickedInside = false;

      deleteMenus.forEach((menu) => {
        if (menu.contains(target)) {
          clickedInside = true;
        }
      });

      if (!clickedInside) {
        setShowConfirm(null);
      }
    };

    if (showConfirm) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showConfirm]);

  const handleEventCreated = async (
    eventData: Omit<Event, "id" | "createdAt" | "updatedAt">,
  ) => {
    if (!user) return;
    try {
      await eventService.createEvent(eventData, user.uid);
      router.push("/newEvent");
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
          <h1 className="text-5xl font-bold text-dark-royalty mb-4">
            AI Toastmaster
          </h1>
        </header>
        <main className="text-center max-w-3xl px-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-dark-royalty/20">
            <p className="text-lg text-deep-sea/90 mb-6 leading-relaxed">
              <span className="block text-2xl font-bold mb-2 text-dark-royalty">
                Welcome to AI Toastmaster
              </span>
              <span className="block text-lg mb-4 text-deep-sea/90">
                Your smart sidekick for event creation.
                <br />
                Plan, host, and entertain with AI-generated content, interactive
                games, and real-time event management.
              </span>
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
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-dark-royalty font-poppins">
                Create New Event
              </h1>
              <p className="text-deep-sea/70 text-lg">
                Set up your event details
              </p>
            </div>
            <button
              onClick={() => router.push("/ProfilePage")}
              className="px-6 py-3 bg-white/70 backdrop-blur-xl text-dark-royalty rounded-xl border border-dark-royalty/20 hover:border-dark-royalty/40 hover:bg-white/90 transition-all duration-300 hover:scale-105 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
          <EventCreationForm onEventCreated={handleEventCreated} />
        </div>
      </div>
    );
  }

  if (eventsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎬</div>
          <h2 className="text-2xl font-bold text-dark-royalty mb-2">
            Loading Dashboard...
          </h2>
          <p className="text-deep-sea/70">Getting your events ready</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5">
      {/* Top Navigation Bar */}
      <nav className="relative z-10 w-full backdrop-blur-xl border-b border-gray-200/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center relative">
          <Image
            src="/ToastmasterImage.png"
            alt="AI Toastmaster"
            width={60}
            height={60}
            className="mr-3 hover:scale-110 transition-transform duration-200"
          />
          <span
            className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform duration-200 hover:from-indigo-700 hover:to-purple-700"
            onClick={() => router.push("/ProfilePage")}
          >
            AI Toastmaster
          </span>
        </div>
        <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
            title="Profile"
          >
            {user.email?.charAt(0).toUpperCase() || "U"}
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 z-50">
              <button
                onClick={async () => {
                  setShowDropdown(false);
                  const auth = getAuth();
                  await signOut(auth);
                  router.push("/");
                }}
                className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-12">
          <h2 className="text-5xl font-bold text-dark-royalty mb-4">
            Welcome back,{" "}
            {user.displayName || user.email?.split("@")[0] || "User"}
          </h2>
        </div>

        {/* Events List */}
        <div className="space-y-8">
          <h3 className="text-3xl font-bold text-dark-royalty mb-6">
            Your Events
          </h3>
          {userEvents.length > 0 ? (
            <>
              <div className="space-y-4 max-w-2xl">
                {userEvents.map((event) => {
                  return (
                    <div
                      key={event.id}
                      className="bg-white/90 backdrop-blur-xl rounded-xl border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-dark-royalty/30 relative group cursor-pointer"
                      style={{ padding: "1.5rem 2rem" }}
                      onClick={() =>
                        router.push(`/EventProgram?eventId=${event.id}`)
                      }
                    >
                      {/* Delete Icon Button */}
                      <button
                        onClick={(e) => {
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
                              if (
                                window.confirm(
                                  `Are you sure you want to delete "${event.name}"?`,
                                )
                              ) {
                                try {
                                  await eventService.deleteEvent(event.id);
                                  setShowConfirm(null);
                                } catch {
                                  alert("Failed to delete event.");
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
                      <div className="flex items-center space-x-4">
                        <span className="text-3xl">🎊</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-2xl font-bold text-dark-royalty truncate mb-2">
                            {event.name}
                          </h4>
                          <div className="flex items-center space-x-4 text-lg text-deep-sea/70">
                            <span>
                              {event.date.toLocaleDateString()} at{" "}
                              {event.startTime}
                            </span>
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
              <div className="mt-12">
                <button
                  onClick={() => router.push("/newEvent?create=true")}
                  className="px-12 py-6 bg-gradient-to-r from-dark-royalty to-deep-sea text-white rounded-2xl text-2xl font-bold hover:from-dark-royalty/90 hover:to-deep-sea/90 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center space-x-4"
                >
                  <span className="text-3xl">+</span>
                  <span>Create New Event</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">🎉</div>
              <h3 className="text-3xl font-bold text-dark-royalty mb-4">
                No events yet
              </h3>
              <p className="text-xl text-deep-sea/70 mb-8">
                Create your first event to get started!
              </p>
              <button
                onClick={() => router.push("/newEvent?create=true")}
                className="px-10 py-5 bg-dark-royalty text-white rounded-xl text-xl font-bold hover:bg-dark-royalty/90 transition-all duration-300 shadow-lg hover:scale-105"
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🎬</div>
            <h2 className="text-2xl font-bold text-dark-royalty mb-2">
              Loading...
            </h2>
            <p className="text-deep-sea/70">Getting your profile ready</p>
          </div>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
