import React, { useState, useRef, useEffect } from 'react';
import { Event, EventSegment } from '../../../../types/event';
import AISegments from './AISegments';
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

  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: openMenuId === segment.id ? 10 : 1,
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId === segment.id && menuButtonRef.current && !menuButtonRef.current.contains(event.target as Node)) {
        // Check if the click is on the dropdown menu itself
        const dropdownMenu = document.querySelector('[data-dropdown-menu]');
        if (dropdownMenu && dropdownMenu.contains(event.target as Node)) {
          return; // Don't close if clicking on the dropdown menu
        }
        setOpenMenuId(null);
      }
    };

    if (openMenuId === segment.id) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openMenuId, segment.id, setOpenMenuId]);

  return (
    <div ref={setNodeRef} style={style} className="mb-6 relative">
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
                {segment.title}
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
              ref={menuButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === segment.id ? null : segment.id);
              }}
              className="p-2 text-deep-sea/60 hover:text-dark-royalty transition-colors rounded-lg hover:bg-deep-sea/10"
              title="More options"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {openMenuId === segment.id && (
              <div 
                className="absolute right-0 top-full mt-1 bg-white/95 backdrop-blur-xl rounded-xl border border-dark-royalty/20 shadow-xl min-w-[120px]" 
                style={{ zIndex: 9999 }}
                data-dropdown-menu
              >
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
      
      {/* Remove portal dropdown menu */}
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
  handleEditSegment: (id: string) => void;
  handleDeleteSegment: (id: string) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
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
  handleEditSegment,
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
        className="relative min-h-[600px] bg-gradient-to-br from-deep-sea/10 via-white to-kimchi/10 rounded-3xl p-8 border-2 border-dashed border-dark-royalty/20"
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
                handleEditSegment={handleEditSegment}
                handleDeleteSegment={handleDeleteSegment}
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