import React, { useState } from 'react';
import { Event } from '../../../types/event';

interface GuestsProps {
  event: Event;
  onEventUpdate: (event: Event) => void;
  setShowAddGuestModal: (show: boolean) => void;
}

const Guests: React.FC<GuestsProps> = ({
  event,
  onEventUpdate,
  setShowAddGuestModal
}) => {
  const [editingGuest, setEditingGuest] = useState<string | null>(null);
  const [editGuestName, setEditGuestName] = useState("");

  const handleEditGuest = (guestId: string) => {
    if (!event) return;
    const guest = event.guests.find(g => g.id === guestId);
    if (guest) {
      setEditingGuest(guestId);
      setEditGuestName(guest.name);
    }
  };

  const handleSaveEdit = (guestId: string) => {
    if (editGuestName.trim() && event) {
      const updatedEvent: Event = {
        ...event,
        guests: event.guests.map(guest => 
          guest.id === guestId 
            ? { ...guest, name: editGuestName.trim() }
            : guest
        ),
      };
      
      onEventUpdate(updatedEvent);
      
      setEditingGuest(null);
      setEditGuestName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingGuest(null);
    setEditGuestName("");
  };



  const handleDeleteGuest = (guestId: string) => {
    const updatedEvent: Event = {
      ...event,
      guests: event.guests.filter(guest => guest.id !== guestId)
    };
    
    onEventUpdate(updatedEvent);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-dark-royalty">Guest List</h2>
          <p className="text-deep-sea/70 mt-2">Manage your event attendees and their details</p>
        </div>
        <button 
          onClick={() => setShowAddGuestModal(true)}
          className="px-6 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 hover:scale-105 font-medium"
        >
          + Add Guest
        </button>
      </div>
      
      {event.guests.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-8xl mb-6 animate-bounce">👥</div>
          <h3 className="text-2xl font-bold text-dark-royalty mb-3">No Guests Yet</h3>
          <p className="text-deep-sea/70 mb-8 max-w-md mx-auto">Start building your guest list to get personalized AI content and better event planning recommendations.</p>
          <button 
            onClick={() => setShowAddGuestModal(true)}
            className="px-8 py-4 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 hover:scale-105 font-medium"
          >
            Add Your First Guest
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {event.guests.map((guest) => (
            <div key={guest.id} className="group bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-300 hover:shadow-lg hover:bg-white/90">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-deep-sea/30 to-dark-royalty/30 rounded-full flex items-center justify-center text-lg font-bold text-dark-royalty group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                  {guest.name.charAt(0)}
                </div>
                
                <div className="flex-1 min-w-0">
                  {editingGuest === guest.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editGuestName}
                        onChange={(e) => setEditGuestName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(guest.id);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300 text-base font-semibold text-dark-royalty"
                        placeholder="Enter guest name"
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveEdit(guest.id)}
                          disabled={!editGuestName.trim()}
                          className="px-3 py-1 bg-dark-royalty text-white rounded-lg hover:bg-dark-royalty/90 transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-white/50 text-dark-royalty rounded-lg hover:bg-white/70 transition-all duration-300 text-sm font-medium border border-dark-royalty/20"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-base font-semibold text-dark-royalty group-hover:text-deep-sea transition-colors truncate">
                        {guest.name}
                      </h4>
                      <p className="text-sm text-deep-sea/60 truncate">
                        {guest.relationship}
                      </p>
                    </>
                  )}
                </div>
                
                {editingGuest !== guest.id && (
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button 
                      onClick={() => handleEditGuest(guest.id)}
                      className="p-2 text-deep-sea/60 hover:text-dark-royalty transition-colors rounded-lg hover:bg-deep-sea/10"
                      title="Edit guest"
                    >
                      <span className="text-sm">✏️</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteGuest(guest.id)}
                      className="p-2 text-deep-sea/60 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      title="Delete guest"
                    >
                      <span className="text-sm">🗑️</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Guests; 