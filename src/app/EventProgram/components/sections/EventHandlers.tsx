"use client";

import { useState } from "react";
import { Event, EventSegment, SegmentType } from "../../../../types/event";
import { eventService } from "../../../../services/eventService";
import { cleanUndefinedValues } from "./EventUtils";

interface EventHandlersProps {
  user: { uid: string; email: string | null } | null;
  event: Event | null;
  setEvent: (event: Event | null) => void;
  onNavigate?: (url: string) => void;
}

export function useEventHandlers({
  user,
  event,
  setEvent,
  onNavigate,
}: EventHandlersProps) {
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [editingKickoff, setEditingKickoff] = useState(false);
  const [editKickoffTime, setEditKickoffTime] = useState("");
  const [showAddSegmentModal, setShowAddSegmentModal] = useState(false);
  const [showPersonalFunfactModal, setShowPersonalFunfactModal] =
    useState(false);

  // Specialized modal states for editing
  const [showPersonalFunfactEditModal, setShowPersonalFunfactEditModal] =
    useState(false);
  const [showSpinTheWheelEditModal, setShowSpinTheWheelEditModal] =
    useState(false);
  const [showSlideShowEditModal, setShowSlideShowEditModal] = useState(false);
  const [showJeopardyEditModal, setShowJeopardyEditModal] = useState(false);

  const [showPollEditModal, setShowPollEditModal] = useState(false);

  const [newSegment, setNewSegment] = useState({
    title: "",
    description: "",
    duration: "",
    type: "activity" as SegmentType,
    personalFunFacts: {} as Record<string, string>,
  });
  const [editingSegment, setEditingSegment] = useState<string | null>(null);
  const [segmentToEdit, setSegmentToEdit] = useState<EventSegment | null>(null);
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
    personalFunFacts: {},
  });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleEventUpdate = async (updatedEvent: Event) => {
    if (!user) return;

    try {
      await eventService.updateEvent(
        updatedEvent.id,
        cleanUndefinedValues(updatedEvent),
      );
      setEvent(updatedEvent);
      console.log("Event updated successfully (Firestore mode)");
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const handleEditKickoff = () => {
    if (!event) return;
    setEditingKickoff(true);
    setEditKickoffTime(event.startTime);
  };

  const handleSaveKickoff = () => {
    if (editKickoffTime && event) {
      const updatedEvent: Event = {
        ...event,
        startTime: editKickoffTime,
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
    if (
      !event ||
      !newSegment.title ||
      !newSegment.duration ||
      isNaN(Number(newSegment.duration)) ||
      Number(newSegment.duration) <= 0
    ) {
      return;
    }

    const isPersonalFunFactsSegment =
      newSegment.title.toLowerCase().includes("personal fun fact") ||
      newSegment.title.toLowerCase().includes("fun fact");

    const segmentsToAdd: EventSegment[] = [];

    if (
      isPersonalFunFactsSegment &&
      Object.keys(newSegment.personalFunFacts).length > 0
    ) {
      const validFunFacts = Object.entries(newSegment.personalFunFacts).filter(
        ([guestId, funFact]) => {
          const guest = event.guests.find((g) => g.id === guestId);
          return guest && funFact && funFact.trim() !== "";
        },
      );

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
          personalFunFacts: newSegment.personalFunFacts,
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
        ...(Object.keys(newSegment.personalFunFacts).length > 0 && {
          personalFunFacts: newSegment.personalFunFacts,
        }),
      };
      segmentsToAdd.push(segment);
    }

    const updatedEvent: Event = {
      ...event,
      timeline: [...event.timeline, ...segmentsToAdd],
    };

    handleEventUpdate(updatedEvent);

    setNewSegment({
      title: "",
      description: "",
      duration: "",
      type: "activity",
      personalFunFacts: {},
    });

    setShowAddSegmentModal(false);
    setSegmentToEdit(null);
  };

  const handleSaveSegmentEdit = (segmentId: string) => {
    if (
      !event ||
      !newSegment.title ||
      !newSegment.duration ||
      isNaN(Number(newSegment.duration)) ||
      Number(newSegment.duration) <= 0
    ) {
      return;
    }

    const updatedEvent: Event = {
      ...event,
      timeline: event.timeline.map((segment) =>
        segment.id === segmentId
          ? {
              ...segment,
              title: newSegment.title,
              description: newSegment.description || "",
              duration: Number(newSegment.duration),
              type: newSegment.type,
              ...(Object.keys(newSegment.personalFunFacts).length > 0 && {
                personalFunFacts: newSegment.personalFunFacts,
              }),
            }
          : segment,
      ),
    };

    handleEventUpdate(updatedEvent);

    setNewSegment({
      title: "",
      description: "",
      duration: "",
      type: "activity",
      personalFunFacts: {},
    });

    setShowAddSegmentModal(false);
    setSegmentToEdit(null);
  };

  const handleEditSegment = (segmentId: string) => {
    if (!event) {
      return;
    }
    const segment = event.timeline.find((s) => s.id === segmentId);
    if (segment) {
      setSegmentToEdit(segment);

      // Determine which modal to open based on segment type/title
      if (segment.title === "Personal Fun Facts") {
        // Open PersonalFunfact modal with existing data
        setNewSegment({
          title: segment.title,
          description: segment.description,
          duration: segment.duration.toString(),
          type: segment.type,
          personalFunFacts: segment.personalFunFacts || {},
        });
        setShowPersonalFunfactEditModal(true);
      } else if (segment.title === "Spin The Wheel") {
        // Open SpinTheWheel modal with existing data
        setNewSegment({
          title: segment.title,
          description: segment.description,
          duration: segment.duration.toString(),
          type: segment.type,
          personalFunFacts: segment.personalFunFacts || {},
        });
        setShowSpinTheWheelEditModal(true);
      } else if (segment.title === "Slide Show") {
        // Open SlideShow modal with existing data
        setNewSegment({
          title: segment.title,
          description: segment.description,
          duration: segment.duration.toString(),
          type: segment.type,
          personalFunFacts: segment.personalFunFacts || {},
        });
        setShowSlideShowEditModal(true);
      } else if (segment.title === "Jeopardy") {
        // Open Jeopardy modal with existing data
        setNewSegment({
          title: segment.title,
          description: segment.description,
          duration: segment.duration.toString(),
          type: segment.type,
          personalFunFacts: segment.personalFunFacts || {},
        });
        setShowJeopardyEditModal(true);
      } else if (segment.type === "quiz") {
        // Navigate to quiz editor page (match by type, not title, so renaming still works)
        const quizUrl = `/Quiz?eventId=${event.id}&segmentId=${segment.id}`;
        if (onNavigate) {
          onNavigate(quizUrl);
        } else {
          // Fallback to window.location.href
          window.location.href = quizUrl;
        }
      } else if (segment.title === "Live Poll") {
        // Open Poll modal with existing data
        setNewSegment({
          title: segment.title,
          description: segment.description,
          duration: segment.duration.toString(),
          type: segment.type,
          personalFunFacts: segment.personalFunFacts || {},
        });
        setShowPollEditModal(true);
      } else {
        // For other segments, use the generic AddSegmentModal
        setNewSegment({
          title: segment.title,
          description: segment.description,
          duration: segment.duration.toString(),
          type: segment.type,
          personalFunFacts: segment.personalFunFacts || {},
        });
        setShowAddSegmentModal(true);
      }
    }
  };

  const handleCancelSegmentEdit = () => {
    setEditingSegment(null);
    setEditSegment({
      title: "",
      description: "",
      duration: "",
      type: "activity",
      personalFunFacts: {},
    });
  };

  const handleOpenPersonalFunfactModal = () => {
    setShowPersonalFunfactModal(true);
  };

  const handleSavePersonalFunfacts = (funFacts: Record<string, string>) => {
    setNewSegment((prev) => ({
      ...prev,
      personalFunFacts: funFacts,
    }));
    setShowPersonalFunfactModal(false);
  };

  // Save handlers for specialized modals when editing
  const handleSavePersonalFunfactsEdit = (funFacts: Record<string, string>) => {
    if (!event || !segmentToEdit) return;

    const updatedEvent: Event = {
      ...event,
      timeline: event.timeline.map((segment) =>
        segment.id === segmentToEdit.id
          ? {
              ...segment,
              personalFunFacts: funFacts,
              duration: Object.keys(funFacts).length * 2, // Update duration based on number of facts
            }
          : segment,
      ),
    };

    handleEventUpdate(updatedEvent);
    setShowPersonalFunfactEditModal(false);
    setSegmentToEdit(null);
  };

  const handleSaveSpinTheWheelEdit = (challenge: string) => {
    if (!event || !segmentToEdit) return;

    const updatedEvent: Event = {
      ...event,
      timeline: event.timeline.map((segment) =>
        segment.id === segmentToEdit.id
          ? {
              ...segment,
              description: challenge,
              content: `Challenge: ${challenge}`,
            }
          : segment,
      ),
    };

    handleEventUpdate(updatedEvent);
    setShowSpinTheWheelEditModal(false);
    setSegmentToEdit(null);
  };

  const handleSaveSlideShowEdit = (updatedSegment: EventSegment) => {
    if (!event || !segmentToEdit) return;

    const updatedEvent: Event = {
      ...event,
      timeline: event.timeline.map((segment) =>
        segment.id === segmentToEdit.id
          ? {
              ...segment,
              ...updatedSegment,
              id: segmentToEdit.id, // Keep the original ID
            }
          : segment,
      ),
    };

    handleEventUpdate(updatedEvent);
    setShowSlideShowEditModal(false);
    setSegmentToEdit(null);
  };

  const handleSaveJeopardyEdit = (updatedSegment: EventSegment) => {
    if (!event || !segmentToEdit) return;

    const updatedEvent: Event = {
      ...event,
      timeline: event.timeline.map((segment) =>
        segment.id === segmentToEdit.id
          ? {
              ...segment,
              ...updatedSegment,
              id: segmentToEdit.id, // Keep the original ID
            }
          : segment,
      ),
    };

    handleEventUpdate(updatedEvent);
    setShowJeopardyEditModal(false);
    setSegmentToEdit(null);
  };

  const handleSavePollEdit = (updatedSegment: EventSegment) => {
    if (!event || !segmentToEdit) return;

    const updatedEvent: Event = {
      ...event,
      timeline: event.timeline.map((segment) =>
        segment.id === segmentToEdit.id
          ? {
              ...segment,
              ...updatedSegment,
              id: segmentToEdit.id, // Keep the original ID
            }
          : segment,
      ),
    };

    handleEventUpdate(updatedEvent);
    setShowPollEditModal(false);
    setSegmentToEdit(null);
  };

  const handleAddSegmentFromAI = (segment: EventSegment) => {
    if (!event) return;
    const updatedEvent: Event = {
      ...event,
      timeline: [...event.timeline, segment],
    };
    handleEventUpdate(updatedEvent);
  };

  const handleDeleteSegment = (segmentId: string) => {
    if (!event) return;
    const updatedEvent: Event = {
      ...event,
      timeline: event.timeline.filter((segment) => segment.id !== segmentId),
    };
    handleEventUpdate(updatedEvent);
  };

  const handleClickOutside = () => {
    setOpenMenuId(null);
  };

  return {
    // State
    showAddGuestModal,
    setShowAddGuestModal,
    editingKickoff,
    setEditingKickoff,
    editKickoffTime,
    setEditKickoffTime,
    showAddSegmentModal,
    setShowAddSegmentModal,
    showPersonalFunfactModal,
    setShowPersonalFunfactModal,
    showPersonalFunfactEditModal,
    setShowPersonalFunfactEditModal,
    showSpinTheWheelEditModal,
    setShowSpinTheWheelEditModal,
    showSlideShowEditModal,
    setShowSlideShowEditModal,
    showJeopardyEditModal,
    setShowJeopardyEditModal,

    showPollEditModal,
    setShowPollEditModal,
    newSegment,
    setNewSegment,
    editingSegment,
    setEditingSegment,
    segmentToEdit,
    setSegmentToEdit,
    editSegment,
    setEditSegment,
    openMenuId,
    setOpenMenuId,

    // Handlers
    handleEventUpdate,
    handleEditKickoff,
    handleSaveKickoff,
    handleCancelKickoff,
    handleAddSegment,
    handleSaveSegmentEdit,
    handleEditSegment,
    handleCancelSegmentEdit,
    handleOpenPersonalFunfactModal,
    handleSavePersonalFunfacts,
    handleSavePersonalFunfactsEdit,
    handleSaveSpinTheWheelEdit,
    handleSaveSlideShowEdit,
    handleSaveJeopardyEdit,

    handleSavePollEdit,
    handleAddSegmentFromAI,
    handleDeleteSegment,
    handleClickOutside,
  };
}
