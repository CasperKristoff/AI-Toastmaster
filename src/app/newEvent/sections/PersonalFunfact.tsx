"use client";

import { useState, useEffect } from "react";
import { Guest } from "../../../types/event";

interface PersonalFunfactProps {
  guests: Guest[];
  funFacts?: Record<string, string>; // guestId -> funFact
  onFunFactsChange?: (funFacts: Record<string, string>) => void;
  isEditable?: boolean;
  isModal?: boolean; // New prop to control modal behavior
  isOpen?: boolean; // For modal mode
  onClose?: () => void; // For modal mode
}

export default function PersonalFunfact({ 
  guests, 
  funFacts = {}, 
  onFunFactsChange, 
  isEditable = false,
  isModal = false,
  isOpen = false,
  onClose
}: PersonalFunfactProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editFunFacts, setEditFunFacts] = useState<Record<string, string>>(funFacts);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isModal && isOpen) {
      setEditFunFacts(funFacts);
    }
  }, [isModal, isOpen, funFacts]);

  const handleSave = () => {
    if (onFunFactsChange) {
      onFunFactsChange(editFunFacts);
    }
    setIsEditing(false);
    if (isModal && onClose) {
      onClose();
    }
  };

  const handleCancel = () => {
    setEditFunFacts(funFacts);
    setIsEditing(false);
    if (isModal && onClose) {
      onClose();
    }
  };

  const handleFunFactChange = (guestId: string, funFact: string) => {
    setEditFunFacts(prev => ({
      ...prev,
      [guestId]: funFact
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isModal && e.ctrlKey) {
        handleSave();
      } else if (!isModal) {
        handleSave();
      }
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const hasAnyFunFacts = Object.values(funFacts).some(fact => fact.trim() !== "");
  const hasAnyEditFunFacts = Object.values(editFunFacts).some(fact => fact.trim() !== "");

  // Modal mode
  if (isModal) {
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
              disabled={!hasAnyEditFunFacts}
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

  // Inline mode (original functionality)
  return (
    <div className="bg-gradient-to-br from-kimchi/20 to-deep-sea/10 rounded-2xl p-6 border-2 border-dashed border-kimchi/30 hover:border-kimchi/50 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-3xl animate-bounce">👥</div>
          <h3 className="text-lg font-bold text-dark-royalty">Personal Fun Facts</h3>
        </div>
        {isEditable && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-deep-sea/60 hover:text-dark-royalty transition-colors p-2 rounded-lg hover:bg-deep-sea/10"
            title="Edit personal fun facts"
          >
            ✏️
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <p className="text-sm text-deep-sea/70 mb-4">
            Add fun facts about each guest for this segment...
          </p>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {guests.map((guest) => (
              <div key={guest.id} className="bg-white/50 rounded-lg p-3">
                <label className="block text-sm font-medium text-deep-sea mb-2">
                  {guest.name}
                </label>
                <textarea
                  value={editFunFacts[guest.id] || ""}
                  onChange={(e) => handleFunFactChange(guest.id, e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-dark-royalty/20 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300 resize-none text-sm"
                  placeholder={`Fun fact about ${guest.name}...`}
                />
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-dark-royalty text-white rounded-lg hover:bg-dark-royalty/90 transition-all duration-300 text-sm font-medium"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-white/50 text-dark-royalty rounded-lg hover:bg-white/70 transition-all duration-300 text-sm font-medium border border-dark-royalty/20"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {hasAnyFunFacts ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {guests.map((guest) => {
                const funFact = funFacts[guest.id];
                if (!funFact || funFact.trim() === "") return null;
                
                return (
                  <div key={guest.id} className="bg-white/50 rounded-lg p-3">
                    <div className="font-medium text-dark-royalty text-sm mb-1">
                      {guest.name}
                    </div>
                    <p className="text-deep-sea/80 text-sm italic">"{funFact}"</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-deep-sea/60 italic">No personal fun facts added yet...</p>
          )}
          {isEditable && !hasAnyFunFacts && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-deep-sea/60 hover:text-dark-royalty transition-colors underline"
            >
              Add personal fun facts →
            </button>
          )}
        </div>
      )}

      {/* Decorative elements */}
      <div className="absolute top-2 right-2 text-xs opacity-30">✨</div>
      <div className="absolute bottom-2 left-2 text-xs opacity-30">🎉</div>
    </div>
  );
} 