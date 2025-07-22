import React, { useState } from 'react';
import { Event, EventSegment, SegmentType } from '../../../types/event';
import PersonalFunfact from '../sections/PersonalFunfact';
import AISegments from '../sections/AISegments';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  SensorDescriptor,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Draggable Segment Component
function DraggableSegment({ 
  segment, 
  index, 
  editingSegment, 
  editSegment, 
  setEditSegment, 
  handleEditSegment, 
  handleSaveSegmentEdit, 
  handleCancelSegmentEdit, 
  handleDeleteSegment, 
  event,
  openMenuId,
  setOpenMenuId
}: {
  segment: EventSegment;
  index: number;
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
  event: Event;
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
      {editingSegment === segment.id ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-deep-sea mb-2">
              Segment Title *
            </label>
            <input
              type="text"
              value={editSegment.title}
              onChange={(e) => setEditSegment({ ...editSegment, title: e.target.value })}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSaveSegmentEdit(segment.id);
                } else if (e.key === 'Escape') {
                  handleCancelSegmentEdit();
                }
              }}
              className="w-full px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
              placeholder="e.g., Welcome Speech, Ice Breaker Game"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-sea mb-2">
              Description
            </label>
            <textarea
              value={editSegment.description}
              onChange={(e) => setEditSegment({ ...editSegment, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300 resize-none"
              placeholder="Describe what will happen during this segment... (optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-deep-sea mb-2">
                Duration (minutes)
              </label>
              <input
                type="text"
                value={editSegment.duration}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string or valid numbers
                  if (value === "" || (!isNaN(Number(value)) && Number(value) > 0)) {
                    setEditSegment({ ...editSegment, duration: value });
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveSegmentEdit(segment.id);
                  } else if (e.key === 'Escape') {
                    handleCancelSegmentEdit();
                  }
                }}
                className="w-full px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
                placeholder="30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-deep-sea mb-2">
                Segment Type
              </label>
              <select
                value={editSegment.type}
                onChange={(e) => setEditSegment({ ...editSegment, type: e.target.value as SegmentType })}
                className="w-full px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
              >
                <option value="welcome">Welcome</option>
                <option value="introduction">Introduction</option>
                <option value="activity">Activity</option>
                <option value="toast">Toast</option>
                <option value="game">Game</option>
                <option value="break">Break</option>
                <option value="closing">Closing</option>
              </select>
            </div>
          </div>

          {/* Personal Fun Facts Section */}
          {event.guests.length > 0 && (
            <div>
              <PersonalFunfact
                guests={event.guests}
                funFacts={editSegment.personalFunFacts}
                onFunFactsChange={(funFacts) => setEditSegment({ ...editSegment, personalFunFacts: funFacts })}
                isEditable={true}
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-dark-royalty/10">
            <div className="text-sm text-deep-sea/60">
              💡 Press Enter to save, Escape to cancel
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelSegmentEdit}
                className="px-6 py-3 bg-white/50 text-dark-royalty rounded-xl hover:bg-white/70 transition-all duration-300 font-medium border border-dark-royalty/20 hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveSegmentEdit(segment.id)}
                disabled={!editSegment.title || !editSegment.duration || isNaN(Number(editSegment.duration)) || Number(editSegment.duration) <= 0}
                className="px-6 py-3 bg-gradient-to-r from-dark-royalty to-deep-sea text-white rounded-xl hover:from-dark-royalty/90 hover:to-deep-sea/90 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex items-center space-x-2"
              >
                <span>💾</span>
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
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
      )}
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
  getEventTypeIcon: (type: string) => string;
  getEventTypeLabel: (type: string) => string;
  getToneLabel: (tone: string) => string;
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
  getEventTypeIcon,
  getEventTypeLabel,
  getToneLabel,
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
  onAddSegment
}) => {
  const [showAISegmentsModal, setShowAISegmentsModal] = useState(false);
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-dark-royalty">Event Program</h2>
          <p className="text-deep-sea/70 mt-2">Your event canvas - view and edit details</p>
        </div>
        <button 
          onClick={() => setShowAddSegmentModal(true)}
          className="px-6 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 hover:scale-105 font-medium"
        >
          + Add Segment
        </button>
      </div>
      
      <div 
        className="relative min-h-[600px] bg-gradient-to-br from-deep-sea/10 via-white to-kimchi/10 rounded-3xl p-8 border-2 border-dashed border-dark-royalty/20 overflow-hidden"
        onClick={handleClickOutside}
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
          {editingKickoff ? (
            <div className="space-y-2">
              <input
                type="time"
                value={editKickoffTime}
                onChange={(e) => setEditKickoffTime(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveKickoff();
                  } else if (e.key === 'Escape') {
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
            items={event.timeline.map(segment => segment.id)}
            strategy={verticalListSortingStrategy}
          >
            {event.timeline.map((segment, index) => (
              <DraggableSegment
                key={segment.id}
                segment={segment}
                index={index}
                editingSegment={editingSegment}
                editSegment={editSegment}
                setEditSegment={setEditSegment}
                handleEditSegment={handleEditSegment}
                handleSaveSegmentEdit={handleSaveSegmentEdit}
                handleCancelSegmentEdit={handleCancelSegmentEdit}
                handleDeleteSegment={handleDeleteSegment}
                event={event}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
              />
            ))}
          </SortableContext>
        </DndContext>

        <div className="mb-8 space-y-4">
          <div className="flex space-x-4">
            <button 
              onClick={() => setShowAddSegmentModal(true)}
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

      {/* AISegments Modal */}
      <AISegments
        event={event}
        isOpen={showAISegmentsModal}
        onClose={() => setShowAISegmentsModal(false)}
        onAddSegment={onAddSegment}
      />
    </div>
  );
};

export default EventProgram; 