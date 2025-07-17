import React from 'react';
import { SegmentType } from '../types/event';

interface AddSegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  newSegment: {
    title: string;
    description: string;
    duration: string;
    type: SegmentType;
    personalFunFacts: Record<string, string>;
  };
  setNewSegment: (segment: {
    title: string;
    description: string;
    duration: string;
    type: SegmentType;
    personalFunFacts: Record<string, string>;
  }) => void;
  onAddSegment: () => void;
}

const AddSegmentModal: React.FC<AddSegmentModalProps> = ({
  isOpen,
  onClose,
  newSegment,
  setNewSegment,
  onAddSegment
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-dark-royalty/20 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-dark-royalty">Add Program Segment</h2>
          <button
            onClick={onClose}
            className="text-deep-sea/60 hover:text-dark-royalty transition-colors text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-deep-sea mb-2">
              Segment Title *
            </label>
            <input
              type="text"
              value={newSegment.title}
              onChange={(e) => setNewSegment({ ...newSegment, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
              placeholder="e.g., Welcome Speech, Ice Breaker Game"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-sea mb-2">
              Description
            </label>
            <textarea
              value={newSegment.description}
              onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })}
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
                value={newSegment.duration}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || (!isNaN(Number(value)) && Number(value) > 0)) {
                    setNewSegment({ ...newSegment, duration: value });
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
                value={newSegment.type}
                onChange={(e) => setNewSegment({ ...newSegment, type: e.target.value as SegmentType })}
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
        </div>
        
        <div className="flex space-x-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white/50 text-dark-royalty rounded-xl hover:bg-white/70 transition-all duration-300 font-medium border border-dark-royalty/20"
          >
            Cancel
          </button>
          <button
            onClick={onAddSegment}
            disabled={!newSegment.title || !newSegment.duration || isNaN(Number(newSegment.duration)) || Number(newSegment.duration) <= 0}
            className="flex-1 px-6 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Segment
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSegmentModal; 