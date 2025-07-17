"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import { useAuth } from "../hooks/useAuth";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";
import EventCreationForm from "../components/EventCreationForm";
import { Event } from "../types/event";
import { eventService } from "../services/eventService";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [userEvents, setUserEvents] = useState<Event[]>([]);

  // Subscribe to user events when authenticated
  useEffect(() => {
    if (!user) {
      setUserEvents([]);
      return;
    }

    // TEMPORARILY DISABLED FIRESTORE - Using mock data
    // const unsubscribe = eventService.subscribeToUserEvents(user.uid, (events) => {
    //   setUserEvents(events);
    // });

    // Mock events for testing
    const mockEvents: Event[] = [
      {
        id: "mock-1",
        userId: user.uid,
        name: "House Party",
        type: "house",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        startTime: "19:00",
        duration: 120,
        venue: "My Place",
        tone: "casual",
        guests: [],
        timeline: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    setUserEvents(mockEvents);

    // return unsubscribe;
    return () => {};
  }, [user]);

  const handleLoginSuccess = (loggedInUser: User) => {
    // Auth state is managed by useAuth hook
    console.log("User logged in:", loggedInUser.email);
  };

  const handleSignupSuccess = (signedUpUser: User) => {
    console.log("User signed up:", signedUpUser.email);
    setSignupSuccess(true);
    setShowSignup(false);
  };

  const handleEventCreated = async (event: Omit<Event, "id" | "createdAt" | "updatedAt">) => {
    if (!user) return;

    try {
      // TEMPORARILY DISABLED FIRESTORE - Just redirect
      // const eventId = await eventService.createEvent(event, user.uid);
      // console.log("Event created with ID:", eventId);
      
      console.log("Event created (mock mode):", event);
      
      // Redirect to the new event page
      router.push('/newEvent');
    } catch (error) {
      console.error("Error creating event:", error);
      // TODO: Show error message to user
    }
  };

  const handleEventUpdate = async (updatedEvent: Event) => {
    if (!user) return;

    try {
      // TEMPORARILY DISABLED FIRESTORE - Just log
      // await eventService.updateEvent(updatedEvent.id, updatedEvent);
      console.log("Event updated successfully (mock mode)");
      
      // The event will be automatically updated via the subscription
    } catch (error) {
      console.error("Error updating event:", error);
      // TODO: Show error message to user
    }
  };

  const handleEventDelete = async (eventId: string) => {
    if (!user) return;

    try {
      // TEMPORARILY DISABLED FIRESTORE - Just log
      // await eventService.deleteEvent(eventId);
      console.log("Event deleted successfully (mock mode)");
      
      // The event will be automatically removed via the subscription
    } catch (error) {
      console.error("Error deleting event:", error);
      // TODO: Show error message to user
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-deep-sea">Loading...</div>
      </div>
    );
  }

  // Show login/signup for unauthenticated users
  if (!user) {
    return (
      <div>
        {showSignup ? (
          <>
            <SignupForm onSignupSuccess={handleSignupSuccess} />
            <div className="text-center mt-4">
              <button
                type="button"
                className="text-dark-royalty underline hover:text-deep-sea transition-colors"
                onClick={() => setShowSignup(false)}
              >
                Already have an account? Log in
              </button>
            </div>
          </>
        ) : (
          <>
            <LoginForm onLoginSuccess={handleLoginSuccess} />
            <div className="text-center mt-4">
              <button
                type="button"
                className="text-dark-royalty underline hover:text-deep-sea transition-colors"
                onClick={() => {
                  setShowSignup(true);
                  setSignupSuccess(false);
                }}
              >
                Don&apos;t have an account? Sign up
              </button>
              {signupSuccess && (
                <div className="mt-2 text-green-600">Signup successful! Please log in.</div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Show event creation form or event list
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-royalty mb-2">Welcome, {user.email}</h1>
          <p className="text-deep-sea/70">Manage your events and create new ones</p>
        </div>

        {userEvents.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-dark-royalty">Your Events</h2>
            {userEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white/70 backdrop-blur-xl rounded-xl p-6 border border-dark-royalty/20 shadow-lg transition-all duration-300 cursor-pointer hover:shadow-xl"
                onClick={() => router.push('/newEvent')}
              >
                <h3 className="text-lg font-semibold text-dark-royalty mb-2">{event.name}</h3>
                <p className="text-deep-sea/70 text-sm">
                  {event.date.toLocaleDateString()} at {event.startTime}
                </p>
              </div>
            ))}
            <div className="mt-6">
              <button
                onClick={() => router.push('/newEvent')}
                className="px-6 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 font-medium"
              >
                Create New Event
              </button>
            </div>
          </div>
        ) : (
          <EventCreationForm onEventCreated={handleEventCreated} />
        )}
      </div>
    </div>
  );
}
