import React, { useState } from 'react';
import { Event, Guest } from '../../../types/event';

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onEventUpdate: (event: Event) => void;
}

const AddGuestModal: React.FC<AddGuestModalProps> = ({
  isOpen,
  onClose,
  event,
  onEventUpdate
}) => {
  const [guestName, setGuestName] = useState("");

  const handleAddGuest = (addAnother: boolean = false) => {
    if (!guestName.trim()) return;

    const newGuest: Guest = {
      id: Date.now().toString(),
      name: guestName.trim(),
      relationship: "Guest"
    };

    const updatedEvent: Event = {
      ...event,
      guests: [...event.guests, newGuest]
    };

    onEventUpdate(updatedEvent);
    
    setGuestName("");
    
    if (!addAnother) {
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && guestName.trim()) {
      e.preventDefault();
      handleAddGuest(true);
    }
  };

  const handleClose = () => {
    setGuestName("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-dark-royalty/20 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-dark-royalty">Add New Guest</h2>
          <button
            onClick={handleClose}
            className="text-deep-sea/60 hover:text-dark-royalty transition-colors text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-deep-sea mb-2">
              Name *
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
              placeholder="Enter guest name (press Enter to add)"
            />
          </div>
        </div>
        
        <div className="flex space-x-4 mt-8">
          <button
            onClick={handleClose}
            className="flex-1 px-6 py-2 bg-white/50 text-dark-royalty rounded-xl hover:bg-white/70 transition-all duration-300 font-medium border border-dark-royalty/20"
          >
            Cancel
          </button>
          <button
            onClick={() => handleAddGuest(false)}
            disabled={!guestName.trim()}
            className="flex-1 px-6 py-2 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGuestModal; 