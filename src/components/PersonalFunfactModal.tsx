"use client";

import { useState, useEffect } from "react";
import { Guest } from "../types/event";

interface PersonalFunfactModalProps {
  isOpen: boolean;
  onClose: () => void;
  guests: Guest[];
  funFacts?: Record<string, string>; // guestId -> funFact
  onSave: (funFacts: Record<string, string>) => void;
}

export default function PersonalFunfactModal({ 
  isOpen, 
  onClose, 
  guests, 
  funFacts = {}, 
  onSave 
}: PersonalFunfactModalProps) {
  const [editFunFacts, setEditFunFacts] = useState<Record<string, string>>(funFacts);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEditFunFacts(funFacts);
    }
  }, [isOpen, funFacts]);

  const handleSave = () => {
    onSave(editFunFacts);
    onClose();
  };

  const handleCancel = () => {
    setEditFunFacts(funFacts);
    onClose();
  };

  const handleFunFactChange = (guestId: string, funFact: string) => {
    setEditFunFacts(prev => ({
      ...prev,
      [guestId]: funFact
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const hasAnyFunFacts = Object.values(editFunFacts).some(fact => fact.trim() !== "");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="text-3xl animate-bounce">👥</div>
            <div>
              <h2 className="text-3xl font-bold text-dark-royalty">Personal Fun Facts</h2>
              <p className="text-base text-deep-sea/60">Add fun facts about each guest</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-deep-sea/60 hover:text-dark-royalty transition-colors p-2 rounded-lg hover:bg-deep-sea/10 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {guests.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-deep-sea/70 mb-2 text-lg">No guests added yet</p>
              <p className="text-base text-deep-sea/50">Add guests first to create personal fun facts</p>
            </div>
          ) : (
            guests.map((guest) => (
              <div key={guest.id} className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-xl p-5 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-300">
                <label className="block text-xl font-medium text-dark-royalty mb-3">
                  <span className="text-2xl">{guest.name}</span>
                </label>
                <textarea
                  value={editFunFacts[guest.id] || ""}
                  onChange={(e) => handleFunFactChange(guest.id, e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-dark-royalty/20 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300 resize-none text-lg"
                  placeholder={`e.g., I once wrestled a reindeer 🦌`}
                />
                {editFunFacts[guest.id] && (
                  <div className="mt-2 text-base text-deep-sea/50">
                    💡 Make it interesting and conversation-starting!
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex space-x-4 mt-6 pt-4 border-t border-dark-royalty/10">
          <button
            onClick={handleCancel}
            className="flex-1 px-6 py-3 bg-white/50 text-dark-royalty rounded-lg hover:bg-white/70 transition-all duration-300 text-lg font-medium border border-dark-royalty/20"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasAnyFunFacts}
            className="flex-1 px-6 py-3 bg-dark-royalty text-white rounded-lg hover:bg-dark-royalty/90 transition-all duration-300 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Fun Facts
          </button>
        </div>

        {/* Help text */}
        <div className="mt-4 text-center">
          <p className="text-base text-deep-sea/50">
            💡 Each fun fact becomes a 2-minute guessing game
          </p>
        </div>
      </div>
    </div>
  );
} 