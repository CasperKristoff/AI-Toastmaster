import React, { useState } from "react";
import { Event, EventSegment, SegmentType } from "../../../../types/event";

import AISegments from "./AISegments";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  SensorDescriptor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Draggable Segment Component
function DraggableSegment({
  segment,
  index,
  _editingSegment,
  _editSegment,
  _setEditSegment,
  handleEditSegment,
  _handleSaveSegmentEdit,
  _handleCancelSegmentEdit,
  handleDeleteSegment,
  _event,
  openMenuId,
  setOpenMenuId,
  handleSpecializedEdit,
}: {
  segment: EventSegment;
  index: number;
  _editingSegment: string | null;
  _editSegment: {
    title: string;
    description: string;
    duration: string;
    type: SegmentType;
    personalFunFacts: Record<string, string>;
  };
  _setEditSegment: (segment: {
    title: string;
    description: string;
    duration: string;
    type: SegmentType;
    personalFunFacts: Record<string, string>;
  }) => void;
  handleEditSegment: (id: string) => void;
  _handleSaveSegmentEdit: (id: string) => void;
  _handleCancelSegmentEdit: () => void;
  handleDeleteSegment: (id: string) => void;
  _event: Event;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  handleSpecializedEdit?: (id: string) => void;
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
      {/* All segments now use specialized modal editing */}
      <div
        className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-300 hover:shadow-lg hover:bg-white/90 w-full cursor-pointer"
        onClick={(e) => {
          // Don't trigger if clicking on drag handle or action menu
          if (
            (e.target as HTMLElement).closest("[data-drag-handle]") ||
            (e.target as HTMLElement).closest("[data-action-menu]")
          ) {
            return;
          }

          // Trigger specialized editing for all segments
          if (handleSpecializedEdit) {
            handleSpecializedEdit(segment.id);
          } else {
            handleEditSegment(segment.id);
          }
        }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              data-drag-handle
              className="cursor-grab active:cursor-grabbing p-2 text-deep-sea/60 hover:text-dark-royalty transition-colors rounded-lg hover:bg-deep-sea/10 flex-shrink-0"
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
              <div className="text-2xl font-bold text-dark-royalty truncate">
                {segment.title}
              </div>
            </div>
          </div>

          {/* Action Menu */}
          <div
            className="relative opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0"
            data-action-menu
          >
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
                    // All segments now use specialized modal editing
                    if (handleSpecializedEdit) {
                      handleSpecializedEdit(segment.id);
                    } else {
                      // Fallback to inline editing if no specialized handler provided
                      handleEditSegment(segment.id);
                    }
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

interface EventProgramProps {
  event: Event;
  setShowAddSegmentModal: (show: boolean) => void;
  editingKickoff: boolean;
  setEditingKickoff: (editing: boolean) => void;
  editKickoffTime: string;
  setEditKickoffTime: (time: string) => void;
  handleEditKickoff: () => void;
  handleSaveKickoff: () => void;
  handleCancelKickoff: () => void;
  formatTime: (time: string) => string;
  formatDate: (date: Date) => string;
  handleClickOutside: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sensors: SensorDescriptor<any>[];
  handleDragEnd: (event: DragEndEvent) => void;
  editingSegment: string | null;
  editSegment: {
    title: string;
    description: string;
    duration: string;
    type: SegmentType;
    personalFunFacts: Record<string, string>;
  };
  setEditSegment: (segment: {
    title: string;
    description: string;
    duration: string;
    type: SegmentType;
    personalFunFacts: Record<string, string>;
  }) => void;
  handleEditSegment: (id: string) => void;
  handleSaveSegmentEdit: (id: string) => void;
  handleCancelSegmentEdit: () => void;
  handleDeleteSegment: (id: string) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  handleOpenPersonalFunfactModal: () => void;
  onAddSegment: (segment: EventSegment) => void;
  // Optional specialized editing handlers - if provided, use specialized editing
  handleSpecializedEdit?: (id: string) => void;
  // Optional navigation handler for AI segments
  onNavigate?: (url: string) => void;
}

const EventProgram: React.FC<EventProgramProps> = ({
  event,
  setShowAddSegmentModal,
  editingKickoff,
  editKickoffTime,
  setEditKickoffTime,
  handleEditKickoff,
  handleSaveKickoff,
  handleCancelKickoff,
  formatTime,
  formatDate,
  handleClickOutside,
  sensors,
  handleDragEnd,
  editingSegment,
  editSegment,
  setEditSegment,
  handleEditSegment,
  handleSaveSegmentEdit,
  handleCancelSegmentEdit,
  handleDeleteSegment,
  openMenuId,
  setOpenMenuId,
  onAddSegment,
  handleSpecializedEdit,
  onNavigate,
}) => {
  const [showAISegmentsModal, setShowAISegmentsModal] = useState(false);
  return (
    <div className="space-y-8 w-full max-w-none">
      <div className="flex justify-between items-center w-full">
        <div className="flex-1 min-w-0">
          <h2 className="text-3xl font-bold text-dark-royalty">
            Event Program
          </h2>
          <p className="text-deep-sea/70 mt-2">
            Your event canvas - view and edit details
          </p>
        </div>
        <button
          onClick={() => setShowAddSegmentModal(true)}
          className="px-6 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 hover:scale-105 font-medium flex-shrink-0"
        >
          + Add Segment
        </button>
      </div>

      <div
        className="relative min-h-[600px] w-full bg-gradient-to-br from-deep-sea/10 via-white to-kimchi/10 rounded-3xl p-8 border-2 border-dashed border-dark-royalty/20 overflow-hidden"
        onClick={handleClickOutside}
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
          {editingKickoff ? (
            <div className="space-y-2">
              <input
                type="time"
                value={editKickoffTime}
                onChange={(e) => setEditKickoffTime(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSaveKickoff();
                  } else if (e.key === "Escape") {
                    handleCancelKickoff();
                  }
                }}
                className="px-3 py-2 border border-dark-royalty/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300 text-lg font-bold text-dark-royalty"
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveKickoff}
                  className="px-3 py-1 bg-dark-royalty text-white rounded-lg hover:bg-dark-royalty/90 transition-all duration-300 text-sm font-medium"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelKickoff}
                  className="px-3 py-1 bg-white/50 text-dark-royalty rounded-lg hover:bg-white/70 transition-all duration-300 text-sm font-medium border border-dark-royalty/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="text-2xl font-bold text-dark-royalty cursor-pointer hover:text-deep-sea transition-colors"
              onClick={handleEditKickoff}
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
                _editingSegment={editingSegment}
                _editSegment={editSegment}
                _setEditSegment={setEditSegment}
                handleEditSegment={handleEditSegment}
                _handleSaveSegmentEdit={handleSaveSegmentEdit}
                _handleCancelSegmentEdit={handleCancelSegmentEdit}
                handleDeleteSegment={handleDeleteSegment}
                _event={event}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                handleSpecializedEdit={handleSpecializedEdit}
              />
            ))}
          </SortableContext>
        </DndContext>

        <div className="mb-8 space-y-4 w-full">
          <div className="flex flex-wrap gap-4 w-full">
            <button
              onClick={() => setShowAddSegmentModal(true)}
              className="px-6 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 font-medium flex-shrink-0"
            >
              + Add Segment
            </button>
            <button
              onClick={() => setShowAISegmentsModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-kimchi/80 to-deep-sea/80 text-white rounded-xl hover:from-kimchi/90 hover:to-deep-sea/90 transition-all duration-300 font-medium flex items-center space-x-2 flex-shrink-0"
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

      {/* AISegments Modal */}
      <AISegments
        event={event}
        isOpen={showAISegmentsModal}
        onClose={() => setShowAISegmentsModal(false)}
        onAddSegment={onAddSegment}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default EventProgram;
